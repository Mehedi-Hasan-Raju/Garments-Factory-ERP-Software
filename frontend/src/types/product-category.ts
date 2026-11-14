export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CreateProductCategoryInput {
  name: string;
  code: string;
  description?: string | null;
}

export interface UpdateProductCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ProductCategoryResponse {
  success: boolean;
  message: string;
  data: ProductCategory;
}

export interface ProductCategoryListResponse {
  success: boolean;
  message: string;
  data: ProductCategory[];
}
