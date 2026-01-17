import NextAuth from "next-auth";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserById, getUserByIdentifier } from "./services/users";

const schema = z.object({
  email: z.string().trim().min(2).max(255),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  ...(process.env.NEXTAUTH_SECRET ? { secret: process.env.NEXTAUTH_SECRET } : {}),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email or login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const parsed = schema.safeParse(creds);
        if (!parsed.success) {
          return null;
        }
        const identifier = parsed.data.email;
        const user = await getUserByIdentifier(identifier);
        if (!user) {
          return null;
        }
        if (!user.isActive) {
          return null;
        }
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) {
          return null;
        }
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
  },
};

export const auth = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const userId = Number(session.user?.id);
  if (!Number.isFinite(userId)) {
    return null;
  }

  const user = await getUserById(userId);

  if (!user || !user.isActive) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      id: String(user.id),
      role: user.role,
      emailVerified: user.emailVerified,
    },
  };
};

const handler = NextAuth(authOptions);
export { handler };
