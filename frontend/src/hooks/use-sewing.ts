import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { sewingService } from "@/services/sewing.service";
import type {
  SewingQueryParams,
  CreateSewingInput,
  UpdateSewingInput,
} from "@/types/sewing";

export const sewingKeys = {
  all: ["sewing"] as const,
  lists: () => [...sewingKeys.all, "list"] as const,
  list: (params: SewingQueryParams) =>
    [...sewingKeys.lists(), params] as const,
  details: () => [...sewingKeys.all, "detail"] as const,
  detail: (id: string) => [...sewingKeys.details(), id] as const,
  summaries: () => [...sewingKeys.all, "summary"] as const,
  summary: (productionOrderId: string) =>
    [...sewingKeys.summaries(), productionOrderId] as const,
};

export function useSewingEntries(params: SewingQueryParams = {}) {
  return useQuery({
    queryKey: sewingKeys.list(params),
    queryFn: () => sewingService.getAll(params),
  });
}

export function useSewingEntry(id: string) {
  return useQuery({
    queryKey: sewingKeys.detail(id),
    queryFn: () => sewingService.getById(id),
    enabled: Boolean(id),
  });
}

export function useSewingSummary(productionOrderId: string) {
  return useQuery({
    queryKey: sewingKeys.summary(productionOrderId),
    queryFn: () =>
      sewingService.getProductionOrderSummary(productionOrderId),
    enabled: Boolean(productionOrderId),
  });
}

export function useCreateSewing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSewingInput) => sewingService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sewingKeys.all });
    },
  });
}

export function useUpdateSewing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSewingInput;
    }) => sewingService.update(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sewingKeys.all });
    },
  });
}
