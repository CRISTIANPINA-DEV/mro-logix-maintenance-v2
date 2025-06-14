import { ForgotPassword } from "@/app/forgot-password/forgot-password";
import Footer from "@/components/footer";
import Header1 from "@/components/header";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header1 />
      <div className="pt-14">
        <ForgotPassword />
      </div>
      <Footer />
    </main>
  );
} 