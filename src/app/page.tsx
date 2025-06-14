"use client";

import { Hero } from "../components/hero";
import { Features } from "@/components/features";
import Footer from "@/components/footer";
import { Case1 } from "@/components/cases";

export default function Home() {
  return (
    <div>
      <Hero />
      <Case1 />  
      <Features />
      <Footer />
    </div>
  );
}
