"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, KeyRound, Loader2, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Checkbox } from "@/components/ui/checkbox";

export const SignIn = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidIdentifier, setIsValidIdentifier] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load saved credentials if they exist
    const savedCredentials = localStorage.getItem("savedCredentials");
    if (savedCredentials) {
      const { identifier: savedIdentifier } = JSON.parse(savedCredentials);
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const validateIdentifier = (value: string) => {
    // Allow any non-empty string for the identifier (email or username)
    return value.trim() !== "";
  };

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdentifier(value);
    setIsValidIdentifier(validateIdentifier(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier || !password) {
      toast.error("Please enter your email/username and password");
      return;
    }
    
    if (!isValidIdentifier) {
      toast.error("Please enter a valid email or username");
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Invalid credentials');
      }
      
      // If remember me is checked, save the credentials
      if (rememberMe) {
        localStorage.setItem("savedCredentials", JSON.stringify({ identifier }));
      } else {
        localStorage.removeItem("savedCredentials");
      }

      // Success! Redirect to dashboard
      toast.success("Sign in successful");
      router.push("/dashboard");
      
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred during sign in");
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
                <Badge>Sign In</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Welcome Back
                </h4>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-sm text-left">
                  Sign in to your account to manage your aircraft maintenance operations.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <form onSubmit={handleSubmit} className="rounded-md w-full max-w-2xl flex flex-col border p-8 gap-4">
              <h3 className="text-xl font-semibold">Sign in to your account</h3>
              
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="identifier" className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" strokeWidth={1.5} />
                  Email or Username
                </Label>
                <Input 
                  id="identifier" 
                  type="text" 
                  value={identifier}
                  onChange={handleIdentifierChange}
                  placeholder="Enter your email or username"
                  className={identifier && !isValidIdentifier ? "border-red-500" : ""}
                />
                {identifier && !isValidIdentifier && (
                  <p className="text-sm text-red-500 mt-1">
                    Please enter a valid email or username
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                  Password
                </Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button 
                type="submit" 
                className="gap-4 w-full mt-4" 
                aria-label="Sign in"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground mt-2">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Create account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 