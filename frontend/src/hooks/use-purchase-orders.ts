import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { purchaseOrderService } from "@/services/purchase-order.service";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderListParams,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "@/types/purchase-order";

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (params: PurchaseOrderListParams) =>
    [...purchaseOrderKeys.lists(), params] as const,
  details: () => [...purchaseOrderKeys.all, "detail"] as const,
  detail: (id: string) =>
    [...purchaseOrderKeys.details(), id] as const,
};

export function usePurchaseOrders(params: PurchaseOrderListParams = {}) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => purchaseOrderService.getAll(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => purchaseOrderService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderInput) =>
      purchaseOrderService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.all,
      });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePurchaseOrderInput;
    }) => purchaseOrderService.update(id, data),

    onSuccess: async (po) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: purchaseOrderKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: purchaseOrderKeys.detail(po.id),
        }),
      ]);
    },
  });
}

function createActionMutation(
  action: (id: string) => Promise<unknown>,
) {
  return function useAction() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: action,
      onSuccess: async (_data, id) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: purchaseOrderKeys.all,
          }),
          queryClient.invalidateQueries({
            queryKey: purchaseOrderKeys.detail(id),
          }),
        ]);
      },
    });
  };
}

export const useSubmitPurchaseOrder = createActionMutation(
  purchaseOrderService.submit,
);

export const useApprovePurchaseOrder = createActionMutation(
  purchaseOrderService.approve,
);

export const useCancelPurchaseOrder = createActionMutation(
  purchaseOrderService.cancel,
);

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ReceivePurchaseOrderInput;
    }) => purchaseOrderService.receive(id, data),

    onSuccess: async (po) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: purchaseOrderKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: purchaseOrderKeys.detail(po.id),
        }),
        queryClient.invalidateQueries({
          queryKey: ["inventory"],
        }),
      ]);
    },
  });
}
