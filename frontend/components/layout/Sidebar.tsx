"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Package,
  ShoppingCart,
  Truck,
  LayoutDashboard,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  shortcut: string;
  badge?: string;
}

const masterLinks: SidebarLink[] = [
  {
    label: "Ledgers",
    href: "/ledgers",
    icon: <BookOpen size={15} />,
    shortcut: "Alt+L",
  },
  {
    label: "Stock Items",
    href: "/stock-items",
    icon: <Package size={15} />,
    shortcut: "Alt+S",
  },
];

const voucherLinks: SidebarLink[] = [
  {
    label: "Sales Voucher",
    href: "/vouchers/sales",
    icon: <ShoppingCart size={15} />,
    shortcut: "F8",
  },
  {
    label: "Purchase Voucher",
    href: "/vouchers/purchase",
    icon: <Truck size={15} />,
    shortcut: "F9",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-[200px] min-h-full flex flex-col bg-[#112130] border-r border-[#1b2b3a] select-none font-mono">
      {/* Top spacing block - replacement for Logo Header */}
      <div className="h-4" />

      {/* Gateway Dashboard Link */}
      <div className="px-2">
        <Link
          href="/"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-bold transition-all duration-150 ${
            isActive("/")
              ? "bg-[#1c2d3d] text-[#ffb347] border border-[#ffb347]/20"
              : "text-[#8ca3b8] hover:bg-[#1c2d3d] hover:text-white"
          }`}
        >
          <LayoutDashboard size={14} />
          <span>Gateway</span>
          <span className="shortcut-key ml-auto">^H</span>
        </Link>
      </div>

      {/* Masters Section */}
      <div className="px-2 pt-4">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#8ca3b8]/50 mb-1.5">
          Masters
        </p>
        <nav className="space-y-0.5">
          {masterLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 group ${
                isActive(link.href)
                  ? "bg-[#1c2d3d] text-[#ffb347] border border-[#ffb347]/20"
                  : "text-[#8ca3b8] hover:bg-[#1c2d3d] hover:text-white"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              <span className="shortcut-key ml-auto text-[9px] scale-90">{link.shortcut}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Vouchers Section */}
      <div className="px-2 pt-4">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#8ca3b8]/50 mb-1.5">
          Vouchers
        </p>
        <nav className="space-y-0.5">
          {voucherLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 group ${
                isActive(link.href)
                  ? "bg-[#1c2d3d] text-[#ffb347] border border-[#ffb347]/20"
                  : "text-[#8ca3b8] hover:bg-[#1c2d3d] hover:text-white"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              <span className="shortcut-key ml-auto text-[9px] scale-90">{link.shortcut}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Info & Logout Button */}
      {user && (
        <div className="px-3 py-2 mx-2 mb-2 rounded bg-[#0c1926]/40 border border-[#1b2b3a]/50 flex items-center justify-between gap-1 text-[#8ca3b8] select-none">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#ffb347] truncate leading-tight">Piyush</p>
            <p className="text-[8px] text-[#8ca3b8]/60 truncate leading-none mt-1">piyushfunde4455@gmail.com</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1 rounded hover:bg-[#1c2d3d] text-red-400 hover:text-red-300 transition-all shrink-0 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#1b2b3a] bg-[#0c1926]/50">
        <p className="text-[8px] text-[#8ca3b8]/40 text-center font-mono tracking-tight leading-tight">
          SmartERP v1.0 — MVP build
        </p>
      </div>
    </aside>
  );
}
