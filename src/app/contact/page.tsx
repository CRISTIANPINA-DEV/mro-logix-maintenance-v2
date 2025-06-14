import { Contact } from "@/app/contact/contact";
import Footer from "@/components/footer";

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="pt-14">
        <Contact />
      </div>
      <Footer />
    </main>
  );
}
