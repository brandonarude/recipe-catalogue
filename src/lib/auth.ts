import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as never,
  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      apiKey: process.env.RESEND_API_KEY,
    }),
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // Resolve id and role from the database on sign-in or if role is
      // missing (e.g. token issued before this callback was added).
      // Using email as the lookup key works for both magic-link and OAuth.
      if (user || !token.role) {
        const email = (user?.email ?? token.email) as string | undefined;
        if (email) {
          const dbUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    async signIn({ user, account }) {
      // For OAuth providers, only allow sign-in if the admin has already
      // added the user's email to the database.
      if (account?.type === "oidc" || account?.type === "oauth") {
        if (!user.email) return false;
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        return !!existing;
      }
      return true;
    },
  },
});
