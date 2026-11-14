import { apiClient } from "@/lib/api-client";

import type {
  Warehouse,
  WarehouseLocation,
  WarehouseListResponse,
  LocationListResponse,
  WarehouseQuery,
  LocationQuery,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "@/types/warehouse";

export const warehouseService = {
  async getWarehouses(params: WarehouseQuery = {}) {
    const response = await apiClient.get("/warehouses", { params });

    return {
      warehouses: response.data.data as Warehouse[],
      pagination: response.data.pagination,
    } as WarehouseListResponse;
  },

  async getWarehouse(id: string) {
    const response = await apiClient.get(`/warehouses/${id}`);
    return response.data.data.warehouse as Warehouse;
  },

  async createWarehouse(payload: CreateWarehouseInput) {
    const response = await apiClient.post("/warehouses", payload);
    return response.data.data.warehouse as Warehouse;
  },

  async updateWarehouse(id: string, payload: UpdateWarehouseInput) {
    const response = await apiClient.patch(`/warehouses/${id}`, payload);
    return response.data.data.warehouse as Warehouse;
  },

  async updateWarehouseStatus(id: string, isActive: boolean) {
    const response = await apiClient.patch(`/warehouses/${id}/status`, {
      isActive,
    });
    return response.data.data.warehouse as Warehouse;
  },

  async deleteWarehouse(id: string) {
    await apiClient.delete(`/warehouses/${id}`);
  },

  async getLocations(params: LocationQuery = {}) {
    const response = await apiClient.get("/warehouse-locations", {
      params,
    });

    return {
      locations: response.data.data as WarehouseLocation[],
      pagination: response.data.pagination,
    } as LocationListResponse;
  },

  async getLocation(id: string) {
    const response = await apiClient.get(`/warehouse-locations/${id}`);
    return response.data.data.location as WarehouseLocation;
  },

  async createLocation(payload: CreateLocationInput) {
    const response = await apiClient.post(
      "/warehouse-locations",
      payload,
    );
    return response.data.data.location as WarehouseLocation;
  },

  async updateLocation(id: string, payload: UpdateLocationInput) {
    const response = await apiClient.patch(
      `/warehouse-locations/${id}`,
      payload,
    );
    return response.data.data.location as WarehouseLocation;
  },

  async deleteLocation(id: string) {
    await apiClient.delete(`/warehouse-locations/${id}`);
  },
};
