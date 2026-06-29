import { googleConfigured } from "@/auth";
import GoogleSignIn from "./GoogleSignIn";
import PasswordForm from "./PasswordForm";

// Google sign-in once it's configured; the shared-password form until then.
export default function LoginPage() {
  return googleConfigured ? <GoogleSignIn /> : <PasswordForm />;
}
