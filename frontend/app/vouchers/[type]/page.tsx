"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ledgerApi, stockItemApi, voucherApi } from "@/lib/api";
import type {
  Ledger,
  StockItem,
  VoucherLineItem,
  VoucherFormData,
  Voucher,
  VoucherType,
} from "@/lib/types";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Save,
  FileText,
  Eye,
  CreditCard,
  ArrowDownLeft,
  BookOpen,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Map URL parameter to backend VoucherType
const typeMap: Record<string, { type: VoucherType; label: string; color: string; icon: any; hotkey: string }> = {
  payment: { type: "PAYMENT", label: "Payment Voucher", color: "from-blue-600/10 text-blue-400 border-blue-500/20", icon: CreditCard, hotkey: "F5" },
  receipt: { type: "RECEIPT", label: "Receipt Voucher", color: "from-green-600/10 text-green-400 border-green-500/20", icon: ArrowDownLeft, hotkey: "F6" },
  journal: { type: "JOURNAL", label: "Journal Voucher", color: "from-amber-600/10 text-amber-400 border-amber-500/20", icon: BookOpen, hotkey: "F7" },
  "credit-note": { type: "CREDIT_NOTE", label: "Credit Note", color: "from-rose-600/10 text-rose-400 border-rose-500/20", icon: TrendingDown, hotkey: "F10" },
  "debit-note": { type: "DEBIT_NOTE", label: "Debit Note", color: "from-red-600/10 text-red-400 border-red-500/20", icon: TrendingUp, hotkey: "F11" },
};

