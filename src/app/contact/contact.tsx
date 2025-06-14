"use client";

import { Check, MoveRight} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Contact = () => {

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <Badge>Contact</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  MRO Logix Maintenance
                </h4>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-sm text-left">
                  Streamline your MRO operations with our comprehensive aircraft maintenance management platform.
                  Reduce downtime, improve efficiency, and ensure compliance with regulatory requirements.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start text-left">
                <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p>Easy to use</p>
                <p className="text-muted-foreground text-sm">
                  Our intuitive interface ensures you can get started without a learning curve.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start text-left">
                <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p>Fast and reliable</p>
                <p className="text-muted-foreground text-sm">
                  Experience quick response times and dependable service you can count on.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start text-left">
                <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p>Beautiful and modern</p>
                <p className="text-muted-foreground text-sm">
                  Enjoy a sleek, contemporary design that enhances your workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <div className="rounded-md w-full max-w-2xl flex flex-col border p-8 gap-4">
              <h3 className="text-xl font-semibold">Contact us</h3>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="firstname">First name</Label>
                <Input id="firstname" type="text" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="lastname">Last name</Label>
                <Input id="lastname" type="text" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="comment">Comment</Label>
                <Textarea id="comment" placeholder="Your message here..." className="min-h-[100px]" />
              </div>

              <Button className="gap-4 w-full mt-2" aria-label="Send message">
                Send message <MoveRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};