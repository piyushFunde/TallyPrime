"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ledgerApi, stockItemApi, voucherApi } from "@/lib/api";
import type { Ledger, StockItem, Voucher } from "@/lib/types";
import { toast } from "sonner";
import {
  TrendingUp,
  FileText,
  ChevronLeft,
  Briefcase,
  Layers,
  Scale,
  Receipt,
  PieChart,
  BarChart,
} from "lucide-react";

// Map report URL slugs to titles, icons, and themes
const reportMap: Record<
  string,
  { title: string; subtitle: string; icon: any; color: string; border: string }
> = {
  "balance-sheet": {
    title: "Balance Sheet",
    subtitle: "Capital liabilities, assets, and equity statement",
    icon: Briefcase,
    color: "text-emerald-400 bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  "profit-loss": {
    title: "Profit & Loss A/c",
    subtitle: "Trading revenue, purchase costs, and net margin",
    icon: PieChart,
    color: "text-rose-400 bg-rose-500/10",
    border: "border-rose-500/20",
  },
  "trial-balance": {
    title: "Trial Balance",
    subtitle: "Ledger debit and credit balance alignment registry",
    icon: Scale,
    color: "text-amber-400 bg-amber-500/10",
    border: "border-amber-500/20",
  },
  "cash-flow": {
    title: "Cash Flow Statement",
    subtitle: "Operating cash inflows, payments, and balances",
    icon: BarChart,
    color: "text-sky-400 bg-sky-500/10",
    border: "border-sky-500/20",
  },
  "stock-summary": {
    title: "Stock Summary",
    subtitle: "Inventory stock items holding value statement",
    icon: Layers,
    color: "text-indigo-400 bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  gst: {
    title: "GST Filing Reports (GSTR-1 & GSTR-2)",
    subtitle: "CGST/SGST/IGST tax collection summary",
    icon: Receipt,
    color: "text-purple-400 bg-purple-500/10",
    border: "border-purple-500/20",
  },
};

