import { apiClient } from "@/lib/api-client";
import { Trash2 } from "lucide-react";
import { usePermanentDeleteProduct } from "@/hooks/use-products";
import type {
  CreateProductInput,
  Product,
  ProductListData,
  ProductListParams,
  ProductListResponse,
  ProductResponse,
  UpdateProductInput,
} from "@/types/product";


const BASE_URL = "/products";

export const productService = {
  async getAll(params: ProductListParams): Promise<ProductListData> {
    const response = await apiClient.get<ProductListResponse>(BASE_URL, {
      params,
    });

    return response.data.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ProductResponse>(
      `${BASE_URL}/${id}`,
    );

    return response.data.data;
  },

  async create(data: CreateProductInput): Promise<Product> {
    const response = await apiClient.post<ProductResponse>(BASE_URL, data);

    return response.data.data;
  },

  async update(id: string, data: UpdateProductInput): Promise<Product> {
    const response = await apiClient.patch<ProductResponse>(
      `${BASE_URL}/${id}`,
      data,
    );

    return response.data.data;
  },

  async deactivate(id: string): Promise<Product> {
    const response = await apiClient.delete<ProductResponse>(
      `${BASE_URL}/${id}`,
    );

    return response.data.data;
  },

  async permanentDelete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}/permanent`);
  },
};
