"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { productionOrderService } from "@/services/production-order.service";

import type {
  ProductionOrderQuery,
  ProductionOrderPayload,
  ProductionProgressPayload,
  ProductionStatus,
} from "@/types/production-order";

export const PRODUCTION_ORDER_KEY = ["production-orders"];

export function useProductionOrders(query: ProductionOrderQuery) {
  return useQuery({
    queryKey: [...PRODUCTION_ORDER_KEY, query],
    queryFn: () => productionOrderService.getAll(query),
    staleTime: 30 * 1000,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

export function useProductionOrder(id: string | null) {
  return useQuery({
    queryKey: [...PRODUCTION_ORDER_KEY, "details", id],
    queryFn: () => productionOrderService.getById(id!),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useProductionReferences() {
  return useQuery({
    queryKey: [...PRODUCTION_ORDER_KEY, "references"],
    queryFn: async () => {
      const [buyingHouses, buyers, products] = await Promise.all([
        productionOrderService.getBuyingHouses(),
        productionOrderService.getBuyers(),
        productionOrderService.getProducts(),
      ]);

      return { buyingHouses, buyers, products };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductionOrderPayload) =>
      productionOrderService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_ORDER_KEY,
      });
    },
  });
}

export function useUpdateProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProductionOrderPayload>;
    }) => productionOrderService.update(id, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_ORDER_KEY,
      });

      queryClient.invalidateQueries({
        queryKey: [...PRODUCTION_ORDER_KEY, "details", variables.id],
      });
    },
  });
}

export function useUpdateProductionProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ProductionProgressPayload;
    }) => productionOrderService.updateProgress(id, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_ORDER_KEY,
      });

      queryClient.invalidateQueries({
        queryKey: [...PRODUCTION_ORDER_KEY, "details", variables.id],
      });
    },
  });
}

export function useUpdateProductionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ProductionStatus;
    }) => productionOrderService.updateStatus(id, status),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_ORDER_KEY,
      });

      queryClient.invalidateQueries({
        queryKey: [...PRODUCTION_ORDER_KEY, "details", variables.id],
      });
    },
  });
}