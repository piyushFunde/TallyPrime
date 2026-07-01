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

  const totals = calculateTotals();

  // ==========================================
  // LIST VIEW
  // ==========================================
  if (viewMode === "list") {
    return (
      <div className="min-h-full bg-[#f3ede2] text-[#112130] tally-fade-in font-mono">
        {/* Header */}
        <div className="border-b border-[#1b2b3a]/15 bg-white/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-orange-500/10 text-[#bc6c25]">
                <Truck size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black text-[#112130] leading-none font-sans">
                  Purchase Vouchers
                </h1>
                <p className="text-xs text-gray-500 mt-1.5 font-sans">
                  Supplier purchases & stock entry
                </p>
              </div>
            </div>
            <button
              onClick={() => setViewMode("create")}
              className="px-4 py-1.5 rounded bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              + New Purchase <span className="text-[10px] opacity-80 font-normal ml-0.5">F9</span>
            </button>
          </div>
        </div>

        {/* Voucher List */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              Loading vouchers...
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#1b2b3a]/15 rounded-md p-6">
              <FileText size={40} className="mx-auto text-gray-400/45 mb-3" />
              <p className="text-sm text-gray-500 font-bold mb-1">
                No purchase vouchers yet
              </p>
              <p className="text-xs text-gray-400">
                Press <span className="shortcut-key font-bold text-[#e68a00] bg-[#e68a00]/10 px-1 py-0.5 rounded font-mono">F9</span> to create a new purchase voucher.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-[#1b2b3a]/15 shadow-sm bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#112130]/5 border-b border-[#1b2b3a]/15">
                    <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Voucher No.</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Supplier</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Subtotal</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">GST</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Total</th>
                    <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v, i) => (
                    <tr
                      key={v.id}
                      className={`border-b border-[#1b2b3a]/10 hover:bg-[#112130]/5 transition-colors cursor-pointer ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                      onClick={() => setDetailVoucher(v)}
                    >
                      <td className="px-4 py-2.5 text-[#bc6c25] font-mono font-bold">
                        {v.voucherNumber}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 font-medium">
                        {v.voucherDate}
                      </td>
                      <td className="px-4 py-2.5 text-gray-800 font-bold">
                        {v.ledgerName}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 font-medium">
                        {formatCurrency(v.subtotal)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 font-medium">
                        {formatCurrency(v.gstAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-gray-800 text-[13px]">
                        {formatCurrency(v.totalAmount)}
                      </td>
                      <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDetailVoucher(v)}
                          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
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
            <DialogContent className="bg-tally-sidebar border-tally-border text-tally-text max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-tally-text flex items-center gap-2">
                  <FileText size={16} className="text-orange-400" />
                  {detailVoucher.voucherNumber} — Purchase Entry
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-tally-text-muted">Supplier:</span>
                    <p className="font-medium">{detailVoucher.ledgerName}</p>
                  </div>
                  <div>
                    <span className="text-tally-text-muted">Date:</span>
                    <p className="font-medium">{detailVoucher.voucherDate}</p>
                  </div>
                  <div>
                    <span className="text-tally-text-muted">Total:</span>
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
                          Item
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
