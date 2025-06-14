"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, KeyRound, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [pinCreatedAt, setPinCreatedAt] = useState<string | null>(null);
  
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset token");
      router.push('/forgot-password');
    }
  }, [token, router]);

  const validatePassword = (value: string) => {
    setPasswordRequirements({
      length: value.length >= 12,
      uppercase: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(value)
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    setPasswordsMatch(confirmPassword === value || confirmPassword === "");
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(password === value || value === "");
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }
    
    if (!password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!allRequirementsMet) {
      toast.error("Password does not meet all requirements");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      // Show PIN input and store user ID
      setUserId(data.userId);
      setPinCreatedAt(data.pinCreatedAt);
      setShowPinInput(true);
      toast.success("Please enter the verification PIN sent to your email");
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !pin) {
      toast.error("Please enter the verification PIN");
      return;
    }
    
    if (pin.length !== 8) {
      toast.error("Please enter a valid 8-digit PIN");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pin,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify PIN');
      }
      
      toast.success("Password has been successfully reset");
      router.push('/signin');
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to verify PIN');
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
                  {showPinInput ? "Verify Your Identity" : "Create New Password"}
                </h4>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-sm text-left">
                  {showPinInput 
                    ? "Enter the 8-digit PIN sent to your email to complete the password reset."
                    : "Please enter your new password below."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <div className="rounded-md w-full max-w-2xl flex flex-col border p-8 gap-4">
              {!showPinInput ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid w-full items-center gap-1">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                      New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Enter your new password"
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
                    {password && (
                      <div className="mt-2 text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordRequirements.length ? (
                            <div className="w-4 h-4 rounded-full bg-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          )}
                          <span className={passwordRequirements.length ? "text-green-500" : "text-red-500"}>
                            At least 12 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.uppercase ? (
                            <div className="w-4 h-4 rounded-full bg-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          )}
                          <span className={passwordRequirements.uppercase ? "text-green-500" : "text-red-500"}>
                            At least one uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.number ? (
                            <div className="w-4 h-4 rounded-full bg-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          )}
                          <span className={passwordRequirements.number ? "text-green-500" : "text-red-500"}>
                            At least one number
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordRequirements.special ? (
                            <div className="w-4 h-4 rounded-full bg-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          )}
                          <span className={passwordRequirements.special ? "text-green-500" : "text-red-500"}>
                            At least one special character
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid w-full items-center gap-1">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder="Re-enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                        ) : (
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                    {!passwordsMatch && confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="gap-4 w-full mt-4" 
                    disabled={loading || !password || !confirmPassword || !passwordsMatch || !allRequirementsMet}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
                  <div className="grid w-full items-center gap-1">
                    <Label htmlFor="pin" className="flex items-center gap-2">
                      Verification PIN
                    </Label>
                    <Input 
                      id="pin" 
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter 8-digit PIN"
                      maxLength={8}
                      pattern="[0-9]*"
                      inputMode="numeric"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="gap-4 w-full mt-4" 
                    disabled={loading || !pin || pin.length !== 8}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify PIN
                  </Button>
                </form>
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