
"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  FolderTree,
  Package,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  useProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
} from "@/hooks/use-product-categories";
import type {
  ProductCategory,
  CreateProductCategoryInput,
} from "@/types/product-category";

type CategoryFormState = {
  name: string;
  code: string;
  description: string;
};

const initialForm: CategoryFormState = {
  name: "",
  code: "",
  description: "",
};

type ConfirmAction = {
  title: string;
  description: string;
  confirmText: string;
  variant: "warning" | "danger";
  onConfirm: () => Promise<boolean>;
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    return response?.data?.message ?? "Something went wrong.";
  }

  return "Something went wrong. Please try again.";
}

export default function ProductCategoriesPage() {
  const { user } = useAuth();

  const canManage =
    user?.role.code === "OWNER" ||
    user?.role.code === "MANAGER";

  const { data: categories = [], isLoading, isError, error, refetch } =
    useProductCategories();

  const createMutation = useCreateProductCategory();
  const updateMutation = useUpdateProductCategory();
  const deleteMutation = useDeleteProductCategory();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ProductCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction | null>(null);

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        category.code.toLowerCase().includes(normalizedSearch) ||
        (category.description ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && category.isActive) ||
        (statusFilter === "INACTIVE" && !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const activeCount = categories.filter((item) => item.isActive).length;
  const inactiveCount = categories.length - activeCount;

  const isSaving =
    createMutation.isPending || updateMutation.isPending;

  function openCreateDialog() {
    setEditingCategory(null);
    setForm(initialForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEditDialog(category: ProductCategory) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      code: category.code,
      description: category.description ?? "",
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;
    setDialogOpen(false);
    setEditingCategory(null);
    setForm(initialForm);
    setFormErrors({});
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (form.name.trim().length < 2) {
      errors.name = "Name must contain at least 2 characters.";
    }

    if (!editingCategory) {
      const code = form.code.trim();

      if (code.length < 2 || code.length > 30) {
        errors.code = "Code must contain 2–30 characters.";
      } else if (!/^[A-Z0-9_-]+$/.test(code)) {
        errors.code =
          "Use uppercase letters, numbers, underscore or hyphen.";
      }
    }

    if (form.description.length > 500) {
      errors.description = "Maximum 500 characters allowed.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    if (editingCategory) {
      const categoryId = editingCategory.id;
      const categoryName = editingCategory.name;
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      setConfirmAction({
        title: "Update Category?",
        description: `Save changes to "${categoryName}"?`,
        confirmText: "Save Changes",
        variant: "warning",
        onConfirm: async () => {
          try {
            await updateMutation.mutateAsync({
              id: categoryId,
              payload,
            });
            toast.success("Product category updated successfully.");
            closeDialog();
            return true;
          } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
          }
        },
      });
      return;
    }

    try {
      const payload: CreateProductCategoryInput = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || null,
      };

      await createMutation.mutateAsync(payload);
      toast.success("Product category created successfully.");

      closeDialog();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function handleStatusToggle(category: ProductCategory) {
    const nextStatus = !category.isActive;

    setConfirmAction({
      title: nextStatus ? "Activate Category?" : "Deactivate Category?",
      description: `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } "${category.name}"?`,
      confirmText: nextStatus ? "Activate" : "Deactivate",
      variant: "warning",
      onConfirm: async () => {
        try {
          await updateMutation.mutateAsync({
            id: category.id,
            payload: { isActive: nextStatus },
          });
          toast.success(
            category.isActive
              ? "Category deactivated."
              : "Category activated.",
          );
          return true;
        } catch (error) {
          toast.error(getErrorMessage(error));
          return false;
        }
      },
    });
  }

  function handleDelete(category: ProductCategory) {
    setConfirmAction({
      title: "Deactivate Category?",
      description: `Deactivate "${category.name}"? This action will not permanently delete the category.`,
      confirmText: "Deactivate",
      variant: "warning",
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(category.id);
          toast.success("Category deactivated successfully.");
          return true;
        } catch (error) {
          toast.error(getErrorMessage(error));
          return false;
        }
      },
    });
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              Product Categories
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize and manage your product categories.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Categories"
          value={categories.length}
          icon={FolderTree}
        />
        <SummaryCard
          title="Active Categories"
          value={activeCount}
          icon={CheckCircle2}
        />
        <SummaryCard
          title="Inactive Categories"
          value={inactiveCount}
          icon={XCircle}
        />
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Category List</h2>
            <p className="text-sm text-muted-foreground">
              Browse and manage all product categories.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading}
              title="Refresh categories"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-3 text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading categories...
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-9 w-9 text-destructive" />
            <p className="font-medium">Failed to load categories</p>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredCategories.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">
              {categories.length === 0
                ? "No categories found"
                : "No matching categories"}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {categories.length === 0
                ? "Create your first product category to organize your inventory."
                : "Try changing your search or status filter."}
            </p>
            {canManage && categories.length === 0 && (
              <button
                type="button"
                onClick={openCreateDialog}
                className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Create Category
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && filteredCategories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Code</th>
                  <th className="px-5 py-4 font-medium">Products</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  {canManage && (
                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium">{category.name}</div>
                      <div className="mt-1 max-w-sm truncate text-xs text-muted-foreground">
                        {category.description || "No description"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                        {category.code}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {category._count?.products ?? 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge active={category.isActive} />
                    </td>

                    {canManage && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDialog(category)}
                            title="Edit category"
                            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusToggle(category)}
                            disabled={updateMutation.isPending}
                            title={
                              category.isActive
                                ? "Deactivate category"
                                : "Activate category"
                            }
                            className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                          >
                            {category.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={
                              deleteMutation.isPending ||
                              (category._count?.products ?? 0) > 0
                            }
                            title={
                              (category._count?.products ?? 0) > 0
                                ? "Category has products and cannot be deactivated"
                                : "Deactivate category"
                            }
                            className="rounded-lg border border-border p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && filteredCategories.length > 0 && (
          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Showing {filteredCategories.length} of {categories.length} categories
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-dialog-title"
            className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2
                  id="category-dialog-title"
                  className="text-lg font-semibold"
                >
                  {editingCategory ? "Edit Category" : "Create Category"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingCategory
                    ? "Update category information."
                    : "Add a new product category."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={isSaving}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label htmlFor="category-name" className="text-sm font-medium">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="category-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Fabric"
                  maxLength={100}
                  required
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {!editingCategory && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="category-code"
                    className="text-sm font-medium"
                  >
                    Category Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="category-code"
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. FABRIC"
                    maxLength={30}
                    required
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-ring"
                  />
                  {formErrors.code && (
                    <p className="text-xs text-destructive">
                      {formErrors.code}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Uppercase letters, numbers, _ and - only.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="category-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe this category..."
                  rows={4}
                  maxLength={500}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex justify-between">
                  {formErrors.description ? (
                    <p className="text-xs text-destructive">
                      {formErrors.description}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {form.description.length}/500
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingCategory ? "Save Changes" : "Create Category"}
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
        loading={updateMutation.isPending || deleteMutation.isPending}
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

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
