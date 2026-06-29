"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, Mail, Zap } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Auto-focus email field on load
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;
    try {
      await login(email, password);
    } catch (err) {
      // toast is handled in AuthContext
    }
  };

  // Keyboard Navigation: Enter key shifts focus
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitRef.current?.click();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tally-dark via-[#152335] to-[#0d1622] p-4 font-mono select-none">
      {/* Outer Card Styled like Tally Dialog Box */}
      <div className="w-full max-w-md bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in">
        {/* Tally Styled Header */}
        <div className="bg-[#1e3a4f] text-[#ffb347] px-6 py-3 flex items-center justify-between border-b border-[#2a5470]">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#ffb347]" />
            <span className="text-xs font-bold uppercase tracking-wider">SmartERP Login Gateway</span>
          </div>
          <span className="text-[10px] text-tally-text-muted">SmartERP v1.0</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-[#1e3a4f]">
          <div className="text-center pb-2">
            <h1 className="text-base font-bold text-[#1e3a4f]">Enter Authentication Credentials</h1>
            <p className="text-[10px] text-gray-500 mt-1">Please enter your registered Email and password</p>
          </div>

          {/* Email field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold flex items-center gap-1.5">
              <Mail size={12} className="text-[#1e3a4f]/70" />
              <span>User Email:</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              required
              disabled={isLoading}
              placeholder="e.g. administrator@domain.com"
              className="w-full bg-white border border-[#1e3a4f]/30 p-2 text-xs font-bold text-tally-dark focus:outline-none focus:border-tally-accent"
            />
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="block text-xs font-bold flex items-center gap-1.5">
              <KeyRound size={12} className="text-[#1e3a4f]/70" />
              <span>Password:</span>
            </label>
            <input
              ref={passwordRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              required
              disabled={isLoading}
              placeholder="••••••••"
              className="w-full bg-white border border-[#1e3a4f]/30 p-2 text-xs font-bold text-tally-dark focus:outline-none focus:border-tally-accent"
            />
            {/* Show Password Option */}
            <div className="flex items-center justify-end text-[10px] text-gray-500 mt-1 select-none">
              <label className="flex items-center gap-1 cursor-pointer hover:text-[#1e3a4f]">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#1e3a4f] cursor-pointer"
                />
                <span className="font-bold">Show Password</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              ref={submitRef}
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#1e3a4f] text-[#ffb347] border border-[#ffb347]/30 hover:bg-[#15293a] active:scale-[0.99] font-bold text-xs uppercase tracking-wider rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <span>{isLoading ? "Authenticating..." : "Accept & Login"}</span>
            </button>
          </div>
        </form>


        {/* Link to Register */}
        <div className="border-t border-[#1e3a4f]/10 bg-[#e9e3d9] p-3 text-center text-xs">
          <Link href="/register" className="font-bold text-[#1e3a4f] hover:text-[#00a8cc] transition-colors flex items-center justify-center gap-1.5">
            <span>No account? Register New Operator</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

