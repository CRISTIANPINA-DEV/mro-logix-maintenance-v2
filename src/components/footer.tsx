"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "INFORMATION",
      links: [
        { name: "Pricing", href: "#" },
        { name: "Reviews", href: "#" },
        { name: "Affiliate program", href: "#" },
        { name: "Referral program", href: "#" },
        { name: "System status", href: "#" },
        { name: "Sitemap", href: "#" },
      ],
    },
    {
      title: "COMPANY",
      links: [
        { name: "About Aviation Logix", href: "#" },
        { name: "Our technology", href: "#" },
        { name: "Career", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Sustainability", href: "#" },
        { name: "Principles", href: "#" },
      ],
    },
    {
      title: "SUPPORT",
      links: [
        { name: "Tutorials", href: "#" },
        { name: "Knowledge Base", href: "#" },
        { name: "Contact us", href: "#" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-background border-t pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Information, Company, and Support sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium text-sm mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter section */}
          <div>
            <h3 className="font-medium text-sm mb-4">NEWSLETTER</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Stay updated on new releases and features, guides, and case studies
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="you@domain.com" 
                className="bg-background" 
              />
              <Button className="w-full">Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom section with logo, payment methods, and social links */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div>
            {/* Replace with actual logo component or image */}
            <div className="h-12 w-32">
              {/* Logo placeholder - replace with actual logo */}
              <span className="text-lg font-bold">MRO Logix</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              &copy; 2025 MRO Logix Aviation Maintenance - All rights reserved 2025
            </p>
          </div>

          {/* Payment methods */}
          <div className="flex gap-2">
            {/* Payment method images */}
            <div className="h-8 w-12 bg-muted rounded flex items-center justify-center overflow-hidden">
              <Image src="/visa.webp" alt="Visa" width={56} height={36} />
            </div>
            <div className="h-8 w-12 bg-muted rounded flex items-center justify-center">
              <Image src="/mastercard.webp" alt="Mastercard" width={56} height={36} />
            </div>
            <div className="h-8 w-12 bg-muted rounded flex items-center justify-center">
              <Image src="/amex.webp" alt="AMEX" width={56} height={36} />
            </div>
            <div className="h-8 w-12 bg-muted rounded flex items-center justify-center">
              <Image src="/discover.webp" alt="Discover" width={56} height={36} />
            </div>
            <div className="h-8 w-12 bg-muted rounded flex items-center justify-center">
              <Image src="/paypal.webp" alt="PayPal" width={56} height={36} />
            </div>
          </div>

          {/* Social links */}
          <div className="flex gap-4">
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="Facebook">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="Instagram">
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="YouTube">
              <Youtube className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>
        </div>

        {/* Legal links */}
        <div className="flex justify-center md:justify-end mt-6 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-foreground mr-4">Privacy policy</Link>
          <Link href="#" className="hover:text-foreground mr-4">Refund policy</Link>
          <Link href="#" className="hover:text-foreground">Terms of service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;