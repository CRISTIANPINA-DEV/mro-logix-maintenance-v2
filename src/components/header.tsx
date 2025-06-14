"use client";

import { Button } from "@/components/ui/button";
import {
NavigationMenu,
NavigationMenuContent,
NavigationMenuItem,
NavigationMenuLink,
NavigationMenuList,
NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, MoveRight, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const Header1 = () => {
const navigationItems = [
    {
    title: "Home",
    href: "/",
    description: "",
    },
    {
    title: "Tool",
    description: "Streamline your MRO operations.",
    items: [
        {
        title: "Flight Records",
        href: "#",
        },
        {
        title: "Statistics",
        href: "#",
        },
        {
        title: "Inventory Stock",
        href: "#",
        },
        {
        title: "Task Cards",
        href: "#",
        },
    ],
    },
    {
    title: "Resource",
    href: "#",
    description: "",
    mobileHidden: true,
    },
    {
    title: "Pricing",
    href: "#",
    description: "",
    mobileHidden: true,
    },
    {
    title: "About",
    href: "#",
    description: "",
    mobileHidden: true,
    },
];

const [isOpen, setOpen] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      isOpen &&
      menuRef.current && 
      buttonRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isOpen]);

return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
      <div className="container relative mx-auto min-h-14 flex items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-xl">MRO Logix</Link>
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="flex gap-4">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title} className={item.mobileHidden ? "hidden lg:block" : ""}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Link href={item.href}>
                        <Button variant="ghost">{item.title}</Button>
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <p className="text-base">{item.title}</p>
                              <p className="text-muted-foreground text-sm">
                                {item.description}
                              </p>
                            </div>
                            <Link href="/contact">
                              <Button size="sm" className="mt-10">
                                Book a call today
                              </Button>
                            </Link>
                          </div>
                          <div className="flex flex-col text-sm h-full justify-end">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink
                                href={subItem.href}
                                key={subItem.title}
                                className="flex justify-between items-center hover:bg-muted py-2 px-4 rounded"
                              >
                                <span>{subItem.title}</span>
                                <MoveRight className="w-4 h-4 text-muted-foreground" />
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-4">
            <Link href="/contact">
              <Button variant="ghost">Book a demo</Button>
            </Link>
            <div className="border-r h-6"></div>
            <Link href="/signin">
              <Button variant="outline">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get started</Button>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <Button 
            ref={buttonRef} 
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div 
            ref={menuRef} 
            className="absolute top-full left-0 right-0 border-t flex flex-col w-full bg-background shadow-lg py-4 px-6 gap-4"
          >
            {navigationItems.map((item) => (
              <div key={item.title} className="py-2">
                <div className="flex flex-col gap-2">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex justify-between items-center py-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-lg">{item.title}</span>
                      <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                    </Link>
                  ) : (
                    <>
                      <p className="text-lg font-medium">{item.title}</p>
                      {item.items && (
                        <div className="pl-4 flex flex-col gap-2">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.title}
                              href={subItem.href}
                              className="flex justify-between items-center py-2"
                              onClick={() => setOpen(false)}
                            >
                              <span className="text-muted-foreground">
                                {subItem.title}
                              </span>
                              <MoveRight className="w-4 h-4 stroke-1" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Mobile menu footer */}
            <div className="flex flex-col gap-4 mt-4 pt-4 border-t">
              <Link
                href="/contact"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  Book a demo
                </Button>
              </Link>
              <Link
                href="/signin"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link
                href="/register"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                <Button className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
);
};

export default Header1;