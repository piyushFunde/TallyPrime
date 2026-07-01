"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
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

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      passwordRef.current?.focus();
      return;
    }

    if (!/\d/.test(password)) {
      toast.error("Password must contain at least one number");
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
    <div className="min-h-screen flex items-center justify-center blueprint-grid p-4 font-mono select-none">
      {/* Orange light source overlay */}
      <div className="blueprint-glow-orange" />

      {/* Redesigned Card Box based on user screenshot */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#f3ede2] border border-[#1b2b3a]/25 shadow-2xl rounded-md overflow-hidden tally-fade-in flex flex-col">
        
        {/* Card Header Bar */}
        <div className="bg-[#112130] text-[#8ca3b8] px-4 py-3 flex items-center justify-between border-b border-[#1b2b3a]/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#e68a00] flex items-center justify-center text-white font-extrabold text-[10px]">
              S
            </div>
            <span className="text-xs font-bold text-white tracking-wider font-sans">SmartERP</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold font-mono">v1.0</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-[#112130]">
          <div>
            <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none font-sans">
              Create your workspace
            </h1>
            <p className="text-[10px] text-gray-400 mt-2 font-mono leading-relaxed">
              You'll be the first operator – set up your company next.
            </p>
          </div>

          {/* Full Name field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 font-sans">
              Full name
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              required
              disabled={submitting}
              placeholder=""
              className="w-full bg-white border border-[#1b2b3a]/20 rounded-md p-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#e68a00] transition-colors"
            />
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 font-sans">
              Email
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              required
              disabled={submitting}
              placeholder="you@company.com"
              className="w-full bg-white border border-[#1b2b3a]/20 rounded-md p-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#e68a00] transition-colors"
            />
          </div>

          {/* Passwords grid from screenshot */}
          <div className="grid grid-cols-2 gap-3">
            {/* Password input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 font-sans">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPasswords ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  required
                  disabled={submitting}
                  placeholder="8+ characters"
                  className="w-full bg-white border border-[#1b2b3a]/20 rounded-md p-2 pl-2.5 pr-10 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#e68a00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-gray-400 hover:text-[#e68a00] font-sans uppercase select-none cursor-pointer"
                >
                  {showPasswords ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Confirm password input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-500 font-sans">
                Confirm password
              </label>
              <input
                ref={confirmPasswordRef}
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleConfirmPasswordKeyDown}
                required
                disabled={submitting}
                placeholder="Repeat password"
                className="w-full bg-white border border-[#1b2b3a]/20 rounded-md p-2 px-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#e68a00] transition-colors"
              />
            </div>
          </div>

          {/* Instruction helper text */}
          <p className="text-[9px] text-gray-400 mt-1 font-mono leading-tight">
            Use at least 8 characters, with one number.
          </p>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              ref={submitRef}
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-[#e68a00] hover:bg-[#cc7a00] text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <span>{submitting ? "Registering..." : "Create account"}</span>
            </button>
          </div>
        </form>

        {/* Footer links */}
        <div className="border-t border-[#1b2b3a]/10 bg-[#f6f2ea] p-4 text-center text-xs text-gray-500 font-sans mt-auto">
          <span>Already registered? </span>
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-500 hover:underline">
            Sign in instead
          </Link>
        </div>

        {/* Decorative thin bottom color stripe strip */}
        <div className="h-[3px] w-full flex shrink-0">
          <div className="flex-1 bg-sky-500" />
          <div className="flex-1 bg-teal-500" />
          <div className="flex-1 bg-emerald-500" />
          <div className="flex-1 bg-purple-500" />
          <div className="flex-1 bg-[#e68a00]" />
        </div>

      </div>
    </div>
  );
}
