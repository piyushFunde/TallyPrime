"use client";

import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  BookOpen,
  Package,
  ShoppingCart,
  Truck,
  Keyboard,
  Zap,
} from "lucide-react";

interface DashboardCard {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  shortcut: string;
  gradient: string;
}

const cards: DashboardCard[] = [
  {
    title: "Ledgers",
    description: "Manage Customers & Suppliers",
    href: "/ledgers",
    icon: <BookOpen size={28} />,
    shortcut: "Alt + L",
    gradient: "from-[#0d4f6b] to-[#1a7a9e]",
  },
  {
    title: "Stock Items",
    description: "Manage Inventory & Products",
    href: "/stock-items",
    icon: <Package size={28} />,
    shortcut: "Alt + S",
    gradient: "from-[#2d6a4f] to-[#40916c]",
  },
  {
    title: "Sales Voucher",
    description: "Create Customer Bills & Invoices",
    href: "/vouchers/sales",
    icon: <ShoppingCart size={28} />,
    shortcut: "F8",
    gradient: "from-[#7b2d8e] to-[#a855f7]",
  },
  {
    title: "Purchase Voucher",
    description: "Record Purchases & Stock Entry",
    href: "/vouchers/purchase",
    icon: <Truck size={28} />,
    shortcut: "F9",
    gradient: "from-[#9e4a2d] to-[#d97706]",
  },
];

export default function GatewayPage() {
  const router = useRouter();

  useKeyboardShortcuts({
    "alt+l": () => router.push("/ledgers"),
    "alt+s": () => router.push("/stock-items"),
    f8: () => router.push("/vouchers/sales"),
    f9: () => router.push("/vouchers/purchase"),
  });

  return (
    <div className="min-h-full bg-gradient-to-br from-tally-dark via-[#1a2d40] to-tally-dark p-6 tally-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-tally-accent to-tally-highlight flex items-center justify-center shadow-lg shadow-tally-accent/20">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-tally-text tracking-tight">
              Gateway of SmartERP
            </h1>
            <p className="text-sm text-tally-text-muted">
              Select a module to get started. Use keyboard shortcuts for quick
              access.
            </p>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            className={`group relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br ${card.gradient} p-5 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-tally-accent/50`}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-white/10 text-white/90">
                  {card.icon}
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {card.title}
              </h3>
              <p className="text-xs text-white/60">{card.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
