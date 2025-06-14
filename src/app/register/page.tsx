import { Register } from "@/app/register/register";
import Footer from "@/components/footer";
import Header1 from "@/components/header";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header1 />
      <div className="pt-14">
        <Register />
      </div>
      <Footer />
    </main>
  );
} 