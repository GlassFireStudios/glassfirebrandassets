import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Google sign-in restricted to the company Workspace domain. Reads
// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET from the environment.
// When AUTH_GOOGLE_ID is unset, the app falls back to the shared password gate
// (see middleware) so nothing breaks before Google is configured.
const DOMAIN = (process.env.AUTH_ALLOWED_DOMAIN || "glassfire.co").toLowerCase();

export const googleConfigured = !!process.env.AUTH_GOOGLE_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: googleConfigured ? [Google] : [],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ profile }) {
      const email = (profile?.email || "").toLowerCase();
      return email.endsWith("@" + DOMAIN);
    },
  },
});
