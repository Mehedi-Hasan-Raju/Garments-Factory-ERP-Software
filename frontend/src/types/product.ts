export interface ProductCategoryRef {
  id: string;
  name: string;
  code: string;
}

export interface ProductUnitRef {
  id: string;
  name: string;
  code: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  categoryId: string;
  unitId: string;
  category: ProductCategoryRef;
  unit: ProductUnitRef;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductListData {
  products: Product[];
  pagination: ProductPagination;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: ProductListData;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string | null;
  categoryId: string;
  unitId: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string | null;
  categoryId?: string;
  unitId?: string;
  isActive?: boolean;
}

export interface ProductListParams {
  search?: string;
  categoryId?: string;
  unitId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "sku" | "createdAt";
  sortOrder?: "asc" | "desc";
}
