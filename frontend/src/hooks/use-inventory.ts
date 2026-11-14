
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { inventoryService } from "@/services/inventory.service";

import type {
  StockQuery,
  HistoryQuery,
  ReceiveStockInput,
  IssueStockInput,
  TransferStockInput,
  AdjustmentStockInput,
  CountStockInput,
} from "@/types/inventory";

export const inventoryKeys = {
  all: ["inventory"] as const,
  stock: (params: StockQuery) =>
    [...inventoryKeys.all, "stock", params] as const,
  lowStock: () => [...inventoryKeys.all, "low-stock"] as const,
  history: (params: HistoryQuery) =>
    [...inventoryKeys.all, "history", params] as const,
  products: () => [...inventoryKeys.all, "products"] as const,
  locations: () => [...inventoryKeys.all, "locations"] as const,
};

export function useInventoryStock(
  params: StockQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryKeys.stock(params),
    queryFn: () => inventoryService.getStock(params),
    enabled,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: inventoryService.getLowStock,
  });
}

export function useStockHistory(params: HistoryQuery) {
  return useQuery({
    queryKey: inventoryKeys.history(params),
    queryFn: () => inventoryService.getHistory(params),
  });
}

export function useInventoryProducts() {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: inventoryService.getProducts,
  });
}

export function useBinLocations() {
  return useQuery({
    queryKey: inventoryKeys.locations(),
    queryFn: inventoryService.getBinLocations,
  });
}

function useStockMutation<T>(
  mutationFn: (payload: T) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.all,
        }),
      ]);
    },
  });
}

export function useReceiveStock() {
  return useStockMutation<ReceiveStockInput>(
    inventoryService.receive,
  );
}

export function useIssueStock() {
  return useStockMutation<IssueStockInput>(
    inventoryService.issue,
  );
}

export function useTransferStock() {
  return useStockMutation<TransferStockInput>(
    inventoryService.transfer,
  );
}

export function useAdjustStock() {
  return useStockMutation<AdjustmentStockInput>(
    inventoryService.adjustment,
  );
}

export function useCountStock() {
  return useStockMutation<CountStockInput>(
    inventoryService.count,
  );
}
