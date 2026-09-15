import { SignupScreen } from "@/components/auth/SignupScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입",
};

export default function SignupPage() {
  return <SignupScreen />;
}
