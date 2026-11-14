"use client";

import {
  useState,
  type FormEvent,
} from "react";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
  usePermanentDeleteProduct,
} from "@/hooks/use-products";
import { useProductCategories } from "@/hooks/use-product-categories";
import { useUnits } from "@/hooks/use-units";
import type { Product } from "@/types/product";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type ConfirmAction = {
  title: string;
  description: string;
  confirmText: string;
  variant: "warning" | "danger";
  onConfirm: () => Promise<boolean>;
};

interface ProductFormState {
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  unitId: string;
}

const initialForm: ProductFormState = {
  name: "",
  sku: "",
  description: "",
  categoryId: "",
  unitId: "",
};

function getApiError(error: unknown, fallback: string) {
  const apiMessage = (
    error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    }
  )?.response?.data?.message;

  return apiMessage || (error instanceof Error ? error.message : fallback);
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-primary" : "bg-muted-foreground"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const role = user?.role.code;
  const isOwner = role === "OWNER";

  const canManage = role === "OWNER" || role === "MANAGER";

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "sku" | "createdAt">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction | null>(null);

  const limit = 10;

  const params = {
    search: search.trim() || undefined,
    categoryId: categoryId || undefined,
    unitId: unitId || undefined,
    isActive:
      status === "ALL" ? undefined : status === "ACTIVE",
    page,
    limit,
    sortBy,
    sortOrder,
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useProducts(params);

  // These endpoints are restricted to roles that can manage products.
  const { data: categories = [] } = useProductCategories(canManage);
  const { data: units = [] } = useUnits(canManage);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const permanentDeleteMutation = usePermanentDeleteProduct();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const products = data?.products ?? [];
  const pagination = data?.pagination;

  function changeFilter(callback: () => void) {
    callback();
    setPage(1);
  }

  function openCreateDialog() {
    setEditingProduct(null);
    setForm(initialForm);
    setDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description ?? "",
      categoryId: product.categoryId,
      unitId: product.unitId,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;
    setDialogOpen(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  function updateForm(field: keyof ProductFormState, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: field === "sku" ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const sku = form.sku.trim().toUpperCase();
    const description = form.description.trim();

    if (name.length < 2 || name.length > 150) {
      toast.error("Product name must be between 2 and 150 characters.");
      return;
    }

    if (!/^[A-Z0-9_-]{2,80}$/.test(sku)) {
      toast.error(
        "SKU must be 2–80 characters and contain only letters, numbers, _ or -.",
      );
      return;
    }

    if (!form.categoryId || !form.unitId) {
      toast.error("Please select a category and unit.");
      return;
    }

    if (description.length > 2000) {
      toast.error("Description cannot exceed 2000 characters.");
      return;
    }

    if (editingProduct) {
      const productId = editingProduct.id;
      const productName = editingProduct.name;
      const data = {
        name,
        sku,
        description: description || null,
        categoryId: form.categoryId,
        unitId: form.unitId,
      };

      setConfirmAction({
        title: "Update Product?",
        description: `Save changes to "${productName}"?`,
        confirmText: "Save Changes",
        variant: "warning",
        onConfirm: async () => {
          try {
            await updateMutation.mutateAsync({ id: productId, data });
            toast.success("Product updated successfully.");
            closeDialog();
            return true;
          } catch (error) {
            toast.error(getApiError(error, "Unable to save product."));
            return false;
          }
        },
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        sku,
        description: description || null,
        categoryId: form.categoryId,
        unitId: form.unitId,
      });

      toast.success("Product created successfully.");

      closeDialog();
    } catch (error) {
      toast.error(getApiError(error, "Unable to save product."));
    }
  }

  async function handleStatusChange(product: Product) {
    const nextStatus = !product.isActive;

    setConfirmAction({
      title: nextStatus ? "Activate Product?" : "Deactivate Product?",
      description: `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } "${product.name}"?`,
      confirmText: nextStatus ? "Activate" : "Deactivate",
      variant: "warning",
      onConfirm: async () => {
        try {
          if (nextStatus) {
            await updateMutation.mutateAsync({
              id: product.id,
              data: { isActive: true },
            });
            toast.success("Product activated successfully.");
          } else {
            await deactivateMutation.mutateAsync(product.id);
            toast.success("Product deactivated successfully.");
          }
          return true;
        } catch (error) {
          toast.error(
            getApiError(error, "Unable to update product status."),
          );
          return false;
        }
      },
    });
  }

  async function handlePermanentDelete(product: Product) {
    setConfirmAction({
      title: "Permanently Delete Product?",
      description: `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`,
      confirmText: "Delete Permanently",
      variant: "danger",
      onConfirm: async () => {
        try {
          await permanentDeleteMutation.mutateAsync(product.id);
          toast.success("Product permanently deleted.");
          return true;
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            toast.error(
              "This product cannot be deleted because it is associated with inventory or transaction records. You can deactivate it instead.",
            );
            return false;
          }

          toast.error(
            getApiError(error, "Failed to permanently delete product."),
          );
          return false;
        }
      },
    });
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
        <Package className="mx-auto size-9 text-destructive" />
        <h2 className="mt-3 font-semibold">Failed to load products</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please check your connection and try again.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Package className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Product Management
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage product information, SKU, categories and measurement units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {canManage && (
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Matching Products"
          value={pagination?.total ?? 0}
          description="Products matching current filters"
        />
        <SummaryCard
          title="Current Page"
          value={`${pagination?.page ?? page} / ${pagination?.totalPages ?? 0}`}
          description="Server-side pagination"
        />
        <SummaryCard
          title="Products Per Page"
          value={limit}
          description="Records displayed per page"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) =>
              changeFilter(() => setSearch(event.target.value))
            }
            placeholder="Search product name or SKU..."
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select
            value={categoryId}
            onChange={(event) =>
              changeFilter(() => setCategoryId(event.target.value))
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Categories</option>
            {categories
              .filter((category) => category.isActive)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>

          <select
            value={unitId}
            onChange={(event) =>
              changeFilter(() => setUnitId(event.target.value))
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Units</option>
            {units
              .filter((unit) => unit.isActive)
              .map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.code})
                </option>
              ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              changeFilter(() =>
                setStatus(event.target.value as StatusFilter),
              )
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(event) => {
              const [nextSortBy, nextSortOrder] = event.target.value.split(
                ":",
              ) as ["name" | "sku" | "createdAt", "asc" | "desc"];

              setSortBy(nextSortBy);
              setSortOrder(nextSortOrder);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="sku:asc">SKU A–Z</option>
            <option value="sku:desc">SKU Z–A</option>
          </select>
        </div>

        {(search || categoryId || unitId || status !== "ALL") && (
          <button
            onClick={() => {
              setSearch("");
              setCategoryId("");
              setUnitId("");
              setStatus("ALL");
              setPage(1);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <X className="size-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Product table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Products</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {pagination?.total ?? 0} product(s) found
            </p>
          </div>
          {isFetching && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <Package className="size-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No products found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Try changing your filters or create your first product.
            </p>
            {canManage && (
              <button
                onClick={openCreateDialog}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="size-4" />
                Add Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canManage && (
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium">{product.name}</p>
                      <p className="mt-1 max-w-[240px] truncate text-xs text-muted-foreground">
                        {product.description || "No description"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs">
                        {product.sku}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium">
                        {product.category.name}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {product.category.code}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium">{product.unit.name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({product.unit.code})
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge active={product.isActive} />
                    </td>

                    {canManage && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(product)}
                            title="Edit product"
                            className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>

                          <button
                            onClick={() => handleStatusChange(product)}
                            title={
                              product.isActive
                                ? "Deactivate product"
                                : "Activate product"
                            }
                            className={`rounded-lg border border-border p-2 transition hover:bg-muted ${
                              product.isActive
                                ? "text-muted-foreground hover:text-destructive"
                                : "text-primary"
                            }`}
                          >
                            <Power className="size-4" />
                          </button>

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(product)}
                              disabled={permanentDeleteMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              )}{" "}
              of {pagination.total} products
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPreviousPage || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>

              <span className="min-w-16 text-center text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingProduct ? "Edit Product" : "Create Product"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the product details below.
                </p>
              </div>

              <button
                onClick={closeDialog}
                disabled={isSaving}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">
                    Product Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={form.name}
                    onChange={(event) =>
                      updateForm("name", event.target.value)
                    }
                    placeholder="e.g. Cotton T-Shirt"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">
                    SKU <span className="text-destructive">*</span>
                  </label>
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    value={form.sku}
                    onChange={(event) =>
                      updateForm("sku", event.target.value)
                    }
                    placeholder="e.g. CT-SHIRT-001"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique product code. Letters, numbers, underscore and
                    hyphen only.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(event) =>
                      updateForm("categoryId", event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select category</option>
                    {categories
                      .filter((category) => category.isActive)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Unit <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={form.unitId}
                    onChange={(event) =>
                      updateForm("unitId", event.target.value)
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select unit</option>
                    {units
                      .filter((unit) => unit.isActive)
                      .map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Describe the product..."
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-right text-xs text-muted-foreground">
                    {form.description.length}/2000
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {isSaving && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        confirmText={confirmAction?.confirmText ?? ""}
        variant={confirmAction?.variant}
        loading={
          updateMutation.isPending ||
          deactivateMutation.isPending ||
          permanentDeleteMutation.isPending
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          if (!confirmAction) return;
          if (await confirmAction.onConfirm()) {
            setConfirmAction(null);
          }
        }}
      />
    </div>
  );
}
