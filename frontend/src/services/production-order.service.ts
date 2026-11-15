import { apiClient } from "@/lib/api-client";

import type {
  ProductionOrder,
  ProductionOrderQuery,
  ProductionOrderPayload,
  ProductionProgressPayload,
  ProductionStatus,
  ProductionOrderListResponse,
  ProductionOrderResponse,
  BuyingHouseOption,
  BuyerOption,
  ProductOption,
} from "@/types/production-order";

export const productionOrderService = {
  async getAll(query: ProductionOrderQuery) {
    const response =
      await apiClient.get<ProductionOrderListResponse>(
        "/production-orders",
        { params: query },
      );

    return response.data;
  },

  async getById(id: string): Promise<ProductionOrder> {
    const response =
      await apiClient.get<ProductionOrderResponse>(
        `/production-orders/${id}`,
      );

    return response.data.data;
  },

  async create(payload: ProductionOrderPayload) {
    const response =
      await apiClient.post<ProductionOrderResponse>(
        "/production-orders",
        payload,
      );

    return response.data.data;
  },

  async update(id: string, payload: Partial<ProductionOrderPayload>) {
    const response =
      await apiClient.patch<ProductionOrderResponse>(
        `/production-orders/${id}`,
        payload,
      );

    return response.data.data;
  },

  async updateProgress(
    id: string,
    payload: ProductionProgressPayload,
  ) {
    const response =
      await apiClient.patch<ProductionOrderResponse>(
        `/production-orders/${id}/progress`,
        payload,
      );

    return response.data.data;
  },

  async updateStatus(id: string, status: ProductionStatus) {
    const response =
      await apiClient.patch<ProductionOrderResponse>(
        `/production-orders/${id}/status`,
        { status },
      );

    return response.data.data;
  },

  async getBuyingHouses(): Promise<BuyingHouseOption[]> {
    const response = await apiClient.get("/buying-houses", {
      params: { page: 1, limit: 100, isActive: "true" },
    });

    return response.data.data;
  },

  async getBuyers(buyingHouseId?: string): Promise<BuyerOption[]> {
    const response = await apiClient.get("/buyers", {
      params: {
        page: 1,
        limit: 100,
        isActive: "true",
        ...(buyingHouseId && { buyingHouseId }),
      },
    });

    return response.data.data;
  },

  async getProducts(): Promise<ProductOption[]> {
    const response = await apiClient.get("/products", {
      params: {
        page: 1,
        limit: 100,
        isActive: "true",
      },
    });

    return response.data.data.products;
  },
};