"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === "" || emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(validateEmail(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    if (!isValidEmail) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset instructions');
      }
      
      setIsSubmitted(true);
      toast.success(data.message || "If an account exists with this email, you will receive password reset instructions.");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <Badge>Reset Password</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Forgot your password?
                </h4>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-sm text-left">
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <div className="rounded-md w-full max-w-2xl flex flex-col border p-8 gap-4">
              {!isSubmitted ? (
                <>
                  <h3 className="text-xl font-semibold">Reset your password</h3>
                  
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" strokeWidth={1.5} />
                        Email address
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="Enter your email address"
                        className={email && !isValidEmail ? "border-red-500" : ""}
                      />
                      {email && !isValidEmail && (
                        <p className="text-sm text-red-500 mt-1">
                          Please enter a valid email address
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="gap-4 w-full mt-4" 
                      disabled={loading || !email || !isValidEmail}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send reset instructions
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Mail className="h-12 w-12 text-primary" strokeWidth={1.5} />
                  <h3 className="text-xl font-semibold text-center">Check your email</h3>
                  <p className="text-center text-muted-foreground">
                    We&apos;ve sent password reset instructions to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <Link 
                  href="/signin" 
                  className="text-sm text-primary hover:underline inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 