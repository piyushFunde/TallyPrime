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
  const [filterType, setFilterType] = useState<LedgerType | "ALL">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LedgerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchLedgers = useCallback(async () => {
    try {
      setLoading(true);
      const type = filterType === "ALL" ? undefined : filterType;
      const data = await ledgerApi.getAll(type, search || undefined);
      setLedgers(data);
    } catch {
      // Backend may not be running — show mock data hint
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

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

  const filteredLedgers = ledgers;

  return (
    <div className="min-h-full bg-gradient-to-br from-tally-dark via-[#1a2d40] to-tally-dark tally-fade-in">
      {/* Page Header */}
      <div className="border-b border-tally-border/50 bg-tally-header/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-tally-accent/10">
              <BookOpen size={20} className="text-tally-accent" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-tally-text">
                Ledger Management
              </h1>
              <p className="text-xs text-tally-text-muted">
                Manage your Customers & Suppliers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateDialog("CUSTOMER")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-tally-accent/20 text-tally-accent text-xs font-medium hover:bg-tally-accent/30 transition-colors"
            >
              <Users size={13} />
              <Plus size={13} />
              Customer
            </button>
            <button
              onClick={() => openCreateDialog("SUPPLIER")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-tally-highlight/20 text-tally-highlight text-xs font-medium hover:bg-tally-highlight/30 transition-colors"
            >
              <Building2 size={13} />
              <Plus size={13} />
              Supplier
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-tally-border/30 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-tally-text-muted/50"
          />
          <input
            type="text"
            placeholder="Search ledgers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tally-input w-full rounded-md text-xs"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <div className="flex items-center gap-1">
          {(["ALL", "CUSTOMER", "SUPPLIER"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterType === type
                  ? "bg-tally-accent/20 text-tally-accent"
                  : "text-tally-text-muted hover:bg-tally-sidebar-hover"
              }`}
            >
              {type === "ALL" ? "All" : type === "CUSTOMER" ? "Customers" : "Suppliers"}
            </button>
          ))}
        </div>
        <div className="text-xs text-tally-text-muted ml-auto">
          {filteredLedgers.length} record(s)
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="text-center py-12 text-tally-text-muted text-sm">
            Loading...
          </div>
        ) : filteredLedgers.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen
              size={40}
              className="mx-auto text-tally-text-muted/30 mb-3"
            />
            <p className="text-sm text-tally-text-muted mb-1">
              No ledgers found
            </p>
            <p className="text-xs text-tally-text-muted/50">
              Press <span className="shortcut-key">Alt+L</span> to create a new
              ledger
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-tally-border/30 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tally-header/40 border-b border-tally-border/30">
                  <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                    Type
                  </th>
                  <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                    GST No.
                  </th>
                  <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                    Mobile
                  </th>
                  <th className="text-left px-4 py-2.5 text-tally-text-muted font-semibold">
                    State
                  </th>
                  <th className="text-right px-4 py-2.5 text-tally-text-muted font-semibold">
                    Opening Bal.
                  </th>
                  <th className="text-right px-4 py-2.5 text-tally-text-muted font-semibold">
                    Current Bal.
                  </th>
                  <th className="text-center px-4 py-2.5 text-tally-text-muted font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgers.map((ledger, i) => (
                  <tr
                    key={ledger.id}
                    className={`border-b border-tally-border/20 hover:bg-tally-sidebar-hover/50 transition-colors cursor-pointer ${
                      i % 2 === 0 ? "bg-tally-dark/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 text-tally-text font-medium">
                      {ledger.name}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          ledger.type === "CUSTOMER"
                            ? "border-tally-accent/40 text-tally-accent"
                            : "border-tally-highlight/40 text-tally-highlight"
                        }`}
                      >
                        {ledger.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-tally-text-muted">
                      {ledger.gstNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-tally-text-muted">
                      {ledger.mobile || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-tally-text-muted">
                      {ledger.state || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-tally-text-muted">
                      {formatCurrency(ledger.openingBalance)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-tally-text">
                      {formatCurrency(ledger.currentBalance)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(ledger);
                          }}
                          className="p-1.5 rounded hover:bg-tally-accent/20 text-tally-text-muted hover:text-tally-accent transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(ledger.id, ledger.name);
                          }}
                          className="p-1.5 rounded hover:bg-red-500/20 text-tally-text-muted hover:text-red-400 transition-colors"
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
              <div className="flex gap-2">
                {(["CUSTOMER", "SUPPLIER"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, type })}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      form.type === type
                        ? type === "CUSTOMER"
                          ? "bg-tally-accent/20 text-tally-accent border border-tally-accent/40"
                          : "bg-tally-highlight/20 text-tally-highlight border border-tally-highlight/40"
                        : "bg-tally-dark/40 text-tally-text-muted border border-transparent"
                    }`}
                  >
                    {type === "CUSTOMER" ? "Customer" : "Supplier"}
                  </button>
                ))}
              </div>
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
