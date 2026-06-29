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
    icon: <BookOpen size={16} />,
    shortcut: "Alt+L",
  },
  {
    label: "Stock Items",
    href: "/stock-items",
    icon: <Package size={16} />,
    shortcut: "Alt+S",
  },
];

const voucherLinks: SidebarLink[] = [
  {
    label: "Sales Voucher",
    href: "/vouchers/sales",
    icon: <ShoppingCart size={16} />,
    shortcut: "F8",
  },
  {
    label: "Purchase Voucher",
    href: "/vouchers/purchase",
    icon: <Truck size={16} />,
    shortcut: "F9",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-[220px] min-h-screen flex flex-col bg-tally-sidebar border-r border-tally-border select-none">
      {/* Logo / Brand */}
      <div className="px-4 py-4 border-b border-tally-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-tally-accent to-tally-highlight flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-105 transition-transform">
            S
          </div>
          <div>
            <h1 className="text-sm font-bold text-tally-text tracking-wide">
              SmartERP
            </h1>
            <p className="text-[10px] text-tally-text-muted leading-none">
              Billing & Accounting
            </p>
          </div>
        </Link>
      </div>

      {/* Dashboard Link */}
      <div className="px-2 pt-3">
        <Link
          href="/"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
            isActive("/")
              ? "bg-tally-sidebar-hover text-tally-highlight"
              : "text-tally-text-muted hover:bg-tally-sidebar-hover hover:text-tally-text"
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Gateway of SmartERP</span>
          <span className="shortcut-key ml-auto">Ctrl+H</span>
        </Link>
      </div>

      {/* Masters Section */}
      <div className="px-2 pt-4">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-tally-text-muted/60 mb-1.5">
          Masters
        </p>
        <nav className="space-y-0.5">
          {masterLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 group ${
                isActive(link.href)
                  ? "bg-tally-sidebar-hover text-tally-highlight"
                  : "text-tally-text-muted hover:bg-tally-sidebar-hover hover:text-tally-text"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              <span className="shortcut-key ml-auto">{link.shortcut}</span>
              <ChevronRight
                size={12}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-tally-text-muted"
              />
            </Link>
          ))}
        </nav>
      </div>

      {/* Vouchers Section */}
      <div className="px-2 pt-4">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-tally-text-muted/60 mb-1.5">
          Vouchers
        </p>
        <nav className="space-y-0.5">
          {voucherLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 group ${
                isActive(link.href)
                  ? "bg-tally-sidebar-hover text-tally-highlight"
                  : "text-tally-text-muted hover:bg-tally-sidebar-hover hover:text-tally-text"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
              <span className="shortcut-key ml-auto">{link.shortcut}</span>
              <ChevronRight
                size={12}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-tally-text-muted"
              />
            </Link>
          ))}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Info & Logout Button */}
      {user && (
        <div className="px-3 py-2 mx-2 mb-2 rounded bg-tally-dark/20 border border-tally-border/20 flex items-center justify-between gap-1.5 text-tally-text-muted select-none">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-tally-highlight truncate leading-tight">{user.name}</p>
            <p className="text-[8px] text-tally-text-muted/60 truncate leading-none mt-0.5">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded hover:bg-tally-sidebar-hover text-red-400 hover:text-red-300 transition-all shrink-0 cursor-pointer"
            title="Log Out"
          >
            <LogOut size={13} />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-tally-border">
        <p className="text-[10px] text-tally-text-muted/50 text-center">
          SmartERP v1.0 — MVP
        </p>
      </div>
    </aside>
  );
}
