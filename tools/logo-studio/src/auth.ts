import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Google sign-in restricted to the company Workspace domain. Reads
// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET from the environment.
// Google mode requires BOTH the client id AND a secret — without AUTH_SECRET,
// Auth.js throws MissingSecret on every request (crashing the middleware and
// taking the whole site, including the public /m link, down). So we only flip
// to Google when both are present; a partial config falls back to the shared
// password gate instead of hard-failing.
const DOMAIN = (process.env.AUTH_ALLOWED_DOMAIN || "glassfire.co").toLowerCase();

export const googleConfigured = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_SECRET);

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
