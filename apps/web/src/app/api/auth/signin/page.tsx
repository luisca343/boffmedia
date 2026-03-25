import { Suspense } from 'react';
import { AuthForm } from "@/app/auth/AuthForm";

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm redirect="/" />
    </Suspense>
  );
}