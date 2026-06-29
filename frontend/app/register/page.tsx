"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { User, Mail, KeyRound, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Auto-focus name field on load
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      confirmPasswordRef.current?.focus();
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register(name, email, password);
      toast.success("Account created successfully! Please login.");
      router.push("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed. Try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation focus handlers
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      emailRef.current?.focus();
    }
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmPasswordRef.current?.focus();
    }
  };

  const handleConfirmPasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitRef.current?.click();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tally-dark via-[#152335] to-[#0d1622] p-4 font-mono select-none">
      {/* Registration Card Styled like Tally Dialog Box */}
      <div className="w-full max-w-md bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in">
        {/* Tally Styled Header */}
        <div className="bg-[#1e3a4f] text-[#ffb347] px-6 py-3 flex items-center justify-between border-b border-[#2a5470]">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#ffb347]" />
            <span className="text-xs font-bold uppercase tracking-wider">SmartERP Registration</span>
          </div>
          <span className="text-[10px] text-tally-text-muted">SmartERP v1.0</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[#1e3a4f]">
          <div className="text-center pb-1">
            <h1 className="text-base font-bold text-[#1e3a4f]">Create New Operator Account</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">Please register your company administrator/operator details</p>
          </div>

          {/* Name Field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold flex items-center gap-1.5">
              <User size={12} className="text-[#1e3a4f]/70" />
              <span>Full Name:</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              required
              disabled={submitting}
              placeholder="e.g. John Doe"
              className="w-full bg-white border border-[#1e3a4f]/30 p-2 text-xs font-bold text-tally-dark focus:outline-none focus:border-tally-accent"
            />
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold flex items-center gap-1.5">
              <Mail size={12} className="text-[#1e3a4f]/70" />
              <span>Email Address:</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              required
              disabled={submitting}
              placeholder="e.g. operator@domain.com"
              className="w-full bg-white border border-[#1e3a4f]/30 p-2 text-xs font-bold text-tally-dark focus:outline-none focus:border-tally-accent"
            />
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold flex items-center gap-1.5">
              <KeyRound size={12} className="text-[#1e3a4f]/70" />
              <span>Password (min. 6 chars):</span>
            </label>
            <input
              ref={passwordRef}
              type={showPasswords ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              required
              disabled={submitting}
              placeholder="••••••••"
              className="w-full bg-white border border-[#1e3a4f]/30 p-2 text-xs font-bold text-tally-dark focus:outline-none focus:border-tally-accent"
            />
          </div>

          {/* Confirm Password field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold flex items-center gap-1.5">
              <KeyRound size={12} className="text-[#1e3a4f]/70" />
              <span>Confirm Password:</span>
            </label>
            <input
              ref={confirmPasswordRef}
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleConfirmPasswordKeyDown}
              required
              disabled={submitting}
              placeholder="••••••••"
              className="w-full bg-white border border-[#1e3a4f]/30 p-2 text-xs font-bold text-tally-dark focus:outline-none focus:border-tally-accent"
            />
            {/* Show Passwords Option */}
            <div className="flex items-center justify-end text-[10px] text-gray-500 mt-1 select-none">
              <label className="flex items-center gap-1 cursor-pointer hover:text-[#1e3a4f]">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#1e3a4f] cursor-pointer"
                />
                <span className="font-bold">Show Passwords</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              ref={submitRef}
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-[#1e3a4f] text-[#ffb347] border border-[#ffb347]/30 hover:bg-[#15293a] active:scale-[0.99] font-bold text-xs uppercase tracking-wider rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <span>{submitting ? "Registering..." : "Accept & Register"}</span>
            </button>
          </div>
        </form>

        {/* Footer Redirect link */}
        <div className="border-t border-[#1e3a4f]/10 bg-white/40 p-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1e3a4f] hover:text-[#00a8cc] transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Already have an account? Login Gateway</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
