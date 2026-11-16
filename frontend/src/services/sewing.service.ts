import { apiClient } from "@/lib/api-client";
import type {
  SewingListResponse,
  SewingResponse,
  SewingQueryParams,
  CreateSewingInput,
  UpdateSewingInput,
} from "@/types/sewing";
import type { SewingSummaryResponse } from "@/types/sewing";


export const sewingService = {
  async getAll(params: SewingQueryParams = {}) {
    const response = await apiClient.get<SewingListResponse>("/sewing", {
      params,
    });

    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<SewingResponse>(`/sewing/${id}`);

    return response.data;
  },

  async create(data: CreateSewingInput) {
    const response = await apiClient.post<SewingResponse>("/sewing", data);

    return response.data;
  },

  async update(id: string, data: UpdateSewingInput) {
    const response = await apiClient.patch<SewingResponse>(
      `/sewing/${id}`,
      data,
    );

    return response.data;
  },

  async getProductionOrderSummary(productionOrderId: string) {
  const response = await apiClient.get<SewingSummaryResponse>(
    `/sewing/production-order/${productionOrderId}/summary`,
  );

  return response.data;
},
};
