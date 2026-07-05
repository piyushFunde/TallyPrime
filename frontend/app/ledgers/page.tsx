"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ledgerApi } from "@/lib/api";
import type { Ledger, LedgerType, LedgerFormData } from "@/lib/types";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Building2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const emptyForm: LedgerFormData = {
  name: "",
  type: "CUSTOMER",
  gstNumber: "",
  mobile: "",
  email: "",
  address: "",
  state: "",
  openingBalance: 0,
};

export default function LedgersPage() {
  const router = useRouter();
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<LedgerType | "ALL" | "BANK_CASH" | "INCOME_EXPENSE">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LedgerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchLedgers = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all ledgers without passing type so we can filter locally on frontend tabs
      const data = await ledgerApi.getAll(undefined, search || undefined);
      setLedgers(data);
    } catch {
      // Backend may not be running — show mock data hint
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  useKeyboardShortcuts({
    "alt+l": () => openCreateDialog("CUSTOMER"),
    "alt+n": () => openCreateDialog("CUSTOMER"),
    escape: () => {
      if (dialogOpen) {
        setDialogOpen(false);
      } else {
        router.push("/");
      }
    },
    f8: () => router.push("/vouchers/sales"),
    f9: () => router.push("/vouchers/purchase"),
  });

  const openCreateDialog = (type: LedgerType = "CUSTOMER") => {
    setEditingId(null);
    setForm({ ...emptyForm, type });
    setDialogOpen(true);
  };

  const openEditDialog = (ledger: Ledger) => {
    setEditingId(ledger.id);
    setForm({
      name: ledger.name,
      type: ledger.type,
      gstNumber: ledger.gstNumber || "",
      mobile: ledger.mobile || "",
      email: ledger.email || "",
      address: ledger.address || "",
      state: ledger.state || "",
      openingBalance: ledger.openingBalance,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Ledger name is required");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await ledgerApi.update(editingId, form);
        toast.success("Ledger updated successfully");
      } else {
        await ledgerApi.create(form);
        toast.success("Ledger created successfully");
      }
      setDialogOpen(false);
      fetchLedgers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to save ledger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete ledger "${name}"? This cannot be undone.`)) return;
    try {
      await ledgerApi.delete(id);
      toast.success("Ledger deleted");
      fetchLedgers();
    } catch {
      toast.error("Failed to delete ledger");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const filteredLedgers = ledgers.filter((ledger) => {
    if (filterType === "ALL") return true;
    if (filterType === "CUSTOMER") return ledger.type === "CUSTOMER";
    if (filterType === "SUPPLIER") return ledger.type === "SUPPLIER";
    if (filterType === "BANK_CASH") return ledger.type === "BANK" || ledger.type === "CASH";
    if (filterType === "INCOME_EXPENSE") return ledger.type === "INCOME" || ledger.type === "EXPENSE";
    return true;
  });

  return (
    <div className="min-h-full bg-[#f3ede2] text-[#112130] tally-fade-in font-mono">
      {/* Page Header */}
      <div className="border-b border-[#1b2b3a]/15 bg-white/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#135066]/10 text-[#135066]">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#112130] leading-none font-sans">
                Ledger Management
              </h1>
              <p className="text-xs text-gray-500 mt-1.5 font-sans">
                Manage your customers, suppliers & accounts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick add buttons from second screenshot */}
            <button
              onClick={() => openCreateDialog("SUPPLIER")}
              className="px-4 py-1.5 rounded border border-[#1b2b3a]/30 text-xs font-bold text-[#112130] hover:bg-black/5 cursor-pointer transition-colors shadow-sm"
            >
              + Supplier
            </button>
            <button
              onClick={() => openCreateDialog("CUSTOMER")}
              className="px-4 py-1.5 rounded bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              + New Ledger <span className="text-[10px] opacity-80 font-normal ml-0.5">Alt+L</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="px-6 py-3 border-b border-[#1b2b3a]/10 bg-white/10 flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search ledgers by name, GSTIN, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#1b2b3a]/25 rounded-md px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#e68a00]"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>

        {/* Tab pills container */}
        <div className="flex items-center gap-0.5 border border-[#1b2b3a]/25 bg-white/60 p-0.5 rounded-md">
          {([
            { id: "ALL", label: "All" },
            { id: "CUSTOMER", label: "Customers" },
            { id: "SUPPLIER", label: "Suppliers" },
            { id: "BANK_CASH", label: "Bank & Cash" },
            { id: "INCOME_EXPENSE", label: "Income & Expense" }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                filterType === tab.id
                  ? "bg-[#112130] text-white"
                  : "text-[#8fa4b5] hover:text-[#112130]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-gray-500 font-bold shrink-0">
          {filteredLedgers.length} record(s)
        </div>
      </div>

      {/* Table Section */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            Loading ledgers...
          </div>
        ) : filteredLedgers.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#1b2b3a]/15 rounded-md p-6">
            <BookOpen size={40} className="mx-auto text-gray-400/40 mb-3" />
            <p className="text-sm text-gray-500 font-bold mb-1">No ledgers found</p>
            <p className="text-xs text-gray-400">Press <span className="shortcut-key">Alt+L</span> to add a new ledger.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#1b2b3a]/15 shadow-sm bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#112130]/5 border-b border-[#1b2b3a]/15">
                  <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">LEDGER</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">TYPE</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">STATE</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">OPENING BALANCE</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">CURRENT BALANCE</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-24">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgers.map((ledger, i) => (
                  <tr
                    key={ledger.id}
                    className={`border-b border-[#1b2b3a]/10 hover:bg-[#112130]/5 transition-colors cursor-pointer ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-gray-800 text-[13px]">{ledger.name}</div>
                      {ledger.gstNumber && (
                        <div className="text-[10px] text-gray-400 mt-0.5 font-sans uppercase">
                          GSTIN {ledger.gstNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          ledger.type === "CUSTOMER"
                            ? "border-[#135066]/30 text-[#135066] bg-[#135066]/5"
                            : ledger.type === "SUPPLIER"
                            ? "border-[#bc6c25]/30 text-[#bc6c25] bg-[#bc6c25]/5"
                            : ledger.type === "BANK"
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                            : ledger.type === "CASH"
                            ? "border-teal-500/30 text-teal-600 bg-teal-500/5"
                            : ledger.type === "EXPENSE"
                            ? "border-rose-500/30 text-rose-600 bg-rose-500/5"
                            : "border-blue-500/30 text-blue-600 bg-blue-500/5"
                        }`}
                      >
                        {ledger.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      {ledger.state || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500 font-medium">
                      {formatCurrency(ledger.openingBalance)}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-black text-[13px] ${
                      ledger.currentBalance < 0 ? "text-[#e68a00]" : "text-emerald-600"
                    }`}>
                      {formatCurrency(ledger.currentBalance)}
                    </td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditDialog(ledger)}
                          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(ledger.id, ledger.name)}
                          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-tally-sidebar border-tally-border text-tally-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-tally-text flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 size={16} className="text-tally-accent" />
                  Alter Ledger
                </>
              ) : (
                <>
                  <Plus size={16} className="text-tally-accent" />
                  Create Ledger
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Ledger Type */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Type :
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as LedgerType })}
                className="tally-input flex-1 rounded-md text-xs py-1.5 focus:outline-none bg-[#1e3a4f] border border-[#2a5470] text-[#e8e0d4] font-bold"
              >
                <option value="CUSTOMER">Customer (Sundry Debtor)</option>
                <option value="SUPPLIER">Supplier (Sundry Creditor)</option>
                <option value="BANK">Bank Account</option>
                <option value="CASH">Cash in Hand</option>
                <option value="EXPENSE">Expense (Direct/Indirect)</option>
                <option value="INCOME">Income (Direct/Indirect)</option>
              </select>
            </div>

            {/* Name */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Name :
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="tally-input flex-1 rounded-md"
                placeholder="Enter ledger name"
                autoFocus
              />
            </div>

            {/* GST Number */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                GST Number :
              </label>
              <input
                type="text"
                value={form.gstNumber}
                onChange={(e) =>
                  setForm({ ...form, gstNumber: e.target.value })
                }
                className="tally-input flex-1 rounded-md"
                placeholder="e.g. 27AABCU9603R1ZV"
                maxLength={15}
              />
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Mobile :
              </label>
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="tally-input flex-1 rounded-md"
                placeholder="+91 "
                maxLength={15}
              />
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Email :
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="tally-input flex-1 rounded-md"
                placeholder="email@example.com"
              />
            </div>

            {/* Address */}
            <div className="flex items-start gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0 pt-2">
                Address :
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="tally-input flex-1 rounded-md resize-none"
                rows={2}
                placeholder="Enter address"
              />
            </div>

            {/* State */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                State :
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="tally-input flex-1 rounded-md"
                placeholder="e.g. Maharashtra"
              />
            </div>

            {/* Opening Balance */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Opening Bal. :
              </label>
              <input
                type="number"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({
                    ...form,
                    openingBalance: parseFloat(e.target.value) || 0,
                  })
                }
                onFocus={(e) => e.target.select()}
                className="tally-input flex-1 rounded-md"
                step="0.01"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-tally-border/30">
            <button
              onClick={() => setDialogOpen(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs text-tally-text-muted hover:bg-tally-dark/40 transition-colors"
            >
              <X size={13} />
              Cancel
              <span className="shortcut-key ml-1">Esc</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-tally-accent/20 text-tally-accent hover:bg-tally-accent/30 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
              <span className="shortcut-key ml-1">Ctrl+S</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
