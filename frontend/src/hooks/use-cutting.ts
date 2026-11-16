import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { cuttingService } from "@/services/cutting.service";
import type {
  CuttingQueryParams,
  CreateCuttingInput,
  UpdateCuttingInput,
} from "@/types/cutting";

export const cuttingKeys = {
  all: ["cutting"] as const,
  lists: () => [...cuttingKeys.all, "list"] as const,
  list: (params: CuttingQueryParams) =>
    [...cuttingKeys.lists(), params] as const,
  details: () => [...cuttingKeys.all, "detail"] as const,
  detail: (id: string) => [...cuttingKeys.details(), id] as const,
  summaries: () => [...cuttingKeys.all, "summary"] as const,
  summary: (productionOrderId: string) =>
    [...cuttingKeys.summaries(), productionOrderId] as const,
};

export function useCuttingEntries(params: CuttingQueryParams = {}) {
  return useQuery({
    queryKey: cuttingKeys.list(params),
    queryFn: () => cuttingService.getAll(params),
  });
}

export function useCuttingEntry(id: string) {
  return useQuery({
    queryKey: cuttingKeys.detail(id),
    queryFn: () => cuttingService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCuttingSummary(productionOrderId: string) {
  return useQuery({
    queryKey: cuttingKeys.summary(productionOrderId),
    queryFn: () =>
      cuttingService.getProductionOrderSummary(productionOrderId),
    enabled: Boolean(productionOrderId),
  });
}

export function useCreateCutting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCuttingInput) => cuttingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuttingKeys.all });
    },
  });
}

export function useUpdateCutting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCuttingInput;
    }) => cuttingService.update(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cuttingKeys.all });
    },
  });
}
