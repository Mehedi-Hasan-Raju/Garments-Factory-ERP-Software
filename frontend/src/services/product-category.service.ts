import { apiClient } from "@/lib/api-client";
import type {
  CreateProductCategoryInput,
  ProductCategory,
  ProductCategoryListResponse,
  ProductCategoryResponse,
  UpdateProductCategoryInput,
} from "@/types/product-category";

const BASE_URL = "/product-categories";

export const productCategoryService = {
  async getAll(): Promise<ProductCategory[]> {
    const response =
      await apiClient.get<ProductCategoryListResponse>(BASE_URL);

    return response.data.data;
  },

  async getById(id: string): Promise<ProductCategory> {
    const response =
      await apiClient.get<ProductCategoryResponse>(`${BASE_URL}/${id}`);

    return response.data.data;
  },

  async create(
    payload: CreateProductCategoryInput,
  ): Promise<ProductCategory> {
    const response =
      await apiClient.post<ProductCategoryResponse>(BASE_URL, payload);

    return response.data.data;
  },

  async update(
    id: string,
    payload: UpdateProductCategoryInput,
  ): Promise<ProductCategory> {
    const response = await apiClient.patch<ProductCategoryResponse>(
      `${BASE_URL}/${id}`,
      payload,
    );

    return response.data.data;
  },

  async delete(id: string): Promise<ProductCategory> {
    const response = await apiClient.delete<ProductCategoryResponse>(
      `${BASE_URL}/${id}`,
    );

    return response.data.data;
  },
};
