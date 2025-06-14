import { ResetPassword } from "@/app/reset-password/reset-password";
import Footer from "@/components/footer";
import Header1 from "@/components/header";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header1 />
      <div className="pt-14">
        <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]">Loading...</div>}>
          <ResetPassword />
        </Suspense>
      </div>
      <Footer />
    </main>
  );
} 