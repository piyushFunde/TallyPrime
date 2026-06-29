"use client";

import { useState, useEffect } from "react";

export default function FooterStatus() {
  const [company, setCompany] = useState("SmartERP India Pvt Ltd");
  const [period, setPeriod] = useState("01-Apr-2026 to 31-Mar-2027");

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initial Load
      const savedCompany = localStorage.getItem("tally_company");
      if (savedCompany) setCompany(savedCompany);

      const savedFrom = localStorage.getItem("tally_period_from");
      const savedTo = localStorage.getItem("tally_period_to");
      if (savedFrom && savedTo) {
        setPeriod(`${formatDate(savedFrom)} to ${formatDate(savedTo)}`);
      }

      // Event Listeners
      const handleCompanyChange = (e: Event) => {
        const customEvent = e as CustomEvent<string>;
        setCompany(customEvent.detail);
      };

      const handlePeriodChange = (e: Event) => {
        const customEvent = e as CustomEvent<{ from: string; to: string }>;
        const { from, to } = customEvent.detail;
        setPeriod(`${formatDate(from)} to ${formatDate(to)}`);
      };

      window.addEventListener("tallyCompanyChanged", handleCompanyChange);
      window.addEventListener("tallyPeriodChanged", handlePeriodChange);

      return () => {
        window.removeEventListener("tallyCompanyChanged", handleCompanyChange);
        window.removeEventListener("tallyPeriodChanged", handlePeriodChange);
      };
    }
  }, []);

  return (
    <footer className="tally-status-bar h-6 flex items-center justify-between px-4 shrink-0 text-[10px] text-tally-text-muted/70 select-none">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[#ffb347]">Active Company:</span>
        <span className="text-[#e8e0d4] font-semibold">{company}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[#ffb347]">Period:</span>
        <span className="text-[#e8e0d4] font-semibold">{period}</span>
      </div>
    </footer>
  );
}
