"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { stockItemApi } from "@/lib/api";
import type { StockItem, StockItemFormData } from "@/lib/types";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const emptyForm: StockItemFormData = {
  name: "",
  sku: "",
  hsnCode: "",
  unit: "PCS",
  purchasePrice: 0,
  sellingPrice: 0,
  gstRate: 0,
  currentStock: 0,
};

const UNITS = ["PCS", "BOX", "KG", "LTR", "MTR", "NOS", "SET", "PAIR"];

export default function StockItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StockItemFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stockItemApi.getAll(search || undefined);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useKeyboardShortcuts({
    "alt+s": () => openCreateDialog(),
    "alt+n": () => openCreateDialog(),
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

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: StockItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      sku: item.sku || "",
      hsnCode: item.hsnCode || "",
      unit: item.unit,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      gstRate: item.gstRate,
      currentStock: item.currentStock,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (form.purchasePrice <= 0) {
      toast.error("Purchase price must be greater than 0");
      return;
    }
    if (form.sellingPrice <= 0) {
      toast.error("Selling price must be greater than 0");
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await stockItemApi.update(editingId, form);
        toast.success("Stock item updated successfully");
      } else {
        await stockItemApi.create(form);
        toast.success("Stock item created successfully");
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(
        error.response?.data?.message || "Failed to save stock item"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete stock item "${name}"? This cannot be undone.`)) return;
    try {
      await stockItemApi.delete(id);
      toast.success("Stock item deleted");
      fetchItems();
    } catch {
      toast.error("Failed to delete stock item");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-full bg-[#f3ede2] text-[#112130] tally-fade-in font-mono">
      {/* Page Header */}
      <div className="border-b border-[#1b2b3a]/15 bg-white/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-600">
              <Package size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#112130] leading-none font-sans">
                Stock Item Management
              </h1>
              <p className="text-xs text-gray-500 mt-1.5 font-sans">
                Manage your inventory & products
              </p>
            </div>
          </div>
          <button
            onClick={openCreateDialog}
            className="px-4 py-1.5 rounded bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold cursor-pointer transition-all shadow-md"
          >
            + New Item <span className="text-[10px] opacity-80 font-normal ml-0.5">Alt+S</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-3 border-b border-[#1b2b3a]/10 bg-white/10 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search stock items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#1b2b3a]/25 rounded-md px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#e68a00]"
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <div className="text-[11px] text-gray-500 font-bold ml-auto">
          {items.length} item(s)
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-xs">
            Loading stock items...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#1b2b3a]/15 rounded-md p-8 shadow-sm max-w-5xl mx-auto">
            <Package
              size={48}
              className="mx-auto text-gray-400/40 mb-4"
              strokeWidth={1}
            />
            <h3 className="text-base font-bold text-gray-700 mb-1">
              No stock items yet
            </h3>
            <p className="text-xs text-gray-400 font-sans">
              This is where inventory will live. Press <span className="shortcut-key font-bold text-[#e68a00] bg-[#e68a00]/10 px-1 py-0.5 rounded font-mono">Alt+S</span> to add your first item.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#1b2b3a]/15 shadow-sm bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#112130]/5 border-b border-[#1b2b3a]/15">
                  <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Item Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">SKU</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">HSN Code</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Unit</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Purchase Price</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Selling Price</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">GST %</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-bold uppercase tracking-wider">Stock</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-bold uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`border-b border-[#1b2b3a]/10 hover:bg-[#112130]/5 transition-colors cursor-pointer ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-gray-800 font-bold text-[13px]">{item.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-[10px] uppercase">{item.sku || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500 font-sans text-[11px]">{item.hsnCode || "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded">
                        {item.unit}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-600 font-medium">
                      {formatCurrency(item.purchasePrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-800 font-bold">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-500 font-semibold">{item.gstRate}%</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-black text-[13px] ${
                        item.currentStock <= 0
                          ? "text-red-500"
                          : item.currentStock < 10
                          ? "text-[#e68a00]"
                          : "text-emerald-600"
                      }`}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditDialog(item)}
                          className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
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
                  <Edit2 size={16} className="text-green-400" />
                  Alter Stock Item
                </>
              ) : (
                <>
                  <Plus size={16} className="text-green-400" />
                  Create Stock Item
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
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
                placeholder="Enter item name"
                autoFocus
              />
            </div>

            {/* SKU */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                SKU :
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="tally-input flex-1 rounded-md"
                placeholder="e.g. ITEM-001"
              />
            </div>

            {/* HSN Code */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                HSN Code :
              </label>
              <input
                type="text"
                value={form.hsnCode}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                className="tally-input flex-1 rounded-md"
                placeholder="e.g. 8471"
                maxLength={10}
              />
            </div>

            {/* Unit */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Unit :
              </label>
              <div className="flex gap-1 flex-wrap">
                {UNITS.map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setForm({ ...form, unit })}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      form.unit === unit
                        ? "bg-tally-accent/20 text-tally-accent border border-tally-accent/40"
                        : "bg-tally-dark/40 text-tally-text-muted border border-transparent hover:border-tally-border/30"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Price */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Purchase ₹ :
              </label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchasePrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="tally-input flex-1 rounded-md"
                step="0.01"
                min="0"
              />
            </div>

            {/* Selling Price */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                Selling ₹ :
              </label>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="tally-input flex-1 rounded-md"
                step="0.01"
                min="0"
              />
            </div>

            {/* GST Rate */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-tally-text-muted w-28 shrink-0">
                GST Rate % :
              </label>
              <div className="flex gap-1">
                {[0, 5, 12, 18, 28].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setForm({ ...form, gstRate: rate })}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                      form.gstRate === rate
                        ? "bg-tally-highlight/20 text-tally-highlight border border-tally-highlight/40"
                        : "bg-tally-dark/40 text-tally-text-muted border border-transparent hover:border-tally-border/30"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* Opening Stock (only for new items) */}
            {!editingId && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-tally-text-muted w-28 shrink-0">
                  Opening Stock :
                </label>
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      currentStock: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="tally-input flex-1 rounded-md"
                  step="1"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-tally-border/30">
            <button
              onClick={() => setDialogOpen(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs text-tally-text-muted hover:bg-tally-dark/40 transition-colors"
            >
              <X size={13} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