export default function DynamicReportPage() {
  const router = useRouter();
  const params = useParams();
  const rawType = (params?.type as string) || "balance-sheet";
  const meta = reportMap[rawType] || reportMap["balance-sheet"];

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ledgersData, itemsData, vouchersData] = await Promise.all([
        ledgerApi.getAll(),
        stockItemApi.getAll(),
        voucherApi.getAll(),
      ]);
      setLedgers(ledgersData);
      setStockItems(itemsData);
      setVouchers(vouchersData);
    } catch {
      toast.error("Failed to load reporting database registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useKeyboardShortcuts({
    escape: () => router.push("/"),
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // ==========================================
  // CALCULATE REPORT METRICS
  // ==========================================
  const totalCustomerBal = ledgers
    .filter((l) => l.type === "CUSTOMER")
    .reduce((sum, l) => sum + l.currentBalance, 0);

  const totalSupplierBal = ledgers
    .filter((l) => l.type === "SUPPLIER")
    .reduce((sum, l) => sum + l.currentBalance, 0);

  const totalStockValue = stockItems.reduce(
    (sum, item) => sum + item.currentStock * item.purchasePrice,
    0
  );

  const totalSales = vouchers
    .filter((v) => v.voucherType === "SALES")
    .reduce((sum, v) => sum + v.subtotal, 0);

  const totalPurchase = vouchers
    .filter((v) => v.voucherType === "PURCHASE")
    .reduce((sum, v) => sum + v.subtotal, 0);

  const totalGstSales = vouchers
    .filter((v) => v.voucherType === "SALES")
    .reduce((sum, v) => sum + v.gstAmount, 0);

  const totalGstPurchase = vouchers
    .filter((v) => v.voucherType === "PURCHASE")
    .reduce((sum, v) => sum + v.gstAmount, 0);

  const netProfit = totalSales - totalPurchase;
  const netGstPayable = totalGstSales - totalGstPurchase;

  // Mock static variables for Balance Sheet calculations
  const cashInHand = 150000; // Mock standard cash balance
  const bankAccount = 450000; // Mock standard bank balance
  const shareCapital = 500000; // Mock standard base capital

  const totalAssetsVal = totalCustomerBal + totalStockValue + cashInHand + bankAccount;
  const totalLiabilitiesVal = totalSupplierBal + shareCapital + (netProfit > 0 ? netProfit : 0);

  const Icon = meta.icon;

  return (
    <div className="min-h-full bg-gradient-to-br from-tally-dark via-[#1a2d40] to-tally-dark tally-fade-in font-mono text-tally-text pb-6">
      {/* Header */}
      <div className="border-b border-tally-border/50 bg-tally-header/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-1 rounded hover:bg-white/10 text-tally-text-muted hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <div className={`p-2 rounded-lg border ${meta.border} ${meta.color}`}>
              <Icon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">{meta.title}</h1>
              <p className="text-xs text-tally-text-muted">{meta.subtitle}</p>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-bold">
            Accounting Period: 01-Apr-2026 to 31-Mar-2027
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="px-6 py-5">
        {loading ? (
          <div className="text-center py-12 text-tally-text-muted text-sm">
            Calculating report values...
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. BALANCE SHEET */}
            {rawType === "balance-sheet" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Liabilities Side */}
                <div className="border border-tally-border/30 rounded-lg overflow-hidden bg-tally-sidebar/20">
                  <div className="bg-tally-header/40 px-4 py-2 border-b border-tally-border/30 text-xs font-bold text-tally-text-muted flex justify-between">
                    <span>LIABILITIES & CAPITAL</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="p-3 text-xs space-y-2.5">
                    <div className="flex justify-between border-b border-tally-border/10 pb-1">
                      <span>Capital Account (Share Capital)</span>
                      <span>{formatCurrency(shareCapital)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1">
                      <span>Current Liabilities (Sundry Creditors)</span>
                      <span className="text-rose-400">{formatCurrency(totalSupplierBal)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1 font-bold">
                      <span>Profit & Loss A/c (Net Profit)</span>
                      <span className="text-emerald-400">{formatCurrency(netProfit > 0 ? netProfit : 0)}</span>
                    </div>
                    <div className="flex justify-between pt-3 font-bold text-sm text-tally-highlight">
                      <span>Total Liabilities</span>
                      <span>{formatCurrency(totalLiabilitiesVal)}</span>
                    </div>
                  </div>
                </div>

                {/* Assets Side */}
                <div className="border border-tally-border/30 rounded-lg overflow-hidden bg-tally-sidebar/20">
                  <div className="bg-tally-header/40 px-4 py-2 border-b border-tally-border/30 text-xs font-bold text-tally-text-muted flex justify-between">
                    <span>ASSETS & INVENTORY</span>
                    <span>Amount (₹)</span>
                  </div>
                  <div className="p-3 text-xs space-y-2.5">
                    <div className="flex justify-between border-b border-tally-border/10 pb-1">
                      <span>Fixed Assets</span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1">
                      <span>Closing Inventory (Stock-in-Hand)</span>
                      <span>{formatCurrency(totalStockValue)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1">
                      <span>Current Assets (Sundry Debtors)</span>
                      <span className="text-emerald-400">{formatCurrency(totalCustomerBal)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1">
                      <span>Bank Accounts / Cash-in-Hand</span>
                      <span>{formatCurrency(cashInHand + bankAccount)}</span>
                    </div>
                    <div className="flex justify-between pt-3 font-bold text-sm text-tally-highlight">
                      <span>Total Assets</span>
                      <span>{formatCurrency(totalAssetsVal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PROFIT & LOSS */}
            {rawType === "profit-loss" && (
              <div className="border border-tally-border/30 rounded-lg overflow-hidden bg-tally-sidebar/20 max-w-3xl mx-auto">
                <div className="bg-tally-header/40 px-4 py-2 border-b border-tally-border/30 text-xs font-bold text-tally-text-muted flex justify-between">
                  <span>Particulars</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-4 text-xs space-y-3.5">
                  <div className="flex justify-between border-b border-tally-border/10 pb-1.5 font-bold text-tally-text">
                    <span>Trading / Operating Revenue (Sales)</span>
                    <span className="text-emerald-400">{formatCurrency(totalSales)}</span>
                  </div>
                  <div className="flex justify-between border-b border-tally-border/10 pb-1.5 text-tally-text-muted pl-4">
                    <span>Cost of Goods Sold (Purchase Value)</span>
                    <span className="text-rose-400">({formatCurrency(totalPurchase)})</span>
                  </div>
                  <div className="flex justify-between border-b border-tally-border/10 pb-1.5 text-tally-text-muted pl-4">
                    <span>Direct Manufacturing Expenses</span>
                    <span>{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between border-b border-tally-border/20 pb-2 pt-2 font-bold text-sm text-tally-highlight">
                    <span>Net Margin Profit / Loss</span>
                    <span className={netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TRIAL BALANCE */}
            {rawType === "trial-balance" && (
              <div className="border border-tally-border/30 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-tally-header/40 border-b border-tally-border/30">
                      <th className="text-left px-4 py-3 text-tally-text-muted font-semibold">Ledger Name</th>
                      <th className="text-left px-4 py-3 text-tally-text-muted font-semibold">Group / Type</th>
                      <th className="text-right px-4 py-3 text-tally-text-muted font-semibold">Debit Balance (₹)</th>
                      <th className="text-right px-4 py-3 text-tally-text-muted font-semibold">Credit Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgers.map((l, i) => (
                      <tr key={l.id} className={`border-b border-tally-border/20 ${i % 2 === 0 ? "bg-tally-dark/20" : ""}`}>
                        <td className="px-4 py-2.5 font-bold text-tally-text">{l.name}</td>
                        <td className="px-4 py-2.5 text-tally-text-muted">{l.type}</td>
                        <td className="px-4 py-2.5 text-right text-emerald-400">
                          {l.type === "CUSTOMER" ? formatCurrency(l.currentBalance) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-400">
                          {l.type === "SUPPLIER" ? formatCurrency(l.currentBalance) : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Grand totals alignment */}
                    <tr className="bg-tally-header/30 font-bold border-t border-tally-border/40 text-tally-highlight">
                      <td className="px-4 py-3" colSpan={2}>Grand Total Balanced</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(totalCustomerBal)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(totalSupplierBal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. CASH FLOW */}
            {rawType === "cash-flow" && (
              <div className="border border-tally-border/30 rounded-lg overflow-hidden bg-tally-sidebar/20 max-w-3xl mx-auto">
                <div className="bg-tally-header/40 px-4 py-2 border-b border-tally-border/30 text-xs font-bold text-tally-text-muted flex justify-between">
                  <span>Particulars</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-4 text-xs space-y-3">
                  <div className="flex justify-between border-b border-tally-border/10 pb-1">
                    <span>Cash Flows from Operating Activities (Receipts)</span>
                    <span className="text-emerald-400">{formatCurrency(totalSales)}</span>
                  </div>
                  <div className="flex justify-between border-b border-tally-border/10 pb-1">
                    <span>Less: Operating Payments (Purchases / Expenses)</span>
                    <span className="text-rose-400">({formatCurrency(totalPurchase)})</span>
                  </div>
                  <div className="flex justify-between border-b border-tally-border/10 pb-1">
                    <span>Net cash from Operating Activities</span>
                    <span className="font-bold">{formatCurrency(netProfit)}</span>
                  </div>
                  <div className="flex justify-between border-b border-tally-border/10 pb-1">
                    <span>Cash Flow from Financing Activities (Base Capital)</span>
                    <span>{formatCurrency(shareCapital)}</span>
                  </div>
                  <div className="flex justify-between pt-3 font-bold text-sm text-tally-highlight">
                    <span>Ending Cash & Equivalents Balance</span>
                    <span>{formatCurrency(shareCapital + netProfit)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. STOCK SUMMARY */}
            {rawType === "stock-summary" && (
              <div className="border border-tally-border/30 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-tally-header/40 border-b border-tally-border/30">
                      <th className="text-left px-4 py-3 text-tally-text-muted font-semibold">SKU / Item</th>
                      <th className="text-left px-4 py-3 text-tally-text-muted font-semibold">HSN Code</th>
                      <th className="text-right px-4 py-3 text-tally-text-muted font-semibold">Qty</th>
                      <th className="text-right px-4 py-3 text-tally-text-muted font-semibold">Valuation Rate</th>
                      <th className="text-right px-4 py-3 text-tally-text-muted font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockItems.map((item, i) => (
                      <tr key={item.id} className={`border-b border-tally-border/20 ${i % 2 === 0 ? "bg-tally-dark/20" : ""}`}>
                        <td className="px-4 py-2.5 font-bold text-tally-text">{item.name}</td>
                        <td className="px-4 py-2.5 text-tally-text-muted font-mono">{item.hsnCode || "N/A"}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{item.currentStock} {item.unit}</td>
                        <td className="px-4 py-2.5 text-right text-tally-text-muted">{formatCurrency(item.purchasePrice)}</td>
                        <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(item.currentStock * item.purchasePrice)}</td>
                      </tr>
                    ))}
                    <tr className="bg-tally-header/30 font-bold border-t border-tally-border/40 text-tally-highlight">
                      <td className="px-4 py-3" colSpan={4}>Total Stock Asset Inventory Valuation</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(totalStockValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. GST REPORTS */}
            {rawType === "gst" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-tally-border/30 rounded-lg p-3 bg-tally-sidebar/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-tally-text-muted">Total Output GST (Sales)</span>
                    <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(totalGstSales)}</p>
                  </div>
                  <div className="border border-tally-border/30 rounded-lg p-3 bg-tally-sidebar/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-tally-text-muted">Total Input GST (Purchases)</span>
                    <p className="text-lg font-bold text-rose-400 mt-1">{formatCurrency(totalGstPurchase)}</p>
                  </div>
                  <div className="border border-tally-border/30 rounded-lg p-3 bg-tally-sidebar/20 text-center">
                    <span className="text-[10px] uppercase font-bold text-tally-text-muted">Net GST Payable / Refund</span>
                    <p className="text-lg font-bold text-tally-highlight mt-1">{formatCurrency(netGstPayable)}</p>
                  </div>
                </div>

                <div className="border border-tally-border/30 rounded-lg overflow-hidden bg-tally-sidebar/10">
                  <div className="bg-tally-header/40 px-4 py-2 border-b border-tally-border/30 text-xs font-bold text-tally-text-muted">
                    GST Split Breakdowns (50% CGST / 50% SGST)
                  </div>
                  <div className="p-4 text-xs space-y-3.5">
                    <div className="flex justify-between border-b border-tally-border/10 pb-1.5">
                      <span>Central Tax (CGST Payable)</span>
                      <span>{formatCurrency(totalGstSales / 2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1.5">
                      <span>State Tax (SGST Payable)</span>
                      <span>{formatCurrency(totalGstSales / 2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-tally-border/10 pb-1.5 font-bold">
                      <span>Total Output Liability</span>
                      <span>{formatCurrency(totalGstSales)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
