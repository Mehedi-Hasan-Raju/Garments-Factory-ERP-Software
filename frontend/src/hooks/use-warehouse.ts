import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { warehouseService } from "@/services/warehouse.service";

import type {
  WarehouseQuery,
  LocationQuery,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateLocationInput,
  UpdateLocationInput,
} from "@/types/warehouse";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  list: (params: WarehouseQuery) =>
    [...warehouseKeys.all, "list", params] as const,
  detail: (id: string) =>
    [...warehouseKeys.all, "detail", id] as const,

  locations: ["warehouse-locations"] as const,
  locationList: (params: LocationQuery) =>
    [...warehouseKeys.locations, "list", params] as const,
  locationDetail: (id: string) =>
    [...warehouseKeys.locations, "detail", id] as const,
};

export function useWarehouses(params: WarehouseQuery = {}) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: () => warehouseService.getWarehouses(params),
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehouseService.getWarehouse(id),
    enabled: Boolean(id),
  });
}

export function useWarehouseLocations(params: LocationQuery = {}) {
  return useQuery({
    queryKey: warehouseKeys.locationList(params),
    queryFn: () => warehouseService.getLocations(params),
    enabled: Boolean(params.warehouseId),
  });
}

function useWarehouseMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: warehouseKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: warehouseKeys.locations,
        }),
      ]);
    },
  });
}

export function useCreateWarehouse() {
  return useWarehouseMutation((input: CreateWarehouseInput) =>
    warehouseService.createWarehouse(input),
  );
}

export function useUpdateWarehouse() {
  return useWarehouseMutation(
    ({ id, payload }: { id: string; payload: UpdateWarehouseInput }) =>
      warehouseService.updateWarehouse(id, payload),
  );
}

export function useUpdateWarehouseStatus() {
  return useWarehouseMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      warehouseService.updateWarehouseStatus(id, isActive),
  );
}

export function useDeleteWarehouse() {
  return useWarehouseMutation((id: string) =>
    warehouseService.deleteWarehouse(id),
  );
}

export function useCreateLocation() {
  return useWarehouseMutation((input: CreateLocationInput) =>
    warehouseService.createLocation(input),
  );
}

export function useUpdateLocation() {
  return useWarehouseMutation(
    ({ id, payload }: { id: string; payload: UpdateLocationInput }) =>
      warehouseService.updateLocation(id, payload),
  );
}

export function useDeleteLocation() {
  return useWarehouseMutation((id: string) =>
    warehouseService.deleteLocation(id),
  );
}
