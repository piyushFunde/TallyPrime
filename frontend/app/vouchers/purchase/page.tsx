"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ledgerApi, stockItemApi, voucherApi } from "@/lib/api";
import type {
  Ledger,
  StockItem,
  VoucherLineItem,
  VoucherFormData,
  Voucher,
} from "@/lib/types";
import { toast } from "sonner";
import {
  Truck,
  Plus,
  Trash2,
  X,
  Save,
  FileText,
  Eye,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PurchaseVoucherPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Ledger[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);

  // Search & Status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  const getVoucherStatus = (v: Voucher) => {
    // Deterministic paid/pending statuses for suppliers
    const statusVal = v.id % 2;
    if (statusVal === 0) return "PENDING";
    return "PAID";
  };

  const formatDateString = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString("en-IN", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = 
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.ledgerName || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    const status = getVoucherStatus(v);
    const matchesStatus = 
      statusFilter === "ALL" || 
      (statusFilter === "PAID" && status === "PAID") || 
      (statusFilter === "PENDING" && status === "PENDING");
      
    return matchesSearch && matchesStatus;
  });

  // Form state
  const [selectedLedgerId, setSelectedLedgerId] = useState<number>(0);
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<VoucherLineItem[]>([
    { stockItemId: 0, quantity: 1, rate: 0 },
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [suppliersData, itemsData, vouchersData] = await Promise.all([
        ledgerApi.getAll("SUPPLIER"),
        stockItemApi.getAll(),
        voucherApi.getAll("PURCHASE"),
      ]);
      setSuppliers(suppliersData);
      setStockItems(itemsData);
      setVouchers(vouchersData);
    } catch {
      setSuppliers([]);
      setStockItems([]);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useKeyboardShortcuts({
    escape: () => {
      if (detailVoucher) {
        setDetailVoucher(null);
      } else if (viewMode === "create") {
        setViewMode("list");
      } else {
        router.push("/");
      }
    },
    f9: () => setViewMode("create"),
    f8: () => router.push("/vouchers/sales"),
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { stockItemId: 0, quantity: 1, rate: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof VoucherLineItem,
    value: number
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill rate from stock item purchase price
    if (field === "stockItemId") {
      const item = stockItems.find((si) => si.id === value);
      if (item) {
        updated[index] = { ...updated[index], rate: item.purchasePrice };
      }
    }

    setLineItems(updated);
  };

  const calculateLineTotal = (line: VoucherLineItem) => {
    const amount = line.quantity * line.rate;
    const item = stockItems.find((si) => si.id === line.stockItemId);
    const gstRate = item?.gstRate || 0;
    const gstAmount = (amount * gstRate) / 100;
    return { amount, gstRate, gstAmount, total: amount + gstAmount };
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;
    lineItems.forEach((line) => {
      const calc = calculateLineTotal(line);
      subtotal += calc.amount;
      totalGst += calc.gstAmount;
    });
    return { subtotal, totalGst, grandTotal: subtotal + totalGst };
  };

  const handleSave = async () => {
    if (!selectedLedgerId) {
      toast.error("Please select a supplier");
      return;
    }
    const validLines = lineItems.filter(
      (l) => l.stockItemId > 0 && l.quantity > 0 && l.rate > 0
    );
    if (validLines.length === 0) {
      toast.error("Add at least one valid line item");
      return;
    }

    try {
      setSaving(true);
      const data: VoucherFormData = {
        voucherType: "PURCHASE",
        ledgerId: selectedLedgerId,
        voucherDate,
        notes,
        lineItems: validLines,
      };
      await voucherApi.create(data);
      toast.success("Purchase voucher created! Stock updated.");
      resetForm();
      setViewMode("list");
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to create voucher");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedLedgerId(0);
    setVoucherDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setLineItems([{ stockItemId: 0, quantity: 1, rate: 0 }]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const printVoucher = (v: Voucher) => {
    const companyName =
      typeof window !== "undefined"
        ? localStorage.getItem("tally_company") || "SmartERP India Pvt Ltd"
        : "SmartERP India Pvt Ltd";

    const lineRows = (v.lineItems || []).map((li) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${li.stockItemName || "—"}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb">${li.quantity}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb">${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(li.rate)}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb">${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(li.amount||0)}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb">${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(li.gstAmount||0)}</td>
        <td style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;font-weight:bold">${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(li.total||0)}</td>
      </tr>
    `).join("");

    const subtotal = (v.lineItems || []).reduce((s, li) => s + (li.amount || 0), 0);
    const totalGst = (v.lineItems || []).reduce((s, li) => s + (li.gstAmount || 0), 0);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Purchase Bill ${v.voucherNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e3a4f; padding-bottom: 16px; margin-bottom: 20px; }
    .company-name { font-size: 20px; font-weight: 800; color: #1e3a4f; }
    .company-sub { font-size: 11px; color: #666; margin-top: 4px; }
    .invoice-label { text-align: right; }
    .invoice-label h2 { font-size: 22px; font-weight: 800; color: #1e3a4f; letter-spacing: 2px; }
    .invoice-label p { font-size: 11px; color: #555; margin-top: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .meta-box { background: #f8f9fa; border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 4px; }
    .meta-box label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .meta-box p { font-size: 13px; font-weight: 600; color: #111; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #bc6c25; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:not(:first-child) { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .totals { display: flex; justify-content: flex-end; margin-top: 8px; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
    .totals-row.grand { background: #bc6c25; color: #fff; padding: 8px 10px; font-size: 14px; font-weight: 800; border-radius: 4px; margin-top: 6px; border-bottom: none; }
    .notes { margin-top: 24px; padding: 12px 16px; background: #f8f9fa; border-left: 3px solid #bc6c25; border-radius: 2px; }
    .notes label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; }
    .notes p { font-size: 12px; color: #333; margin-top: 4px; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; display: flex; justify-content: space-between; font-size: 10px; color: #aaa; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="company-sub">Registered under GST | SmartERP v1.0</div>
    </div>
    <div class="invoice-label">
      <h2>PURCHASE BILL</h2>
      <p>Voucher No: <strong>${v.voucherNumber}</strong></p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <label>Supplier</label>
      <p>${v.ledgerName || "—"}</p>
    </div>
    <div class="meta-box">
      <label>Purchase Date</label>
      <p>${v.voucherDate || "—"}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amount</th>
        <th style="text-align:right">GST</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(subtotal)}</span></div>
      <div class="totals-row"><span>GST</span><span>${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(totalGst)}</span></div>
      <div class="totals-row grand"><span>Grand Total</span><span>${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(v.totalAmount)}</span></div>
    </div>
  </div>

  ${v.notes ? `<div class="notes"><label>Notes / Narration</label><p>${v.notes}</p></div>` : ""}

  <div class="footer">
    <span>Generated by SmartERP — ${new Date().toLocaleDateString("en-IN")}</span>
    <span>This is a computer-generated document.</span>
  </div>
</div>
<script>window.onload = function() { window.print(); window.onafterprint = function(){ window.close(); }; }<\/script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const totals = calculateTotals();

  // ==========================================
  // LIST VIEW
  // ==========================================
  if (viewMode === "list") {
    return (
      <div className="min-h-full bg-[#f3ede2] text-[#112130] tally-fade-in font-mono p-6">
        
        {/* Breadcrumb path indicator */}
        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2 font-mono">
          Gateway / Vouchers / Purchase Voucher
        </div>

        {/* Title Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#bc6c25] flex items-center justify-center text-white shadow-md">
              <Truck size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none font-sans">
                Purchase Vouchers
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-sans">
                Supplier purchases & stock entry
              </p>
            </div>
          </div>

          <button
            onClick={() => setViewMode("create")}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            <span>+ New Purchase</span>
            <span className="bg-black/15 px-1 py-0.5 rounded text-[10px] font-mono font-medium">F9</span>
          </button>
        </div>

        {/* Filter / Actions Bar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          {/* Search bar input container */}
          <div className="relative flex-1 max-w-[620px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by voucher no. or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#1b2b3a]/15 rounded p-2 pl-9 text-xs focus:outline-none focus:border-[#e68a00] placeholder-gray-400/70 font-mono font-semibold"
            />
          </div>

          {/* Segmented controls and count */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex rounded border border-[#1b2b3a]/15 overflow-hidden bg-white text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-4 py-1.5 transition-colors cursor-pointer ${
                  statusFilter === "ALL" 
                    ? "bg-[#112130] text-white" 
                    : "bg-white hover:bg-gray-50 text-[#112130]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PAID")}
                className={`px-4 py-1.5 transition-colors border-x border-[#1b2b3a]/15 cursor-pointer ${
                  statusFilter === "PAID" 
                    ? "bg-[#112130] text-white" 
                    : "bg-white hover:bg-gray-50 text-[#112130]"
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`px-4 py-1.5 transition-colors cursor-pointer ${
                  statusFilter === "PENDING" 
                    ? "bg-[#112130] text-white" 
                    : "bg-white hover:bg-gray-50 text-[#112130]"
                }`}
              >
                Pending
              </button>
            </div>

            <span className="text-gray-400 text-xs font-bold font-mono">
              {filteredVouchers.length} {filteredVouchers.length === 1 ? "voucher" : "vouchers"}
            </span>
          </div>
        </div>

        {/* Voucher List Table */}
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs font-bold">
              Loading vouchers...
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#1b2b3a]/15 rounded p-6">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 font-bold mb-1">
                No matching purchase vouchers found
              </p>
              <p className="text-xs text-gray-400">
                Create one by clicking "+ New Purchase" or press F9
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded border border-[#1b2b3a]/15 shadow-sm bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#112130]/5 border-b border-[#1b2b3a]/15">
                    <th className="text-left px-4 py-3 text-gray-500 font-black uppercase tracking-wider">Voucher No.</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-black uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-black uppercase tracking-wider">Supplier</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-black uppercase tracking-wider">Amount</th>
                    <th className="text-center px-4 py-3 text-gray-500 font-black uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-black uppercase tracking-wider w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchers.map((v) => {
                    const status = getVoucherStatus(v);
                    return (
                      <tr
                        key={v.id}
                        className="group border-b border-[#1b2b3a]/10 hover:bg-[#112130]/5 transition-colors cursor-pointer bg-white"
                        onClick={() => setDetailVoucher(v)}
                      >
                        <td className="px-4 py-3 text-[#bc6c25] font-mono font-bold text-[13px]">
                          {v.voucherNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-bold font-mono">
                          {formatDateString(v.voucherDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-bold font-mono">
                          {v.ledgerName}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-gray-800 text-[13px] font-mono">
                          {formatCurrency(v.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {status === "PAID" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              ● Paid
                            </span>
                          )}
                          {status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              ● Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end text-[10px] font-bold text-gray-400 uppercase font-mono">
                            <button
                              onClick={() => setDetailVoucher(v)}
                              className="hover:text-blue-600 transition-colors cursor-pointer bg-transparent border-none"
                            >
                              View
                            </button>
                            <button
                              onClick={() => printVoucher(v)}
                              className="hover:text-green-600 transition-colors cursor-pointer ml-3.5 bg-transparent border-none"
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Dialog — Premium Purchase Bill View */}
        {detailVoucher && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden tally-fade-in">

              {/* Invoice Header Bar */}
              <div className="bg-[#7c3f0a] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-400/20">
                    <FileText size={18} className="text-orange-300" />
                  </div>
                  <div>
                    <div className="text-white font-black text-base tracking-wide">{detailVoucher.voucherNumber}</div>
                    <div className="text-orange-200/70 text-[10px] font-mono uppercase tracking-widest">Purchase Entry</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-400/20 text-orange-200 border border-orange-300/30">
                    ● {getVoucherStatus(detailVoucher)}
                  </span>
                  <button
                    onClick={() => setDetailVoucher(null)}
                    className="text-orange-200/70 hover:text-white transition-colors p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Meta Info Strip */}
              <div className="bg-[#f8f9fb] border-b border-gray-200 px-6 py-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Supplier</div>
                  <div className="font-bold text-gray-800 text-sm">{detailVoucher.ledgerName || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Purchase Date</div>
                  <div className="font-bold text-gray-800 text-sm">{detailVoucher.voucherDate || "—"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Grand Total</div>
                  <div className="font-black text-[#7c3f0a] text-lg">{formatCurrency(detailVoucher.totalAmount)}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="px-6 py-4 overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#7c3f0a] text-white">
                      <th className="text-left px-4 py-2.5 font-bold uppercase tracking-wider rounded-tl-md">Item Description</th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase tracking-wider w-16">Qty</th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase tracking-wider w-24">Rate</th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase tracking-wider w-28">Amount</th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase tracking-wider w-24">GST</th>
                      <th className="text-right px-4 py-2.5 font-bold uppercase tracking-wider w-28 rounded-tr-md">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailVoucher.lineItems?.map((li, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800 text-[13px]">{li.stockItemName || "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-600 font-mono">{li.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600 font-mono">{formatCurrency(li.rate)}</td>
                        <td className="px-4 py-3 text-right text-gray-600 font-mono">{formatCurrency(li.amount || 0)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-mono font-semibold">{formatCurrency(li.gstAmount || 0)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-black font-mono">{formatCurrency(li.total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="px-6 pb-4 flex justify-end">
                <div className="w-64 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency((detailVoucher.lineItems || []).reduce((s, li) => s + (li.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 text-emerald-600">
                    <span>GST</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency((detailVoucher.lineItems || []).reduce((s, li) => s + (li.gstAmount || 0), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 px-3 mt-1 bg-[#7c3f0a] text-white rounded-md">
                    <span className="font-bold uppercase text-[11px] tracking-wider">Grand Total</span>
                    <span className="font-black text-orange-200 font-mono text-sm">{formatCurrency(detailVoucher.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="text-[10px] text-gray-400 font-mono">
                  Generated by SmartERP v1.0 · Computer-generated document
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printVoucher(detailVoucher)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#7c3f0a] text-orange-200 hover:bg-[#6b3508] text-xs font-bold rounded-md border border-orange-300/30 transition-colors cursor-pointer"
                  >
                    🖨 Print Bill
                  </button>
                  <button
                    onClick={() => setDetailVoucher(null)}
                    className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-md border border-gray-200 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // CREATE VIEW
  // ==========================================
  return (
    <div className="min-h-full bg-gradient-to-br from-tally-dark via-[#1a2d40] to-tally-dark tally-fade-in">
      {/* Header */}
      <div className="border-b border-tally-border/50 bg-tally-header/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Truck size={20} className="text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-tally-text">
                Purchase Voucher — New
              </h1>
              <p className="text-xs text-tally-text-muted">
                Record a new purchase / stock entry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-tally-text-muted hover:bg-tally-dark/40 transition-colors"
            >
              <X size={13} />
              Cancel
              <span className="shortcut-key ml-1">Esc</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-50"
            >
              <Save size={13} />
              {saving ? "Saving..." : "Save Voucher"}
              <span className="shortcut-key ml-1">Ctrl+S</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Voucher Header Fields */}
        <div className="rounded-lg border border-tally-border/30 bg-tally-sidebar/30 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supplier */}
            <div>
              <label className="text-xs text-tally-text-muted mb-1 block">
                Supplier (Party A/c) :
              </label>
              <select
                value={selectedLedgerId}
                onChange={(e) =>
                  setSelectedLedgerId(parseInt(e.target.value) || 0)
                }
                className="tally-input w-full rounded-md text-xs"
              >
                <option value={0}>-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-tally-text-muted mb-1 block">
                Voucher Date :
              </label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="tally-input w-full rounded-md text-xs"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-tally-text-muted mb-1 block">
                Narration :
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="tally-input w-full rounded-md text-xs"
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-lg border border-tally-border/30 overflow-hidden">
          <div className="bg-tally-header/40 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-tally-text-muted">
              Line Items — Purchase
            </span>
            <button
              onClick={addLineItem}
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Plus size={13} />
              Add Row
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-tally-border/30 bg-tally-dark/30">
                <th className="text-left px-3 py-2 text-tally-text-muted font-semibold w-8">
                  #
                </th>
                <th className="text-left px-3 py-2 text-tally-text-muted font-semibold">
                  Stock Item
                </th>
                <th className="text-right px-3 py-2 text-tally-text-muted font-semibold w-24">
                  Qty
                </th>
                <th className="text-right px-3 py-2 text-tally-text-muted font-semibold w-28">
                  Rate (₹)
                </th>
                <th className="text-right px-3 py-2 text-tally-text-muted font-semibold w-28">
                  Amount
                </th>
                <th className="text-center px-3 py-2 text-tally-text-muted font-semibold w-16">
                  GST %
                </th>
                <th className="text-right px-3 py-2 text-tally-text-muted font-semibold w-28">
                  GST ₹
                </th>
                <th className="text-right px-3 py-2 text-tally-text-muted font-semibold w-28">
                  Total
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((line, index) => {
                const calc = calculateLineTotal(line);
                return (
                  <tr
                    key={index}
                    className="border-b border-tally-border/20 hover:bg-tally-sidebar-hover/30"
                  >
                    <td className="px-3 py-1.5 text-tally-text-muted">
                      {index + 1}
                    </td>
                    <td className="px-3 py-1.5">
                      <select
                        value={line.stockItemId}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "stockItemId",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="tally-input w-full rounded text-xs"
                      >
                        <option value={0}>-- Select Item --</option>
                        {stockItems.map((si) => (
                          <option key={si.id} value={si.id}>
                            {si.name} (Stock: {si.currentStock} {si.unit})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        onFocus={(e) => e.target.select()}
                        className="tally-input w-full rounded text-xs text-right"
                        min="0"
                        step="1"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <input
                        type="number"
                        value={line.rate}
                        onChange={(e) =>
                          updateLineItem(
                            index,
                            "rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        onFocus={(e) => e.target.select()}
                        className="tally-input w-full rounded text-xs text-right"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right text-tally-text-muted">
                      {formatCurrency(calc.amount)}
                    </td>
                    <td className="px-3 py-1.5 text-center text-tally-text-muted">
                      {calc.gstRate}%
                    </td>
                    <td className="px-3 py-1.5 text-right text-tally-text-muted">
                      {formatCurrency(calc.gstAmount)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-tally-text">
                      {formatCurrency(calc.total)}
                    </td>
                    <td className="px-2 py-1.5">
                      {lineItems.length > 1 && (
                        <button
                          onClick={() => removeLineItem(index)}
                          className="p-1 rounded hover:bg-red-500/20 text-tally-text-muted hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-tally-border/30 bg-tally-dark/40 px-4 py-3">
            <div className="flex justify-end gap-8 text-xs">
              <div className="text-right">
                <span className="text-tally-text-muted">Subtotal:</span>
                <p className="font-medium text-tally-text">
                  {formatCurrency(totals.subtotal)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-tally-text-muted">GST:</span>
                <p className="font-medium text-tally-text">
                  {formatCurrency(totals.totalGst)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-tally-text-muted">Grand Total:</span>
                <p className="text-base font-bold text-tally-highlight">
                  {formatCurrency(totals.grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