export default function DynamicVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const rawType = (params?.type as string) || "payment";
  const meta = typeMap[rawType] || typeMap.payment;

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);

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
      const [ledgersData, itemsData, vouchersData] = await Promise.all([
        ledgerApi.getAll(),
        stockItemApi.getAll(),
        voucherApi.getAll(meta.type),
      ]);
      setLedgers(ledgersData);
      setStockItems(itemsData);
      setVouchers(vouchersData);
    } catch {
      setLedgers([]);
      setStockItems([]);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [meta.type]);

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
    [meta.hotkey.toLowerCase()]: () => setViewMode("create"),
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

    if (field === "stockItemId") {
      const item = stockItems.find((si) => si.id === value);
      if (item) {
        const usePurchase = ["PAYMENT", "PURCHASE", "DEBIT_NOTE"].includes(meta.type);
        updated[index] = { 
          ...updated[index], 
          rate: usePurchase ? item.purchasePrice : item.sellingPrice 
        };
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
      toast.error("Please select a Ledger");
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
        voucherType: meta.type,
        ledgerId: selectedLedgerId,
        voucherDate,
        notes,
        lineItems: validLines,
      };
      await voucherApi.create(data);
      toast.success(`${meta.label} created successfully!`);
      resetForm();
      setViewMode("list");
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || `Failed to create ${meta.label}`);
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

  const totals = calculateTotals();
  const Icon = meta.icon;

  if (viewMode === "list") {
    return (
      <div className="min-h-full bg-gradient-to-br from-tally-dark via-[#1a2d40] to-tally-dark tally-fade-in font-mono">
        {/* Header */}
        <div className="border-b border-tally-border/50 bg-tally-header/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5 border ${meta.color.split(" ")[2]}`}>
                <Icon size={20} className={meta.color.split(" ")[1]} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-tally-text">
                  {meta.label} Registry
                </h1>
                <p className="text-xs text-tally-text-muted">
                  Double-entry adjustments, cash/bank transfers or ledger notes
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode("create")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 text-xs font-medium border hover:bg-white/10 transition-colors ${meta.color}`}
            >
              <Plus size={13} />
              New Voucher
              <span className="shortcut-key ml-1">{meta.hotkey}</span>
            </button>
          </div>
        </div>

        {/* Voucher List */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-12 text-tally-text-muted text-sm">
              Loading...
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-16">
              <FileText
                size={40}
                className="mx-auto text-tally-text-muted/30 mb-3"
              />
              <p className="text-sm text-tally-text-muted mb-1">
                No vouchers recorded yet
              </p>
              <p className="text-xs text-tally-text-muted/50">
                Press <span className="shortcut-key">{meta.hotkey}</span> to record a new transaction
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-tally-border/30 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-tally-header/40 border-b border-tally-border/30">
                    <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                      Voucher No.
                    </th>
                    <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                      Date
                    </th>
                    <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                      Account / Ledger
                    </th>
                    <th className="text-right px-4 py-2.5 text-tally-text-muted font-semibold">
                      Subtotal
                    </th>
                    <th className="text-right px-4 py-2.5 text-tally-text-muted font-semibold">
                      GST
                    </th>
                    <th className="text-right px-4 py-2.5 text-tally-text-muted font-semibold">
                      Total
                    </th>
                    <th className="text-center px-4 py-2.5 text-tally-text-muted font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v, i) => (
                    <tr
                      key={v.id}
                      className={`border-b border-tally-border/20 hover:bg-tally-sidebar-hover/50 transition-colors cursor-pointer ${
                        i % 2 === 0 ? "bg-tally-dark/20" : ""
                      }`}
                      onClick={() => setDetailVoucher(v)}
                    >
                      <td className="px-4 py-2.5 text-tally-accent font-mono font-medium">
                        {v.voucherNumber}
                      </td>
                      <td className="px-4 py-2.5 text-tally-text-muted">
                        {v.voucherDate}
                      </td>
                      <td className="px-4 py-2.5 text-tally-text font-medium">
                        {v.ledgerName}
                      </td>
                      <td className="px-4 py-2.5 text-right text-tally-text-muted">
                        {formatCurrency(v.subtotal)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-tally-text-muted">
                        {formatCurrency(v.gstAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-tally-text">
                        {formatCurrency(v.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailVoucher(v);
                          }}
                          className="p-1.5 rounded hover:bg-tally-accent/20 text-tally-text-muted hover:text-tally-accent transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Dialog */}
        {detailVoucher && (
          <Dialog
            open={!!detailVoucher}
            onOpenChange={() => setDetailVoucher(null)}
          >
            <DialogContent className="bg-tally-sidebar border-tally-border text-tally-text max-w-2xl font-mono">
              <DialogHeader>
                <DialogTitle className="text-tally-text flex items-center gap-2">
                  <FileText size={16} className={meta.color.split(" ")[1]} />
                  {detailVoucher.voucherNumber} — {meta.label} Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-tally-text-muted">Ledger Account:</span>
                    <p className="font-medium">{detailVoucher.ledgerName}</p>
                  </div>
                  <div>
                    <span className="text-tally-text-muted">Date:</span>
                    <p className="font-medium">{detailVoucher.voucherDate}</p>
                  </div>
                  <div>
                    <span className="text-tally-text-muted">Net Amount:</span>
                    <p className="font-bold text-tally-highlight">
                      {formatCurrency(detailVoucher.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="rounded border border-tally-border/30 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-tally-header/40">
                        <th className="text-left px-3 py-2 text-tally-text-muted">
                          Item / Ref
                        </th>
                        <th className="text-right px-3 py-2 text-tally-text-muted">
                          Qty
                        </th>
                        <th className="text-right px-3 py-2 text-tally-text-muted">
                          Rate
                        </th>
                        <th className="text-right px-3 py-2 text-tally-text-muted">
                          Amount
                        </th>
                        <th className="text-right px-3 py-2 text-tally-text-muted">
                          GST
                        </th>
                        <th className="text-right px-3 py-2 text-tally-text-muted">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailVoucher.lineItems?.map((li, i) => (
                        <tr key={i} className="border-t border-tally-border/20">
                          <td className="px-3 py-2 text-tally-text">
                            {li.stockItemName}
                          </td>
                          <td className="px-3 py-2 text-right text-tally-text-muted">
                            {li.quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-tally-text-muted">
                            {formatCurrency(li.rate)}
                          </td>
                          <td className="px-3 py-2 text-right text-tally-text-muted">
                            {formatCurrency(li.amount || 0)}
                          </td>
                          <td className="px-3 py-2 text-right text-tally-text-muted">
                            {formatCurrency(li.gstAmount || 0)}
                          </td>
                          <td className="px-3 py-2 text-right text-tally-text font-medium">
                            {formatCurrency(li.total || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-tally-dark via-[#1a2d40] to-tally-dark tally-fade-in font-mono">
      {/* Header */}
      <div className="border-b border-tally-border/50 bg-tally-header/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/5 border ${meta.color.split(" ")[2]}`}>
              <Icon size={20} className={meta.color.split(" ")[1]} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-tally-text">
                {meta.label} — New Entry
              </h1>
              <p className="text-xs text-tally-text-muted">
                Record accounting adjustments and cash flows
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
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium border bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 ${meta.color}`}
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
            {/* Account Selector */}
            <div>
              <label className="text-xs text-tally-text-muted mb-1 block font-bold">
                Account / Ledger Party:
              </label>
              <select
                value={selectedLedgerId}
                onChange={(e) =>
                  setSelectedLedgerId(parseInt(e.target.value) || 0)
                }
                className="tally-input w-full rounded-md text-xs font-bold font-mono"
              >
                <option value={0}>-- Select Ledger --</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-tally-text-muted mb-1 block font-bold">
                Voucher Date:
              </label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="tally-input w-full rounded-md text-xs font-bold"
              />
            </div>

            {/* Narration */}
            <div>
              <label className="text-xs text-tally-text-muted mb-1 block font-bold">
                Narration:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="tally-input w-full rounded-md text-xs"
                placeholder="Details of transaction..."
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-lg border border-tally-border/30 overflow-hidden">
          <div className="bg-tally-header/40 px-4 py-2 flex items-center justify-between border-b border-tally-border/30">
            <span className="text-xs font-semibold text-tally-text-muted font-bold">
              Transaction Items / References
            </span>
            <button
              onClick={addLineItem}
              className="flex items-center gap-1 text-xs text-tally-accent hover:text-tally-accent/80 transition-colors"
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
                  Stock Item Reference
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
                        className="tally-input w-full rounded text-xs font-bold"
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
                        className="tally-input w-full rounded text-xs text-right font-bold"
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
                        className="tally-input w-full rounded text-xs text-right font-bold"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right text-tally-text-muted font-semibold">
                      {formatCurrency(calc.amount)}
                    </td>
                    <td className="px-3 py-1.5 text-center text-tally-text-muted font-semibold">
                      {calc.gstRate}%
                    </td>
                    <td className="px-3 py-1.5 text-right text-tally-text-muted font-semibold">
                      {formatCurrency(calc.gstAmount)}
                    </td>
                    <td className="px-3 py-1.5 text-right font-bold text-tally-text">
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
            <div className="flex justify-end gap-8 text-xs font-bold">
              <div className="text-right">
                <span className="text-tally-text-muted">Subtotal:</span>
                <p className="font-semibold text-tally-text">
                  {formatCurrency(totals.subtotal)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-tally-text-muted">GST:</span>
                <p className="font-semibold text-tally-text">
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
