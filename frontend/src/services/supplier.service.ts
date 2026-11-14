import { apiClient } from "@/lib/api-client";
import type {
  CreateSupplierInput,
  Supplier,
  SupplierListParams,
  SupplierListResponse,
  SupplierResponse,
  UpdateSupplierInput,
} from "@/types/supplier";

const BASE_URL = "/suppliers";

export const supplierService = {
  async getAll(params: SupplierListParams = {}) {
    const response = await apiClient.get<SupplierListResponse>(
      BASE_URL,
      { params },
    );

    return {
      suppliers: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getById(id: string): Promise<Supplier> {
    const response = await apiClient.get<SupplierResponse>(
      `${BASE_URL}/${id}`,
    );

    return response.data.data;
  },

  async create(data: CreateSupplierInput): Promise<Supplier> {
    const response = await apiClient.post<SupplierResponse>(
      BASE_URL,
      data,
    );

    return response.data.data;
  },

  async update(
    id: string,
    data: UpdateSupplierInput,
  ): Promise<Supplier> {
    const response = await apiClient.patch<SupplierResponse>(
      `${BASE_URL}/${id}`,
      data,
    );

    return response.data.data;
  },

  async deactivate(id: string): Promise<Supplier> {
    const response = await apiClient.delete<SupplierResponse>(
      `${BASE_URL}/${id}`,
    );

    return response.data.data;
  },
};
