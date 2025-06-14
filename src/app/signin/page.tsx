import { SignIn } from "@/app/signin/signin";
import Footer from "@/components/footer";
import Header1 from "@/components/header";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header1 />
      <div className="pt-14">
        <SignIn />
      </div>
      <Footer />
    </main>
  );
} 