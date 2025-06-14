"use client";

import { Check, MoveRight, User, KeyRound, UserCircle2, Eye, EyeOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const DISALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'tutanota.com',
  'fastmail.com',
  'inbox.com'
];

export const Register = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isValidatingDomain, setIsValidatingDomain] = useState(false);
  const [domainValidationTimeout, setDomainValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    setFirstName(value);
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = capitalizeFirstLetter(e.target.value);
    setLastName(value);
  };

  useEffect(() => {
    if (firstName && lastName) {
      const username = `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}`;
      setGeneratedUsername(username);
    } else {
      setGeneratedUsername("");
    }
  }, [firstName, lastName]);

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(password === value || value === "");
  };

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

  const allRequirementsMet = Object.values(passwordRequirements).every(req => req);

  const validateEmailDomain = async (email: string): Promise<boolean> => {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    // First check against disallowed domains
    if (DISALLOWED_DOMAINS.includes(domain)) {
      setEmailError('Please use a business email address');
      return false;
    }

    // Then verify domain existence
    try {
      setIsValidatingDomain(true);
      const response = await fetch('/api/verify-email-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!data.isValid) {
        setEmailError(data.error || 'Invalid email domain');
        return false;
      }

      setEmailError(null);
      return true;
    } catch (error) {
      console.error('Domain validation error:', error);
      setEmailError('Unable to verify email domain');
      return false;
    } finally {
      setIsValidatingDomain(false);
    }
  };

  const validateEmail = async (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    // Clear any existing timeout
    if (domainValidationTimeout) {
      clearTimeout(domainValidationTimeout);
    }

    // Set a new timeout to debounce the domain validation
    const timeout = setTimeout(async () => {
      const isDomainValid = await validateEmailDomain(email);
      setIsValidEmail(isDomainValid);
    }, 1000); // Wait 1 second after user stops typing

    setDomainValidationTimeout(timeout);
    return true; // Return true initially to allow typing
  };

  const extractCompanyFromEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return null;
    
    const domain = email.split('@')[1];
    if (!domain) return null;
    
    return domain.split('.')[0];
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value === "") {
      setIsValidEmail(true);
      setEmailError(null);
      setCompanyName(null);
      return;
    }

    // Extract and set company name
    const company = extractCompanyFromEmail(value);
    setCompanyName(company);

    const isFormatValid = await validateEmail(value);
    if (!isFormatValid) {
      setIsValidEmail(false);
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (domainValidationTimeout) {
        clearTimeout(domainValidationTimeout);
      }
    };
  }, [domainValidationTimeout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!isValidEmail) {
      toast.error(emailError || "Please enter a valid email address");
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
    
    if (!privacyAccepted || !termsAccepted) {
      toast.error("You must accept both the privacy policy and terms of service");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username: generatedUsername,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Registration successful, redirect to PIN verification page
      toast.success("Registration successful! Please verify your email.");
      router.push(`/verify?userId=${data.userId}&pinCreatedAt=${data.pinCreatedAt}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <Badge>Register</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-regular">
                  Join MRO Logix
                </h4>
                <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-sm text-left">
                  Create your account and start streamlining your aircraft maintenance operations today.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start text-left">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p>Secure data storage</p>
                <p className="text-muted-foreground text-sm">
                  Your information is encrypted and securely stored in our database.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start text-left">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p>Personalized dashboard</p>
                <p className="text-muted-foreground text-sm">
                  Access your customized maintenance dashboard immediately after registration.
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start text-left">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p>Seamless integration</p>
                <p className="text-muted-foreground text-sm">
                  Integrate with your existing systems and start managing your maintenance tasks right away.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <form onSubmit={handleSubmit} className="rounded-md w-full max-w-2xl flex flex-col border p-8 gap-4">
              <h3 className="text-xl font-semibold">Create your account</h3>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="firstname" className="flex items-center gap-2">
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  First name
                </Label>
                <Input 
                  id="firstname" 
                  type="text" 
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={handleFirstNameChange}
                />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="lastname" className="flex items-center gap-2">
                  <User className="h-4 w-4" strokeWidth={1.5} />
                  Last name
                </Label>
                <Input 
                  id="lastname" 
                  type="text" 
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={handleLastNameChange}
                />
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" strokeWidth={1.5} />
                  Username (auto-generated)
                </Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={generatedUsername}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="Will be generated from your name"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Username will be first initial followed by last name (e.g., j.smith)
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your business email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`${!isValidEmail ? "border-red-500" : ""} ${isValidatingDomain ? "pr-10" : ""}`}
                    disabled={isValidatingDomain}
                  />
                  {isValidatingDomain && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {!isValidEmail && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
                  {companyName && isValidEmail && (
                    <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      Company: {companyName} (will be created if it doesn't exist)
                    </p>
                  )}
                </div>
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
                    onChange={handlePasswordChange}
                    placeholder="Enter a strong password"
                    className={password && !allRequirementsMet ? "border-red-500" : ""}
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
                  <div className="mt-2 space-y-2 text-sm">
                    <p className="font-medium text-muted-foreground">Password requirements:</p>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        {passwordRequirements.length ? (
                          <Check className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                        ) : (
                          <X className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                        )}
                        <span className={passwordRequirements.length ? "text-green-500" : "text-red-500"}>
                          At least 12 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.uppercase ? (
                          <Check className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                        ) : (
                          <X className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                        )}
                        <span className={passwordRequirements.uppercase ? "text-green-500" : "text-red-500"}>
                          At least one uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.number ? (
                          <Check className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                        ) : (
                          <X className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                        )}
                        <span className={passwordRequirements.number ? "text-green-500" : "text-red-500"}>
                          At least one number
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {passwordRequirements.special ? (
                          <Check className="h-4 w-4 text-green-500" strokeWidth={1.5} />
                        ) : (
                          <X className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                        )}
                        <span className={passwordRequirements.special ? "text-green-500" : "text-red-500"}>
                          At least one special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid w-full items-center gap-1">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" strokeWidth={1.5} />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Re-enter your password"
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
                {!passwordsMatch && confirmPassword !== "" && (
                  <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              
              <div className="flex flex-col space-y-4 mt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="privacy" 
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="privacy" 
                    className="text-sm leading-tight"
                  >
                    I agree to the{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      privacy policy
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="terms" 
                    className="text-sm leading-tight"
                  >
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      terms of service
                    </Link>
                  </Label>
                </div>
              </div>

              <Button 
                type="submit"
                className="gap-4 w-full mt-4" 
                aria-label="Create account"
                disabled={!privacyAccepted || !termsAccepted || isSubmitting}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'} <MoveRight className="w-4 h-4" />
              </Button>
              
              <p className="text-sm text-center text-muted-foreground mt-2">
                Already have an account?{" "}
                <Link href="/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 