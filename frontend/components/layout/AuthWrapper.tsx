"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import RightShortcutPanel from "@/components/layout/RightShortcutPanel";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Shared active company and periods synced with RightShortcutPanel local storage
  const [company, setCompany] = useState("SmartERP India Pvt Ltd");
  const [periodFrom, setPeriodFrom] = useState("2026-04-01");
  const [periodTo, setPeriodTo] = useState("2027-03-31");

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isAuthPage) {
        router.push("/login");
      } else if (isAuthenticated && isAuthPage) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isAuthPage, isLoading, router]);

  // Load initial settings and listen to events
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompany = localStorage.getItem("tally_company");
      if (savedCompany) setCompany(savedCompany);

      const savedFrom = localStorage.getItem("tally_period_from");
      const savedTo = localStorage.getItem("tally_period_to");
      if (savedFrom) setPeriodFrom(savedFrom);
      if (savedTo) setPeriodTo(savedTo);

      // Listen to event changes from RightShortcutPanel
      const handleCompanyChange = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        setCompany(customEvent.detail);
      };

      const handlePeriodChange = (e: Event) => {
        const customEvent = e as CustomEvent<{ from: string; to: string }>;
        setPeriodFrom(customEvent.detail.from);
        setPeriodTo(customEvent.detail.to);
      };

      window.addEventListener("tallyCompanyChanged", handleCompanyChange);
      window.addEventListener("tallyPeriodChanged", handlePeriodChange);

      return () => {
        window.removeEventListener("tallyCompanyChanged", handleCompanyChange);
        window.removeEventListener("tallyPeriodChanged", handlePeriodChange);
      };
    }
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getFinancialYear = (fromStr: string, toStr: string) => {
    try {
      const fromYear = new Date(fromStr).getFullYear();
      const toYear = new Date(toStr).getFullYear();
      const shortToYear = String(toYear).slice(-2);
      return `FY ${fromYear}–${shortToYear}`;
    } catch {
      return "FY 2026–27";
    }
  };

  const getBreadcrumb = (path: string) => {
    if (path === "/") return ["Gateway"];
    
    const segments = path.split("/").filter(Boolean);
    const breadcrumb = ["Gateway"];
    
    segments.forEach((segment) => {
      if (segment === "ledgers") {
        breadcrumb.push("Masters");
        breadcrumb.push("Ledgers");
      } else if (segment === "stock-items") {
        breadcrumb.push("Masters");
        breadcrumb.push("Stock Items");
      } else if (segment === "vouchers") {
        breadcrumb.push("Vouchers");
      } else if (segment === "reports") {
        breadcrumb.push("Reports");
      } else if (segment === "sales") {
        breadcrumb.push("Sales Voucher");
      } else if (segment === "purchase") {
        breadcrumb.push("Purchase Voucher");
      } else if (segment === "payment") {
        breadcrumb.push("Payment Voucher");
      } else if (segment === "receipt") {
        breadcrumb.push("Receipt Voucher");
      } else if (segment === "journal") {
        breadcrumb.push("Journal Voucher");
      } else if (segment === "credit-note") {
        breadcrumb.push("Credit Note");
      } else if (segment === "debit-note") {
        breadcrumb.push("Debit Note");
      } else if (segment === "balance-sheet") {
        breadcrumb.push("Balance Sheet");
      } else if (segment === "profit-loss") {
        breadcrumb.push("Profit & Loss");
      } else if (segment === "trial-balance") {
        breadcrumb.push("Trial Balance");
      } else if (segment === "stock-summary") {
        breadcrumb.push("Stock Summary");
      } else if (segment === "gst") {
        breadcrumb.push("GST Filing");
      } else {
        breadcrumb.push(segment.charAt(0).toUpperCase() + segment.slice(1));
      }
    });
    
    return breadcrumb.filter((item, index) => breadcrumb.indexOf(item) === index);
  };

  const getFormattedBreadcrumb = (path: string) => {
    if (path === "/") return "Gateway";
    if (path.includes("/ledgers")) return "Gateway / Masters - Ledgers";
    if (path.includes("/stock-items")) return "Gateway / Masters - Stock Items";
    if (path.includes("/vouchers/sales")) return "Gateway / Vouchers - Sales Voucher";
    if (path.includes("/vouchers/purchase")) return "Gateway / Vouchers - Purchase Voucher";
    if (path.includes("/vouchers/payment")) return "Gateway / Vouchers - Payment Voucher";
    if (path.includes("/vouchers/receipt")) return "Gateway / Vouchers - Receipt Voucher";
    if (path.includes("/vouchers/journal")) return "Gateway / Vouchers - Journal Voucher";
    if (path.includes("/vouchers/credit-note")) return "Gateway / Vouchers - Credit Note";
    if (path.includes("/vouchers/debit-note")) return "Gateway / Vouchers - Debit Note";
    return `Gateway / ${path.split("/").filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" / ")}`;
  };

  // Loading spinner with Tally design theme
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-tally-dark font-mono text-tally-text">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#e68a00] to-tally-highlight flex items-center justify-center font-bold text-lg animate-pulse mb-4 text-white shadow-xl">
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

  // standard app wrap layout with top full-screen header bar
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f3ede2] text-[#112130]">
      {/* Global Top Header Bar */}
      <header className="h-10 bg-[#0c1926] border-b border-[#1b2b3a] flex items-center justify-between px-4 text-xs text-[#8ca3b8] shrink-0 select-none font-mono">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-5 h-5 rounded bg-[#e68a00] flex items-center justify-center text-white font-extrabold text-[11px]">
              S
            </div>
            <span className="font-bold text-white tracking-wider text-xs">SmartERP</span>
          </div>

          {/* Active Company Dropdown Pill */}
          <div className="flex items-center gap-2 bg-[#122e3d] text-[#ffb347] border border-[#1b4359] px-3 py-0.5 rounded-full text-[10px] font-bold cursor-pointer hover:bg-[#1a3f54] transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{company}</span>
            <span className="text-[#8ca3b8]/40">|</span>
            <span className="text-[#8ca3b8] font-medium">{getFinancialYear(periodFrom, periodTo)}</span>
            <span className="text-[8px] text-[#8ca3b8]/60 ml-0.5">▼</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] text-[#8ca3b8]/75 font-mono">
          <span>SMARTERP v1.0 — MVP</span>
        </div>
      </header>

      {/* Main Layout Content Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Middle Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f3ede2]">
          {/* Breadcrumb Path Strip */}
          <div className="px-6 pt-3 pb-1 text-[10px] text-gray-500 font-mono select-none">
            {getFormattedBreadcrumb(pathname)}
          </div>

          {/* Main child viewport */}
          <main className="flex-1 overflow-auto tally-scrollbar">
            {children}
          </main>
        </div>

        {/* Right Shortcut Panel */}
        <RightShortcutPanel />
      </div>
    </div>
  );
}
