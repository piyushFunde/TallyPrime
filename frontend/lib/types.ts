// ================================
// SmartERP TypeScript Interfaces
// ================================

export type LedgerType = "CUSTOMER" | "SUPPLIER" | "EXPENSE" | "INCOME" | "BANK" | "CASH";
export type VoucherType = "SALES" | "PURCHASE" | "PAYMENT" | "RECEIPT" | "JOURNAL" | "CONTRA" | "CREDIT_NOTE" | "DEBIT_NOTE";

export interface Ledger {
  id: number;
  name: string;
  type: LedgerType;
  gstNumber?: string;
  mobile?: string;
  email?: string;
  address?: string;
  state?: string;
  openingBalance: number;
  currentBalance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LedgerFormData {
  name: string;
  type: LedgerType;
  gstNumber?: string;
  mobile?: string;
  email?: string;
  address?: string;
  state?: string;
  openingBalance: number;
}

export interface StockItem {
  id: number;
  name: string;
  sku?: string;
  hsnCode?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number;
  currentStock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockItemFormData {
  name: string;
  sku?: string;
  hsnCode?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number;
  currentStock?: number;
}

export interface VoucherLineItem {
  id?: number;
  stockItemId: number;
  stockItemName?: string;
  quantity: number;
  rate: number;
  gstRate?: number;
  gstAmount?: number;
  amount?: number;
  total?: number;
}

export interface Voucher {
  id: number;
  voucherNumber: string;
  voucherType: VoucherType;
  ledgerId: number;
  ledgerName?: string;
  voucherDate: string;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
  notes?: string;
  lineItems: VoucherLineItem[];
  createdAt?: string;
}

export interface VoucherFormData {
  voucherType: VoucherType;
  ledgerId: number;
  voucherDate: string;
  notes?: string;
  lineItems: VoucherLineItem[];
}

// Navigation / Menu types
export interface MenuItem {
  label: string;
  shortcut?: string;
  path?: string;
  action?: () => void;
  children?: MenuItem[];
  icon?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

