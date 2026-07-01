"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, KeyRound } from "lucide-react";
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
    } catch {
      // Errors handled inside context
    }
  };

  // Keyboard navigation focus handlers
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[#112130]">
          <div>
            <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none font-sans">
              Sign in to your workspace
            </h1>
            <p className="text-[10px] text-gray-400 mt-2 font-mono leading-relaxed">
              Enter the email and password you registered with.
            </p>
          </div>

          {/* Email input field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 font-sans">
              <Mail size={12} className="text-gray-400 shrink-0" />
              <span>Email</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              required
              disabled={isLoading}
              placeholder="you@company.com"
              className="w-full bg-white border border-[#1b2b3a]/20 rounded-md p-2 px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#e68a00] transition-colors"
            />
          </div>

          {/* Password input field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 font-sans">
              <Lock size={12} className="text-gray-400 shrink-0" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handlePasswordKeyDown}
                required
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full bg-white border border-[#1b2b3a]/20 rounded-md p-2 pl-3 pr-14 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#e68a00] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 hover:text-[#e68a00] font-sans uppercase select-none cursor-pointer"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Keep me signed in Checkbox */}
          <div className="flex items-center gap-2 select-none text-[11px] text-gray-500 font-sans pt-1">
            <input
              type="checkbox"
              id="keep-signed"
              className="w-3.5 h-3.5 border-gray-300 rounded text-[#e68a00] focus:ring-[#e68a00] cursor-pointer"
            />
            <label htmlFor="keep-signed" className="cursor-pointer font-medium">
              Keep me signed in
            </label>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              ref={submitRef}
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-[#e68a00] hover:bg-[#cc7a00] text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
            </button>
          </div>
        </form>

        {/* Footer links */}
        <div className="border-t border-[#1b2b3a]/10 bg-[#f6f2ea] p-4 text-center text-xs text-gray-500 font-sans mt-auto">
          <span>No account yet? </span>
          <Link href="/register" className="font-bold text-blue-600 hover:text-blue-500 hover:underline">
            Create one
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

