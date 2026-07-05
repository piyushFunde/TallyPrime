import axios from "axios";
import type {
  Ledger,
  LedgerFormData,
  LedgerType,
  StockItem,
  StockItemFormData,
  Voucher,
  VoucherFormData,
  VoucherType,
  User,
  AuthResponse,
  Company,
  CompanyFormData,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("tally_auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// Ledger API
// ================================

export const ledgerApi = {
  getAll: async (type?: LedgerType, search?: string): Promise<Ledger[]> => {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (search) params.search = search;
    const res = await api.get("/ledgers", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Ledger> => {
    const res = await api.get(`/ledgers/${id}`);
    return res.data;
  },

  create: async (data: LedgerFormData): Promise<Ledger> => {
    const res = await api.post("/ledgers", data);
    return res.data;
  },

  update: async (id: number, data: LedgerFormData): Promise<Ledger> => {
    const res = await api.put(`/ledgers/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ledgers/${id}`);
  },
};

// ================================
// Stock Item API
// ================================

export const stockItemApi = {
  getAll: async (search?: string): Promise<StockItem[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    const res = await api.get("/stock-items", { params });
    return res.data;
  },

  getById: async (id: number): Promise<StockItem> => {
    const res = await api.get(`/stock-items/${id}`);
    return res.data;
  },

  create: async (data: StockItemFormData): Promise<StockItem> => {
    const res = await api.post("/stock-items", data);
    return res.data;
  },

  update: async (id: number, data: StockItemFormData): Promise<StockItem> => {
    const res = await api.put(`/stock-items/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/stock-items/${id}`);
  },
};

// ================================
// Voucher API
// ================================

export const voucherApi = {
  getAll: async (type?: VoucherType): Promise<Voucher[]> => {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    const res = await api.get("/vouchers", { params });
    return res.data;
  },

  getById: async (id: number): Promise<Voucher> => {
    const res = await api.get(`/vouchers/${id}`);
    return res.data;
  },

  create: async (data: VoucherFormData): Promise<Voucher> => {
    const res = await api.post("/vouchers", data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vouchers/${id}`);
  },
};

// ================================
// Auth API
// ================================

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string): Promise<User> => {
    const res = await api.post<User>("/auth/register", { name, email, password });
    return res.data;
  },
};

// ================================
// Company API
// ================================

export const companyApi = {
  getAll: async (): Promise<Company[]> => {
    const res = await api.get("/companies");
    return res.data;
  },

  getById: async (id: number): Promise<Company> => {
    const res = await api.get(`/companies/${id}`);
    return res.data;
  },

  create: async (data: CompanyFormData): Promise<Company> => {
    const res = await api.post("/companies", data);
    return res.data;
  },

  update: async (id: number, data: CompanyFormData): Promise<Company> => {
    const res = await api.put(`/companies/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },
};

export default api;
