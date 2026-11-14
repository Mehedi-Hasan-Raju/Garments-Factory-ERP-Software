import {apiClient} from "@/lib/api-client";

import type {
  StockListResponse,
  HistoryResponse,
  StockQuery,
  HistoryQuery,
  ReceiveStockInput,
  IssueStockInput,
  TransferStockInput,
  AdjustmentStockInput,
  CountStockInput,
  ProductOption,
  LocationOption,
  BatchOption,
} from "@/types/inventory";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const inventoryService = {
  async getStock(params: StockQuery) {
    const { data } = await apiClient.get<ApiResponse<StockListResponse>>(
      "/inventory/stock",
      { params },
    );

    return data.data;
  },

  async getLowStock() {
    const { data } = await apiClient.get<ApiResponse<any[]>>(
      "/inventory/low-stock",
    );

    return data.data;
  },

  async getHistory(params: HistoryQuery) {
    const { data } = await apiClient.get<ApiResponse<HistoryResponse>>(
      "/inventory/history",
      { params },
    );

    return data.data;
  },

  async getProducts() {
    const { data } = await apiClient.get<ApiResponse<{
      products: ProductOption[];
    }>>("/products", {
      params: { page: 1, limit: 100, isActive: true },
    });

    return data.data.products;
  },

  async getBinLocations() {
    const { data } = await apiClient.get<ApiResponse<LocationOption[]>>(
      "/warehouse-locations",
      {
        params: { page: 1, limit: 100, type: "BIN" },
      },
    );

    return data.data;
  },

  // async getBatches(productId: string) {
  //   const { data } = await apiClient.get<ApiResponse<BatchOption[]>>(
  //     `/products/${productId}`,
  //   );

  //   return data.data;
  // },

  async receive(payload: ReceiveStockInput) {
    const { data } = await apiClient.post(
      "/inventory/receive",
      payload,
    );

    return data;
  },

  async issue(payload: IssueStockInput) {
    const { data } = await apiClient.post(
      "/inventory/issue",
      payload,
    );

    return data;
  },

  async transfer(payload: TransferStockInput) {
    const { data } = await apiClient.post(
      "/inventory/transfer",
      payload,
    );

    return data;
  },

  async adjustment(payload: AdjustmentStockInput) {
    const { data } = await apiClient.post(
      "/inventory/adjustment",
      payload,
    );

    return data;
  },

  async count(payload: CountStockInput) {
    const { data } = await apiClient.post(
      "/inventory/count",
      payload,
    );

    return data;
  },
};
