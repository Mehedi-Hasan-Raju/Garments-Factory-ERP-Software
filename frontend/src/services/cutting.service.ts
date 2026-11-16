import { apiClient } from "@/lib/api-client";
import type {
  CuttingListResponse,
  CuttingResponse,
  CuttingQueryParams,
  CreateCuttingInput,
  UpdateCuttingInput,
  CuttingSummary,
} from "@/types/cutting";

export const cuttingService = {
  async getAll(params: CuttingQueryParams = {}) {
    const response = await apiClient.get<CuttingListResponse>("/cutting", {
      params,
    });

    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<CuttingResponse>(`/cutting/${id}`);

    return response.data;
  },

  async create(data: CreateCuttingInput) {
    const response = await apiClient.post<CuttingResponse>("/cutting", data);

    return response.data;
  },

  async update(id: string, data: UpdateCuttingInput) {
    const response = await apiClient.patch<CuttingResponse>(
      `/cutting/${id}`,
      data,
    );

    return response.data;
  },

  async getProductionOrderSummary(productionOrderId: string) {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: CuttingSummary;
    }>(`/cutting/production-order/${productionOrderId}/summary`);

    return response.data;
  },
};
