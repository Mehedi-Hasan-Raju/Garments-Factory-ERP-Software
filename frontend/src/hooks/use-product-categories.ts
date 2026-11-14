import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { productCategoryService } from "@/services/product-category.service";
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from "@/types/product-category";

export const productCategoryKeys = {
  all: ["product-categories"] as const,
  lists: () => [...productCategoryKeys.all, "list"] as const,
  detail: (id: string) => [...productCategoryKeys.all, "detail", id] as const,
};


export function useProductCategories(enabled = true) {
  return useQuery({
    queryKey: productCategoryKeys.all,
    queryFn: productCategoryService.getAll,
    enabled,
  });
}


export function useProductCategory(id: string) {
  return useQuery({
    queryKey: productCategoryKeys.detail(id),
    queryFn: () => productCategoryService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductCategoryInput) =>
      productCategoryService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.all,
      });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductCategoryInput;
    }) => productCategoryService.update(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.all,
      });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productCategoryService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productCategoryKeys.all,
      });
    },
  });
}
