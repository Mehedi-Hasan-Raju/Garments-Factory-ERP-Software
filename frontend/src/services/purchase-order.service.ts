import { apiClient } from "@/lib/api-client";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  PurchaseOrderListParams,
  PurchaseOrderListData,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "@/types/purchase-order";

const BASE_URL = "/purchase-orders";

interface ListResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder[];
  pagination: PurchaseOrderListData["pagination"];
}

interface SingleResponse {
  success: boolean;
  message: string;
  data: PurchaseOrder;
}

export const purchaseOrderService = {
  async getAll(params: PurchaseOrderListParams = {}) {
    const response = await apiClient.get<ListResponse>(BASE_URL, {
      params,
    });

    return {
      purchaseOrders: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getById(id: string) {
    const response = await apiClient.get<SingleResponse>(
      `${BASE_URL}/${id}`,
    );

    return response.data.data;
  },

  async create(data: CreatePurchaseOrderInput) {
    const response = await apiClient.post<SingleResponse>(
      BASE_URL,
      data,
    );

    return response.data.data;
  },

  async update(id: string, data: UpdatePurchaseOrderInput) {
    const response = await apiClient.patch<SingleResponse>(
      `${BASE_URL}/${id}`,
      data,
    );

    return response.data.data;
  },

  async submit(id: string) {
    const response = await apiClient.patch<SingleResponse>(
      `${BASE_URL}/${id}/submit`,
    );

    return response.data.data;
  },

  async approve(id: string) {
    const response = await apiClient.patch<SingleResponse>(
      `${BASE_URL}/${id}/approve`,
    );

    return response.data.data;
  },

  async cancel(id: string) {
    const response = await apiClient.patch<SingleResponse>(
      `${BASE_URL}/${id}/cancel`,
    );

    return response.data.data;
  },

  async receive(id: string, data: ReceivePurchaseOrderInput) {
    const response = await apiClient.post<SingleResponse>(
      `${BASE_URL}/${id}/receive`,
      data,
    );

    return response.data.data;
  },
};
