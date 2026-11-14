import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { unitService } from "@/services/unit.service";
import type {
  CreateUnitInput,
  UpdateUnitInput,
} from "@/types/unit";

export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  details: () => [...unitKeys.all, "detail"] as const,
  detail: (id: string) => [...unitKeys.details(), id] as const,
};


export function useUnits(enabled = true) {
  return useQuery({
    queryKey: unitKeys.lists(),
    queryFn: unitService.getAll,
    enabled,
  });
}


export function useUnit(id: string) {
  return useQuery({
    queryKey: unitKeys.detail(id),
    queryFn: () => unitService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnitInput) => unitService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUnitInput;
    }) => unitService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}

export function useDeactivateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unitService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
    },
  });
}
