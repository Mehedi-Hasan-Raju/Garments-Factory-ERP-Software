import { apiClient } from "@/lib/api-client";
import type {
  CreateUnitInput,
  UpdateUnitInput,
  Unit,
  UnitListResponse,
  UnitResponse,
} from "@/types/unit";

const BASE_URL = "/units";

export const unitService = {
  async getAll(): Promise<Unit[]> {
    const response = await apiClient.get<UnitListResponse>(BASE_URL);
    return response.data.data;
  },

  async getById(id: string): Promise<Unit> {
    const response = await apiClient.get<UnitResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  async create(data: CreateUnitInput): Promise<Unit> {
    const response = await apiClient.post<UnitResponse>(BASE_URL, data);
    return response.data.data;
  },

  async update(id: string, data: UpdateUnitInput): Promise<Unit> {
    const response = await apiClient.patch<UnitResponse>(
      `${BASE_URL}/${id}`,
      data,
    );
    return response.data.data;
  },

  async deactivate(id: string): Promise<Unit> {
    const response = await apiClient.delete<UnitResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  },
};
