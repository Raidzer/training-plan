import NextAuth from "next-auth";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db/client";
import { users } from "./db/schema";

const schema = z.object({
  email: z.string().trim().min(2).max(255),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  ...(process.env.NEXTAUTH_SECRET
    ? { secret: process.env.NEXTAUTH_SECRET }
    : {}),
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
        const [user] = await db
          .select()
          .from(users)
          .where(or(eq(users.email, identifier), eq(users.login, identifier)));
        if (!user) {
          return null;
        }
        if (!user.isActive) {
          return null;
        }
        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!ok) {
          return null;
        }
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      (session as any).user = {
        ...session.user,
        id: token.sub,
        role: (token as any).role,
      };
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
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

  const userId = Number((session.user as { id?: string } | undefined)?.id);
  if (!Number.isFinite(userId)) {
    return null;
  }

  const [user] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId));

  if (!user || !user.isActive) {
    return null;
  }

  return session;
};

const handler = NextAuth(authOptions);
export { handler };
