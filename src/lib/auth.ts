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
