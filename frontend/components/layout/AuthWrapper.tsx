"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RightShortcutPanel from "@/components/layout/RightShortcutPanel";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthPage) {
        router.push("/login");
      } else if (isAuthenticated && isAuthPage) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isAuthPage, isLoading, router]);

  // Loading spinner with Tally design theme
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-tally-dark font-mono text-tally-text">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-tally-accent to-tally-highlight flex items-center justify-center font-bold text-lg animate-pulse mb-4 text-white shadow-xl">
          S
        </div>
        <div className="text-xs text-tally-text-muted select-none">Loading SmartERP Gateway...</div>
      </div>
    );
  }

  // Handle transitions to prevent flashes
  if (!isAuthenticated && !isAuthPage) {
    return (
      <div className="h-screen w-screen bg-tally-dark" />
    );
  }
  if (isAuthenticated && isAuthPage) {
    return (
      <div className="h-screen w-screen bg-tally-dark" />
    );
  }

  // standalone login or register page layout
  if (isAuthPage) {
    return <>{children}</>;
  }

// standard app wrap layout
  return (
    <div className="flex h-screen overflow-hidden bg-tally-dark">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content */}
        <main className="flex-1 overflow-auto tally-scrollbar">
          {children}
        </main>
      </div>

      {/* Right Shortcut Panel */}
      <RightShortcutPanel />
    </div>
  );
}
