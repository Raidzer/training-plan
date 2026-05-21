import NextAuth from "next-auth";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserById, getUserByIdentifier } from "@/server/services/users";

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
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub! ?? null;
        session.user.role = token.role ?? null;
        session.user.emailVerified = token.emailVerified ?? null;
        session.user.name = token.name ?? null;
        session.user.lastName = token.lastName as string | null;
        session.user.email = token.email ?? null;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.lastName = user.lastName ?? null;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        token.sub = user.id;
      }

      if (trigger === "update" && session) {
        if (session.user) {
          // if (session.user.name !== undefined) token.name = session.user.name;
          // if (session.user.lastName !== undefined) token.lastName = session.user.lastName;
          // if (session.user.email !== undefined) token.email = session.user.email;
          // if (session.user.role !== undefined) token.role = session.user.role;
          // if (session.user.emailVerified !== undefined)
          //   token.emailVerified = session.user.emailVerified;
          token = { ...token, ...session.user };
        }
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
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  };
};

const handler = NextAuth(authOptions);
export { handler };
