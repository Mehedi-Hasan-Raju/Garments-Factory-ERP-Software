import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { supplierService } from "@/services/supplier.service";
import type {
  CreateSupplierInput,
  SupplierListParams,
  UpdateSupplierInput,
} from "@/types/supplier";

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params: SupplierListParams) =>
    [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: string) =>
    [...supplierKeys.details(), id] as const,
};

export function useSuppliers(params: SupplierListParams = {}) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => supplierService.getAll(params),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierInput) =>
      supplierService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: supplierKeys.all,
      });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSupplierInput;
    }) => supplierService.update(id, data),

    onSuccess: async (supplier) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: supplierKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: supplierKeys.detail(supplier.id),
        }),
      ]);
    },
  });
}

export function useDeactivateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierService.deactivate(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: supplierKeys.all,
      });
    },
  });
}
