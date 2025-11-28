import NextAuth from "next-auth";
import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db/client";
import { users } from "./db/schema";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const parsed = schema.safeParse(creds);
        if (!parsed.success) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email));
        if (!user) return null;
        const ok = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!ok) return null;
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
      if (user) token.role = (user as any).role;
      return token;
    },
  },
};

export const auth = () => getServerSession(authOptions);

const handler = NextAuth(authOptions);
export { handler };
