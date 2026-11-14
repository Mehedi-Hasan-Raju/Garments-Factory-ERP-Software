
export const SUPPLIER_TYPES = [
  "MANUFACTURER",
  "DISTRIBUTOR",
  "WHOLESALER",
  "TRADER",
  "OTHER",
] as const;

export const RAW_MATERIAL_TYPES = [
  "FABRIC",
  "ACCESSORIES",
  "THREAD",
  "BUTTON",
  "ZIPPER",
  "LABEL",
  "PACKAGING",
  "OTHER",
] as const;

export type SupplierType = (typeof SUPPLIER_TYPES)[number];
export type RawMaterialType = (typeof RAW_MATERIAL_TYPES)[number];

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  companyName: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  supplierType: SupplierType;
  rawMaterialTypes: RawMaterialType[];
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  supplierCode: string;
  supplierName: string;
  companyName: string;
  contactPerson?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  supplierType: SupplierType;
  rawMaterialTypes: RawMaterialType[];
  notes?: string | null;
}

export interface UpdateSupplierInput {
  supplierCode?: string;
  supplierName?: string;
  companyName?: string;
  contactPerson?: string | null;
  phone?: string;
  email?: string | null;
  address?: string | null;
  supplierType?: SupplierType;
  rawMaterialTypes?: RawMaterialType[];
  notes?: string | null;
  isActive?: boolean;
}

export interface SupplierListParams {
  search?: string;
  supplierType?: SupplierType;
  rawMaterialType?: RawMaterialType;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "supplierName" | "companyName" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface SupplierPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SupplierListResponse {
  success: boolean;
  message: string;
  data: Supplier[];
  pagination: SupplierPagination;
}

export interface SupplierResponse {
  success: boolean;
  message: string;
  data: Supplier;
}
