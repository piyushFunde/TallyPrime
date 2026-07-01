"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, ChevronLeft, HelpCircle, Calculator, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface ShortcutItem {
  key: string;
  label: string;
  isActive: boolean;
  action: () => void;
}

export default function RightShortcutPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flashKey, setFlashKey] = useState<string | null>(null);

  // Dialog States
  const [showHelp, setShowHelp] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [showConfigure, setShowConfigure] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  const { logout } = useAuth();

  // Local Storage States (with fallbacks)
  const [currentCompany, setCurrentCompany] = useState("SmartERP India Pvt Ltd");
  const [periodFrom, setPeriodFrom] = useState("2026-04-01");
  const [periodTo, setPeriodTo] = useState("2027-03-31");
  
  // Settings States
  const [decimalPlaces, setDecimalPlaces] = useState("2");
  const [autoGst, setAutoGst] = useState(true);
  const [showSql, setShowSql] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompany = localStorage.getItem("tally_company");
      if (savedCompany) setCurrentCompany(savedCompany);

      const savedFrom = localStorage.getItem("tally_period_from");
      const savedTo = localStorage.getItem("tally_period_to");
      if (savedFrom) setPeriodFrom(savedFrom);
      if (savedTo) setPeriodTo(savedTo);

      const savedDecimals = localStorage.getItem("tally_decimals");
      if (savedDecimals) setDecimalPlaces(savedDecimals);

      const savedAutoGst = localStorage.getItem("tally_autogst");
      if (savedAutoGst !== null) setAutoGst(savedAutoGst === "true");

      const savedShowSql = localStorage.getItem("tally_showsql");
      if (savedShowSql !== null) setShowSql(savedShowSql === "true");
    }
  }, []);

  // Save Helpers
  const saveCompany = (company: string) => {
    setCurrentCompany(company);
    localStorage.setItem("tally_company", company);
    toast.success(`Active Company changed to: ${company}`);
    window.dispatchEvent(new CustomEvent("tallyCompanyChanged", { detail: company }));
    setShowCompany(false);
  };

  const savePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tally_period_from", periodFrom);
    localStorage.setItem("tally_period_to", periodTo);
    toast.success(`Accounting Period updated: ${formatDate(periodFrom)} to ${formatDate(periodTo)}`);
    window.dispatchEvent(new CustomEvent("tallyPeriodChanged", { detail: { from: periodFrom, to: periodTo } }));
    setShowPeriod(false);
  };

  const saveConfigure = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tally_decimals", decimalPlaces);
    localStorage.setItem("tally_autogst", String(autoGst));
    localStorage.setItem("tally_showsql", String(showSql));
    toast.success("Configurations updated successfully");
    window.dispatchEvent(new CustomEvent("tallyConfigChanged"));
    setShowConfigure(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const handleCalcBtnClick = (val: string) => {
    if (val === "=") {
      evaluateCalc();
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const evaluateCalc = () => {
    try {
      // Safe evaluation using Function
      const cleanInput = calcInput.replace(/[^0-9+\-*/().]/g, "");
      const res = new Function(`return ${cleanInput}`)();
      setCalcResult(String(res));
    } catch {
      setCalcResult("Error");
    }
  };

  // Command Palette Items List
  const commandItems = useMemo(() => [
    { title: "Ledgers Dashboard / Create", shortcut: "Alt + L", action: () => router.push("/ledgers") },
    { title: "Stock Items Dashboard", shortcut: "Alt + S", action: () => router.push("/stock-items") },
    { title: "Sales Voucher Entry", shortcut: "F8", action: () => router.push("/vouchers/sales") },
    { title: "Purchase Voucher Entry", shortcut: "F9", action: () => router.push("/vouchers/purchase") },
    { title: "Payment Voucher Entry", shortcut: "F5", action: () => router.push("/vouchers/payment") },
    { title: "Receipt Voucher Entry", shortcut: "F6", action: () => router.push("/vouchers/receipt") },
    { title: "Journal Voucher Entry", shortcut: "F7", action: () => router.push("/vouchers/journal") },
    { title: "Credit Note Voucher Entry", shortcut: "F10", action: () => router.push("/vouchers/credit-note") },
    { title: "Debit Note Voucher Entry", shortcut: "F11", action: () => router.push("/vouchers/debit-note") },
    { title: "Balance Sheet Report", shortcut: "Alt + B", action: () => router.push("/reports/balance-sheet") },
    { title: "Profit & Loss Statement", shortcut: "Alt + P", action: () => router.push("/reports/profit-loss") },
    { title: "Trial Balance Report", shortcut: "Alt + T", action: () => router.push("/reports/trial-balance") },
    { title: "Cash Flow Report", shortcut: "Alt + C", action: () => router.push("/reports/cash-flow") },
    { title: "Stock Summary Report", shortcut: "Alt + R", action: () => router.push("/reports/stock-summary") },
    { title: "GST Filing Reports", shortcut: "Alt + X", action: () => router.push("/reports/gst") },
    { title: "Logout SmartERP Gateway", shortcut: "Ctrl + Q", action: () => logout() }
  ], [router, logout]);

  const filteredCommands = useMemo(() => {
    if (!commandSearch) return commandItems;
    return commandItems.filter(item => 
      item.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
      item.shortcut.toLowerCase().includes(commandSearch.toLowerCase())
    );
  }, [commandSearch, commandItems]);

  const triggerCommand = (cmd: typeof commandItems[0]) => {
    cmd.action();
    setShowCommandPalette(false);
    setCommandSearch("");
  };

  // Define dynamic shortcuts based on active path
  const shortcuts: ShortcutItem[] = useMemo(() => {
    const list: ShortcutItem[] = [
      {
        key: "F1",
        label: "Select Comp",
        isActive: true,
        action: () => setShowCompany(true),
      },
      {
        key: "F2",
        label: pathname.includes("/vouchers") ? "Date" : "Period",
        isActive: true,
        action: () => setShowPeriod(true),
      },
      {
        key: "F3",
        label: "Comp Info",
        isActive: true,
        action: () => setShowCompanyInfo(true),
      },
      {
        key: "F4",
        label: "Calculator",
        isActive: true,
        action: () => setShowCalculator(prev => !prev),
      },
      {
        key: "F5",
        label: "Payment",
        isActive: true,
        action: () => {
          router.push("/vouchers/payment");
          toast.info("Navigated to Payment Voucher");
        },
      },
      {
        key: "F6",
        label: "Receipt",
        isActive: true,
        action: () => {
          router.push("/vouchers/receipt");
          toast.info("Navigated to Receipt Voucher");
        },
      },
      {
        key: "F7",
        label: "Journal",
        isActive: true,
        action: () => {
          router.push("/vouchers/journal");
          toast.info("Navigated to Journal Voucher");
        },
      },
      {
        key: "F8",
        label: "Sales",
        isActive: true,
        action: () => {
          router.push("/vouchers/sales");
          toast.info("Navigated to Sales Voucher");
        },
      },
      {
        key: "F9",
        label: "Purchase",
        isActive: true,
        action: () => {
          router.push("/vouchers/purchase");
          toast.info("Navigated to Purchase Voucher");
        },
      },
      {
        key: "Alt+L",
        label: "Ledgers",
        isActive: true,
        action: () => {
          router.push("/ledgers");
          toast.info("Navigated to Ledgers list");
        },
      },
      {
        key: "Alt+S",
        label: "Stock Items",
        isActive: true,
        action: () => {
          router.push("/stock-items");
          toast.info("Navigated to Stock Items list");
        },
      },
      {
        key: "F10",
        label: "Credit Note",
        isActive: true,
        action: () => {
          router.push("/vouchers/credit-note");
          toast.info("Navigated to Credit Note");
        },
      },
      {
        key: "F11",
        label: "Debit Note",
        isActive: true,
        action: () => {
          router.push("/vouchers/debit-note");
          toast.info("Navigated to Debit Note");
        },
      },
      {
        key: "F12",
        label: "Configure",
        isActive: true,
        action: () => setShowConfigure(true),
      },
    ];

    if (pathname === "/vouchers/sales") {
      const f8 = list.find(s => s.key === "F8");
      if (f8) f8.label = "Sales (Active)";
    } else if (pathname === "/vouchers/purchase") {
      const f9 = list.find(s => s.key === "F9");
      if (f9) f9.label = "Purchase (Active)";
    } else if (pathname === "/vouchers/payment") {
      const f5 = list.find(s => s.key === "F5");
      if (f5) f5.label = "Payment (Active)";
    } else if (pathname === "/vouchers/receipt") {
      const f6 = list.find(s => s.key === "F6");
      if (f6) f6.label = "Receipt (Active)";
    } else if (pathname === "/vouchers/journal") {
      const f7 = list.find(s => s.key === "F7");
      if (f7) f7.label = "Journal (Active)";
    } else if (pathname === "/vouchers/credit-note") {
      const f10 = list.find(s => s.key === "F10");
      if (f10) f10.label = "Credit Note (Active)";
    } else if (pathname === "/vouchers/debit-note") {
      const f11 = list.find(s => s.key === "F11");
      if (f11) f11.label = "Debit Note (Active)";
    }

    return list;
  }, [pathname, router]);

  // Global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      const keyName = e.key.toUpperCase();

      // Detect combos
      let combo = "";
      if (e.altKey) combo += "Alt+";
      if (e.ctrlKey) combo += "Ctrl+";
      if (e.shiftKey) combo += "Shift+";
      combo += keyName;

      // Escape key handler: close open states or go back
      if (e.key === "Escape") {
        if (showCalculator) {
          setShowCalculator(false);
          return;
        }
        if (showCommandPalette) {
          setShowCommandPalette(false);
          return;
        }
        if (showHelp) {
          setShowHelp(false);
          return;
        }
        if (showPeriod) {
          setShowPeriod(false);
          return;
        }
        if (showCompany) {
          setShowCompany(false);
          return;
        }
        if (showCompanyInfo) {
          setShowCompanyInfo(false);
          return;
        }
        if (showConfigure) {
          setShowConfigure(false);
          return;
        }
        
        // If not typing, navigate back
        if (!isTyping) {
          e.preventDefault();
          router.back();
          return;
        }
      }

      // Allow F-keys, Alt combos, and Ctrl combos even when typing
      if (isTyping && !keyName.startsWith("F") && !combo.startsWith("Alt+") && !combo.startsWith("Ctrl+")) {
        return;
      }

      // Ctrl+H -> Go to Dashboard Home
      if (combo === "Ctrl+H") {
        e.preventDefault();
        router.push("/");
        toast.info("Navigated to Dashboard");
        return;
      }

      // Ctrl+Q -> Logout
      if (combo === "Ctrl+Q") {
        e.preventDefault();
        logout();
        toast.success("Logged out successfully");
        return;
      }

      // Ctrl+K -> Command Palette Search
      if (combo === "Ctrl+K") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      // Alt+A -> Alter Ledger (goes to ledgers page)
      if (combo === "Alt+A") {
        e.preventDefault();
        router.push("/ledgers");
        toast.info("Opening Ledger Master for Alteration");
        return;
      }

      // Alt+G -> Create Group
      if (combo === "Alt+G") {
        e.preventDefault();
        toast.info("Create Group Master dialog triggered");
        return;
      }

      // Alt+U -> Create Unit
      if (combo === "Alt+U") {
        e.preventDefault();
        toast.info("Create Unit of Measure dialog triggered");
        return;
      }

      // Ctrl+I -> Inventory Dashboard
      if (combo === "Ctrl+I") {
        e.preventDefault();
        router.push("/stock-items");
        toast.info("Navigated to Inventory Dashboard");
        return;
      }

      // Ctrl+N -> New Stock Item
      if (combo === "Ctrl+N") {
        e.preventDefault();
        router.push("/stock-items?action=new");
        toast.info("Opening New Stock Item creation form");
        return;
      }

      // Ctrl+E -> Edit Stock Item
      if (combo === "Ctrl+E") {
        e.preventDefault();
        router.push("/stock-items");
        toast.info("Opening Stock Items for edit");
        return;
      }

      // Ctrl+T -> Stock Transfer
      if (combo === "Ctrl+T") {
        e.preventDefault();
        toast.info("Stock Journal / Godown Transfer entry triggered");
        return;
      }

      // Ctrl+R -> Stock Report
      if (combo === "Ctrl+R") {
        e.preventDefault();
        router.push("/reports/stock-summary");
        toast.info("Opening Stock Summary Report");
        return;
      }

      // Ctrl+B -> Create Invoice
      if (combo === "Ctrl+B") {
        e.preventDefault();
        router.push("/vouchers/sales");
        toast.info("Opening Sales Invoice form");
        return;
      }

      // Ctrl+P -> Print Invoice
      if (combo === "Ctrl+P") {
        e.preventDefault();
        window.print();
        return;
      }

      // Ctrl+Shift+P -> Export PDF
      if (combo === "Ctrl+Shift+P" || combo === "Ctrl+Shift+P") {
        e.preventDefault();
        window.print();
        return;
      }

      // Alt+B -> Balance Sheet
      if (combo === "Alt+B") {
        e.preventDefault();
        router.push("/reports/balance-sheet");
        toast.info("Opening Balance Sheet Report");
        return;
      }

      // Alt+P -> Profit & Loss
      if (combo === "Alt+P") {
        e.preventDefault();
        router.push("/reports/profit-loss");
        toast.info("Opening Profit & Loss Statement");
        return;
      }

      // Alt+T -> Trial Balance
      if (combo === "Alt+T") {
        e.preventDefault();
        router.push("/reports/trial-balance");
        toast.info("Opening Trial Balance Report");
        return;
      }

      // Alt+C -> Cash Flow
      if (combo === "Alt+C") {
        e.preventDefault();
        router.push("/reports/cash-flow");
        toast.info("Opening Cash Flow Report");
        return;
      }

      // Alt+X -> GST Reports
      if (combo === "Alt+X") {
        e.preventDefault();
        router.push("/reports/gst");
        toast.info("Opening GST Filing Reports");
        return;
      }

      // Match sidebar list shortcuts
      const matched = shortcuts.find(s => {
        const itemKey = s.key.toUpperCase();
        return itemKey === combo || (combo === keyName && itemKey === keyName);
      });

      if (matched && matched.isActive) {
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger active flash
        setFlashKey(matched.key);
        setTimeout(() => setFlashKey(null), 150);
        
        matched.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, showCalculator, showCommandPalette, showHelp, showPeriod, showCompany, showCompanyInfo, showConfigure, router, logout]);


  // Underline formatter for Alt+ Keys with heavy bold styles
  const renderKeyBadge = (key: string) => {
    if (key.startsWith("Alt+")) {
      const char = key.replace("Alt+", "");
      return (
        <span className="relative inline-block border-b border-current font-black leading-none text-[10px]">
          {char}
        </span>
      );
    }
    if (key.startsWith("Ctrl+")) {
      const char = key.replace("Ctrl+", "");
      return (
        <span className="relative inline-block border-b-2 border-double border-current font-black leading-none text-[10px]">
          {char}
        </span>
      );
    }
    return <span className="font-black text-[10px]">{key}</span>;
  };

  // Render help button at the top header
  const helpItem = shortcuts.find(s => s.key === "F1");
  const mainButtons = shortcuts.filter(s => s.key !== "F1" && s.key !== "F12");
  const configItem = shortcuts.find(s => s.key === "F12");

  if (isCollapsed) {
    return (
      <div 
        className="w-6 flex flex-col justify-between items-center py-2 bg-[#112130] border-l border-[#1b2b3a] select-none cursor-pointer text-[#8ca3b8] hover:text-white"
        onClick={() => setIsCollapsed(false)}
        title="Expand shortcuts bar"
      >
        <button className="text-[#8ca3b8] hover:text-white focus:outline-none mb-4">
          <ChevronLeft size={14} />
        </button>
        <div className="flex-1 flex flex-col justify-center items-center font-bold text-[9px] text-[#8ca3b8]/70 tracking-widest uppercase [writing-mode:vertical-lr]">
          S h o r t c u t s
        </div>
      </div>
    );
  }

  return (
    <>
      <aside className="w-[180px] flex flex-col bg-[#112130] border-l border-[#1b2b3a] select-none shrink-0 font-mono text-[#8fa4b5] h-full">
        {/* Help/Select Company Header Block */}
        {helpItem && (
          <div
            onClick={helpItem.action}
            className={`w-full py-2.5 px-3 flex items-center justify-between border-b border-[#1b2b3a] bg-[#0c1926] cursor-pointer hover:bg-[#1a2d40] text-white transition-colors`}
          >
            <span className="text-[10px] font-bold tracking-wider">F1 • SELECT COMP</span>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(true);
              }}
              className="text-[#8fa4b5] hover:text-white transition-colors p-0.5"
              title="Collapse Panel"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Shortcuts keys list container */}
        <div className="flex-1 p-2 flex flex-col justify-between gap-1 overflow-y-auto tally-scrollbar">
          
          {/* Main buttons block */}
          <div className="flex flex-col gap-1">
            {/* Upper keys F2 to F9 */}
            {mainButtons.slice(0, 8).map((item) => {
              const isFlashing = flashKey === item.key;
              const isModalTrigger = ["F2", "F3", "F4"].includes(item.key);

              if (isModalTrigger) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.action}
                    className={`w-full rounded flex items-center text-left py-1 px-1 transition-colors cursor-pointer select-none ${
                      isFlashing ? "bg-[#e68a00] text-white" : "bg-transparent hover:bg-[#1c2d3d] text-[#8fa4b5]"
                    }`}
                  >
                    <span className="w-10 h-[22px] flex items-center justify-center bg-[#203345] rounded-sm text-[10px] font-bold text-[#8fa4b5] shrink-0 border border-[#1b4359]/20">
                      {renderKeyBadge(item.key)}
                    </span>
                    <span className="pl-2.5 text-xs font-semibold truncate pr-1">
                      {item.label}
                    </span>
                  </button>
                );
              } else {
                return (
                  <div
                    key={item.key}
                    className={`w-full rounded flex items-center text-left py-1 px-1 bg-transparent text-[#8fa4b5]/60 opacity-60 select-none ${
                      isFlashing ? "bg-[#e68a00]/30 text-white" : ""
                    }`}
                  >
                    <span className="w-10 h-[22px] flex items-center justify-center bg-[#203345] rounded-sm text-[10px] font-bold text-[#8fa4b5] shrink-0 border border-[#1b4359]/20">
                      {renderKeyBadge(item.key)}
                    </span>
                    <span className="pl-2.5 text-xs font-semibold truncate pr-1">
                      {item.label}
                    </span>
                  </div>
                );
              }
            })}

            {/* First Divider */}
            <hr className="border-t border-[#1b2b3a]/30 my-1.5" />

            {/* Lower keys Alt+L, Alt+S, F10, F11 */}
            {mainButtons.slice(8).map((item) => {
              const isFlashing = flashKey === item.key;
              return (
                <div
                  key={item.key}
                  className={`w-full rounded flex items-center text-left py-1 px-1 bg-transparent text-[#8fa4b5]/60 opacity-60 select-none ${
                    isFlashing ? "bg-[#e68a00]/30 text-white" : ""
                  }`}
                >
                  <span className="w-10 h-[22px] flex items-center justify-center bg-[#203345] rounded-sm text-[10px] font-bold text-[#8fa4b5] shrink-0 border border-[#1b4359]/20">
                    {renderKeyBadge(item.key)}
                  </span>
                  <span className="pl-2.5 text-xs font-semibold truncate pr-1">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom block with second divider and F12 Configure */}
          <div className="mt-auto">
            <hr className="border-t border-[#1b2b3a]/30 mb-2" />
            {configItem && (
              <button
                type="button"
                onClick={configItem.action}
                className={`w-full rounded flex items-center text-left py-1 px-1 transition-colors cursor-pointer select-none ${
                  flashKey === "F12" ? "bg-[#e68a00] text-white" : "bg-transparent hover:bg-[#1c2d3d] text-[#8fa4b5]"
                }`}
              >
                <span className="w-10 h-[22px] flex items-center justify-center bg-[#203345] rounded-sm text-[10px] font-bold text-[#8fa4b5] shrink-0 border border-[#1b4359]/20">
                  F12
                </span>
                <span className="pl-2.5 text-xs font-semibold truncate pr-1">
                  {configItem.label}
                </span>
              </button>
            )}
          </div>

        </div>
      </aside>

      {/* ========================================================
          Interactive Modals (Tally Style Dialog Overlays)
          ======================================================== */}

      {/* F1: HELP SIDEBAR DRAWER */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 flex justify-end">
          {/* Backdrop Click close */}
          <div className="absolute inset-0 cursor-default" onClick={() => setShowHelp(false)} />
          
          {/* Drawer Container */}
          <div className="relative w-[300px] h-screen bg-[#f5f0e8] border-l-2 border-[#1e3a4f] shadow-2xl flex flex-col z-10 tally-slide-in font-mono text-[#1e3a4f]">
            {/* Header */}
            <div className="bg-[#102d2c] text-white px-4 py-3 flex items-center justify-between font-bold text-xs uppercase border-b border-[#2a5470]">
              <div className="flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#ffb347]" />
                <span>F1: HELP</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowHelp(false)} 
                className="text-white hover:text-[#ffb347] transition-colors p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Shortcuts Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 tally-scrollbar">
              <div className="text-[10px] font-bold text-gray-500 uppercase px-1 pb-1 border-b border-[#1e3a4f]/10">
                Keyboard Shortcuts
              </div>
              
              <div className="flex flex-col gap-2">
                {[
                  { key: "Alt + L", action: "Open Ledgers" },
                  { key: "Alt + S", action: "Open Stock Items" },
                  { key: "F8", action: "Sales Voucher" },
                  { key: "F9", action: "Purchase Voucher" },
                  { key: "Escape", action: "Go Back" },
                  { key: "Ctrl + H", action: "Dashboard" },
                  { key: "Ctrl + S", action: "Save Form" },
                  { key: "Tab / Enter", action: "Next Field" },
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded bg-white border border-[#1e3a4f]/15 hover:border-[#1e3a4f]/40 transition-colors shadow-sm select-none"
                  >
                    <span className="shortcut-key font-mono text-[9px] font-bold shrink-0">
                      {item.key}
                    </span>
                    <span className="text-[11px] font-bold text-[#1e3a4f] text-right truncate pl-2">
                      {item.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-[#1e3a4f]/5 p-3 border-t border-[#1e3a4f]/10">
              <button 
                type="button"
                onClick={() => setShowHelp(false)}
                className="w-full bg-[#1e3a4f] text-[#ffb347] hover:bg-[#15293a] py-2 text-xs font-bold rounded-sm border border-[#ffb347]/30 transition-colors shadow-md text-center cursor-pointer"
              >
                Close Panel (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F2: PERIOD MODAL */}
      {showPeriod && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={savePeriod} className="w-full max-w-sm bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in font-mono">
            <div className="bg-[#1e3a4f] text-[#ffb347] px-4 py-2 flex items-center justify-between text-xs font-bold">
              <span>Change Accounting Period</span>
              <button type="button" onClick={() => setShowPeriod(false)} className="text-white hover:text-[#ffb347]">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 text-xs text-[#1e3a4f] space-y-3">
              <div>
                <label className="block font-bold mb-1">From Date:</label>
                <input 
                  type="date" 
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                  required
                  className="w-full bg-white border border-[#1e3a4f]/30 p-1.5 focus:outline-none focus:border-tally-accent text-xs font-bold text-tally-dark"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">To Date:</label>
                <input 
                  type="date" 
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                  required
                  className="w-full bg-white border border-[#1e3a4f]/30 p-1.5 focus:outline-none focus:border-tally-accent text-xs font-bold text-tally-dark"
                />
              </div>
              <div className="text-[10px] text-gray-500 italic mt-2">
                All financial summaries will filter within this range.
              </div>
            </div>
            <div className="bg-[#1e3a4f]/5 px-4 py-3 flex justify-end gap-2 border-t border-[#1e3a4f]/10">
              <button 
                type="button"
                onClick={() => setShowPeriod(false)}
                className="bg-white/60 hover:bg-white text-[#1e3a4f] px-3 py-1 text-xs border border-[#1e3a4f]/30 font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-[#1e3a4f] text-[#ffb347] hover:bg-[#1a2e3f] px-4 py-1 text-xs font-bold rounded-sm border border-[#ffb347]/30"
              >
                Accept (Enter)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* F3: COMPANY MODAL */}
      {showCompany && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in font-mono">
            <div className="bg-[#1e3a4f] text-[#ffb347] px-4 py-2 flex items-center justify-between text-xs font-bold">
              <span>Select Active Company</span>
              <button type="button" onClick={() => setShowCompany(false)} className="text-white hover:text-[#ffb347]">
                <X size={16} />
              </button>
            </div>
            <div className="p-2 text-xs text-[#1e3a4f]">
              <div className="mb-2 px-2 text-[10px] font-bold text-gray-500 uppercase">List of Companies</div>
              <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                {[
                  "SmartERP India Pvt Ltd",
                  "Acme Accounting Services",
                  "Global Traders & Co.",
                  "Pioneer Retailers LLC"
                ].map((company) => {
                  const isSelected = company === currentCompany;
                  return (
                    <button
                      key={company}
                      type="button"
                      onClick={() => saveCompany(company)}
                      className={`w-full text-left py-2 px-3 border border-transparent transition-colors ${
                        isSelected 
                          ? "bg-[#1e3a4f] text-[#ffb347] font-bold" 
                          : "hover:bg-[#1e3a4f]/10 text-[#1e3a4f]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{company}</span>
                        {isSelected && <span className="text-[10px] uppercase font-bold text-tally-accent">Active</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-[#1e3a4f]/5 px-4 py-3 flex justify-end border-t border-[#1e3a4f]/10">
              <button 
                type="button"
                onClick={() => setShowCompany(false)}
                className="bg-white/60 hover:bg-white text-[#1e3a4f] px-3 py-1 text-xs border border-[#1e3a4f]/30 font-bold"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F12: CONFIGURE MODAL */}
      {showConfigure && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={saveConfigure} className="w-full max-w-sm bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in font-mono">
            <div className="bg-[#1e3a4f] text-[#ffb347] px-4 py-2 flex items-center justify-between text-xs font-bold">
              <span>Configuration Settings</span>
              <button type="button" onClick={() => setShowConfigure(false)} className="text-white hover:text-[#ffb347]">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 text-xs text-[#1e3a4f] space-y-3">
              <div>
                <label className="block font-bold mb-1">Currency Decimal Places:</label>
                <select 
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(e.target.value)}
                  className="w-full bg-white border border-[#1e3a4f]/30 p-1.5 focus:outline-none text-xs font-bold text-tally-dark"
                >
                  <option value="2">2 Decimal Places (Default - e.g. 0.00)</option>
                  <option value="3">3 Decimal Places (e.g. 0.000)</option>
                  <option value="4">4 Decimal Places (e.g. 0.0000)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold">Auto-Calculate GST:</span>
                <input 
                  type="checkbox" 
                  checked={autoGst}
                  onChange={(e) => setAutoGst(e.target.checked)}
                  className="w-4 h-4 accent-[#1e3a4f]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold">Show SQL Log Console:</span>
                <input 
                  type="checkbox" 
                  checked={showSql}
                  onChange={(e) => setShowSql(e.target.checked)}
                  className="w-4 h-4 accent-[#1e3a4f]"
                />
              </div>

              <div className="text-[10px] text-gray-500 italic mt-2">
                Settings are saved locally on this machine.
              </div>
            </div>
            <div className="bg-[#1e3a4f]/5 px-4 py-3 flex justify-end gap-2 border-t border-[#1e3a4f]/10">
              <button 
                type="button"
                onClick={() => setShowConfigure(false)}
                className="bg-white/60 hover:bg-white text-[#1e3a4f] px-3 py-1 text-xs border border-[#1e3a4f]/30 font-bold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-[#1e3a4f] text-[#ffb347] hover:bg-[#1a2e3f] px-4 py-1 text-xs font-bold rounded-sm border border-[#ffb347]/30"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}
      {/* F3: COMPANY INFO MODAL */}
      {showCompanyInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in font-mono text-[#1e3a4f]">
            <div className="bg-[#1e3a4f] text-[#ffb347] px-4 py-2 flex items-center justify-between text-xs font-bold border-b border-[#2a5470]">
              <span>Active Company Information</span>
              <button type="button" onClick={() => setShowCompanyInfo(false)} className="text-white hover:text-[#ffb347]">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 text-xs space-y-3">
              <div className="pb-2 border-b border-[#1e3a4f]/20 text-center">
                <h3 className="font-bold text-sm">{currentCompany}</h3>
                <span className="text-[10px] text-gray-500">Corporate Master Registry</span>
              </div>
              
              <div className="space-y-1 bg-white/40 border border-[#1e3a4f]/10 p-2 rounded-sm">
                <div><span className="font-bold">Mailing Name:</span> {currentCompany}</div>
                <div><span className="font-bold">Financial Year:</span> 01-Apr-2026 to 31-Mar-2027</div>
                <div><span className="font-bold">Tax Compliance:</span> GST Compliant (Active IGST/CGST)</div>
                <div><span className="font-bold">State/Country:</span> Maharashtra, India</div>
                <div><span className="font-bold">Database Server:</span> Spring Boot JPA Integration</div>
              </div>
            </div>
            <div className="bg-[#1e3a4f]/5 px-4 py-3 flex justify-end border-t border-[#1e3a4f]/10">
              <button 
                type="button"
                onClick={() => setShowCompanyInfo(false)}
                className="bg-[#1e3a4f] text-[#ffb347] hover:bg-[#1a2e3f] px-4 py-1.5 text-xs font-bold rounded-sm border border-[#ffb347]/30 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F4: FLOATING CALCULATOR */}
      {showCalculator && (
        <div className="fixed bottom-10 right-44 w-64 bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden z-50 font-mono text-[#1e3a4f] tally-slide-in">
          {/* Header */}
          <div className="bg-[#1e3a4f] text-[#ffb347] px-3 py-1.5 flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-1">
              <Calculator size={12} />
              <span>Calculator</span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowCalculator(false)}
              className="text-white hover:text-[#ffb347]"
            >
              <X size={14} />
            </button>
          </div>
          
          {/* Calculator Screen */}
          <div className="bg-white border-b border-[#1e3a4f]/20 p-2 text-right">
            <div className="text-[10px] text-gray-400 min-h-[14px]">{calcInput || "0"}</div>
            <div className="text-sm font-bold text-[#1e3a4f]">{calcResult || "0"}</div>
          </div>
          
          {/* Keyboard input box for direct calculation typing */}
          <div className="p-2 bg-[#e9e3d9] border-b border-[#1e3a4f]/10">
            <input
              type="text"
              placeholder="Type formula (e.g., 250*12) & hit Enter"
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  evaluateCalc();
                }
              }}
              className="w-full bg-white border border-[#1e3a4f]/20 p-1 text-[11px] font-bold text-tally-dark focus:outline-none"
              autoFocus
            />
          </div>
          
          {/* Calculator Grid */}
          <div className="grid grid-cols-4 gap-0.5 p-1 bg-[#f0eada]">
            {[
              "7", "8", "9", "/",
              "4", "5", "6", "*",
              "1", "2", "3", "-",
              "0", ".", "=", "+"
            ].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => handleCalcBtnClick(btn)}
                className="py-1.5 text-xs font-bold bg-[#fcfbfa] hover:bg-[#e2f0fc] active:bg-[#ffb347] border border-[#1e3a4f]/10 transition-colors cursor-pointer"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTRL+K: COMMAND PALETTE SEARCH */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          {/* Backdrop Click Close */}
          <div className="absolute inset-0" onClick={() => setShowCommandPalette(false)} />
          
          {/* Command Card */}
          <div className="relative w-full max-w-md bg-[#f5f0e8] border-2 border-[#1e3a4f] shadow-2xl rounded-sm overflow-hidden tally-fade-in font-mono text-[#1e3a4f] z-10">
            {/* Input Bar */}
            <div className="flex items-center gap-2 p-3 bg-[#1e3a4f] text-white">
              <Search size={16} className="text-[#ffb347]" />
              <input
                type="text"
                placeholder="Type command to search (e.g., Ledgers, P&L)..."
                value={commandSearch}
                onChange={(e) => {
                  setCommandSearch(e.target.value);
                  setPaletteIndex(0);
                }}
                className="w-full bg-transparent border-none text-xs font-bold focus:outline-none placeholder-white/50 text-[#ffb347]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredCommands.length > 0) {
                      triggerCommand(filteredCommands[paletteIndex]);
                    }
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setPaletteIndex(prev => (prev + 1) % filteredCommands.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setPaletteIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                  }
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowCommandPalette(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Commands List */}
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 bg-[#fbf9f6]">
              {filteredCommands.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400 font-bold">
                  No matching commands found.
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === paletteIndex;
                  return (
                    <button
                      key={cmd.title}
                      type="button"
                      onClick={() => triggerCommand(cmd)}
                      className={`w-full text-left py-2 px-3 flex items-center justify-between rounded-sm border transition-colors ${
                        isSelected 
                          ? "bg-[#1e3a4f] text-[#ffb347] border-[#1e3a4f]" 
                          : "hover:bg-[#1e3a4f]/5 text-[#1e3a4f] border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={12} className={isSelected ? "text-[#ffb347]" : "text-[#1e3a4f]/65"} />
                        <span className="text-xs font-bold">{cmd.title}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isSelected 
                          ? "bg-white/10 text-white border-white/20" 
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {cmd.shortcut}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Keyboard tips */}
            <div className="bg-[#e9e3d9] px-3 py-2 text-[10px] text-gray-500 flex justify-between border-t border-[#1e3a4f]/10 select-none">
              <span>Use ↑↓ keys to select</span>
              <span>Press Enter to run</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
