"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ledgerApi, stockItemApi } from "@/lib/api";
import {
  BookOpen,
  Package,
  ShoppingCart,
  Truck,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from "lucide-react";

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  shortcut: string;
  bgColor: string;
}

const cards: DashboardCard[] = [
  {
    title: "Ledgers",
    description: "Manage customers & suppliers",
    href: "/ledgers",
    icon: <BookOpen size={24} />,
    shortcut: "Alt+L",
    bgColor: "bg-[#135066] border-[#1d6b87]/30",
  },
  {
    title: "Stock Items",
    description: "Manage inventory & products",
    href: "/stock-items",
    icon: <Package size={24} />,
    shortcut: "Alt+S",
    bgColor: "bg-[#236643] border-[#318559]/30",
  },
  {
    title: "Sales Voucher",
    description: "Create customer bills & invoices",
    href: "/vouchers/sales",
    icon: <ShoppingCart size={24} />,
    shortcut: "F8",
    bgColor: "bg-[#7b3da1] border-[#9b58c7]/30",
  },
  {
    title: "Purchase Voucher",
    description: "Record purchases & stock entry",
    href: "/vouchers/purchase",
    icon: <Truck size={24} />,
    shortcut: "F9",
    bgColor: "bg-[#bc6c25] border-[#d48c48]/30",
  },
];

export default function GatewayPage() {
  const router = useRouter();
  const [receivables, setReceivables] = useState(0);
  const [payables, setPayables] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const [ledgers, stockItems] = await Promise.all([
        ledgerApi.getAll(),
        stockItemApi.getAll(),
      ]);

      // Calculate Receivables (Customers with positive currentBalance)
      const rec = ledgers
        .filter((l) => l.type === "CUSTOMER" && l.currentBalance > 0)
        .reduce((sum, l) => sum + l.currentBalance, 0);

      // Calculate Payables (Suppliers with negative currentBalance)
      const pay = ledgers
        .filter((l) => l.type === "SUPPLIER" && l.currentBalance < 0)
        .reduce((sum, l) => sum + Math.abs(l.currentBalance), 0);

      // Low stock count (currentStock < 10)
      const low = stockItems.filter((item) => (item.currentStock ?? 0) < 10).length;

      setReceivables(rec);
      setPayables(pay);
      setLowStockCount(low);
    } catch {
      // Keep defaults as 0 on error
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useKeyboardShortcuts({
    "alt+l": () => router.push("/ledgers"),
    "alt+s": () => router.push("/stock-items"),
    f8: () => router.push("/vouchers/sales"),
    f9: () => router.push("/vouchers/purchase"),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-full bg-[#f3ede2] p-6 tally-fade-in font-mono">
      {/* Title Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded bg-[#e68a00] flex items-center justify-center shadow-md shadow-[#e68a00]/10 shrink-0">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-tight font-sans">
              Gateway of SmartERP
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Select a module to get started, or use a shortcut from the console.
            </p>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className={`group relative rounded border text-left p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none ${card.bgColor} cursor-pointer text-white`}
          >
            {/* Shortcut Badge top-right */}
            <span className="absolute top-3 right-3 text-[10px] bg-black/25 text-white/90 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
              {card.shortcut}
            </span>

            <div className="flex flex-col h-full justify-between">
              <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center text-white mb-4">
                {card.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1 font-sans">
                  {card.title}
                </h3>
                <p className="text-[11px] text-white/70 font-sans leading-snug">
                  {card.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* TODAY AT A GLANCE Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-mono">
          Today at a Glance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Receivables */}
          <div className="bg-white border border-[#1b2b3a]/10 p-4 rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-sans font-medium mb-1">
              <TrendingUp size={14} className="text-emerald-500" />
              <span>Receivables outstanding</span>
            </div>
            <p className="text-xl font-bold text-emerald-600 font-mono leading-none mt-1">
              {formatCurrency(receivables)}
            </p>
          </div>

          {/* Payables */}
          <div className="bg-white border border-[#1b2b3a]/10 p-4 rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-sans font-medium mb-1">
              <TrendingDown size={14} className="text-[#e68a00]" />
              <span>Payables outstanding</span>
            </div>
            <p className="text-xl font-bold text-[#e68a00] font-mono leading-none mt-1">
              {formatCurrency(payables)}
            </p>
          </div>

          {/* Low Stock */}
          <div className="bg-white border border-[#1b2b3a]/10 p-4 rounded shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-sans font-medium mb-1">
              <AlertCircle size={14} className="text-gray-500" />
              <span>Low stock items</span>
            </div>
            <p className="text-xl font-bold text-gray-800 font-mono leading-none mt-1">
              {lowStockCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
