
"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  useCreateSupplier,
  useDeactivateSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "@/hooks/use-suppliers";

import {
  RAW_MATERIAL_TYPES,
  SUPPLIER_TYPES,
  type CreateSupplierInput,
  type RawMaterialType,
  type Supplier,
  type SupplierListParams,
  type SupplierType,
} from "@/types/supplier";

const initialForm: CreateSupplierInput = {
  supplierCode: "",
  supplierName: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  supplierType: "MANUFACTURER",
  rawMaterialTypes: [],
  notes: "",
};

const supplierTypeLabels: Record<SupplierType, string> = {
  MANUFACTURER: "Manufacturer",
  DISTRIBUTOR: "Distributor",
  WHOLESALER: "Wholesaler",
  TRADER: "Trader",
  OTHER: "Other",
};

const materialLabels: Record<RawMaterialType, string> = {
  FABRIC: "Fabric",
  ACCESSORIES: "Accessories",
  THREAD: "Thread",
  BUTTON: "Button",
  ZIPPER: "Zipper",
  LABEL: "Label",
  PACKAGING: "Packaging",
  OTHER: "Other",
};

type DialogMode = "create" | "edit" | "view";

type PendingAction =
  | { type: "save"; mode: "edit" }
  | { type: "deactivate"; supplier: Supplier }
  | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function SuppliersPage() {
  const { user } = useAuth();

  const canManage =
    user?.role.code === "OWNER" ||
    user?.role.code === "MANAGER";

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<SupplierListParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [mode, setMode] = useState<DialogMode | null>(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<Supplier | null>(null);
  const [form, setForm] = useState<CreateSupplierInput>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] =
    useState<PendingAction>(null);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deactivateMutation = useDeactivateSupplier();

  const queryParams = useMemo(
    () => ({
      ...filters,
      search: searchInput.trim() || undefined,
    }),
    [filters, searchInput],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSuppliers(queryParams);

  const suppliers = data?.suppliers ?? [];
  const pagination = data?.pagination;

  const activeCount = suppliers.filter(
    (supplier) => supplier.isActive,
  ).length;

  const inactiveCount = suppliers.filter(
    (supplier) => !supplier.isActive,
  ).length;

  function openCreate() {
    setSelectedSupplier(null);
    setForm(initialForm);
    setErrors({});
    setMode("create");
  }

  function openEdit(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setForm({
      supplierCode: supplier.supplierCode,
      supplierName: supplier.supplierName,
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson ?? "",
      phone: supplier.phone,
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      supplierType: supplier.supplierType,
      rawMaterialTypes: supplier.rawMaterialTypes,
      notes: supplier.notes ?? "",
    });
    setErrors({});
    setMode("edit");
  }

  function openView(supplier: Supplier) {
    setSelectedSupplier(supplier);
    setMode("view");
  }

  function closeDialog() {
    setMode(null);
    setSelectedSupplier(null);
    setErrors({});
  }

  function updateField<K extends keyof CreateSupplierInput>(
    key: K,
    value: CreateSupplierInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: "",
    }));
  }

  function toggleMaterial(material: RawMaterialType) {
    setForm((current) => {
      const exists = current.rawMaterialTypes.includes(material);

      return {
        ...current,
        rawMaterialTypes: exists
          ? current.rawMaterialTypes.filter((item) => item !== material)
          : [...current.rawMaterialTypes, material],
      };
    });
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (form.supplierCode.trim().length < 2) {
      nextErrors.supplierCode = "Supplier code must be at least 2 characters.";
    } else if (form.supplierCode.trim().length > 50) {
      nextErrors.supplierCode = "Supplier code cannot exceed 50 characters.";
    }

    if (form.supplierName.trim().length < 2) {
      nextErrors.supplierName = "Supplier name must be at least 2 characters.";
    } else if (form.supplierName.trim().length > 150) {
      nextErrors.supplierName = "Supplier name cannot exceed 150 characters.";
    }

    if (form.companyName.trim().length < 2) {
      nextErrors.companyName = "Company name must be at least 2 characters.";
    }

    if (form.phone.trim().length < 5 || form.phone.trim().length > 30) {
      nextErrors.phone = "Phone must contain 5–30 characters.";
    }

    if (
      form.email?.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.contactPerson && form.contactPerson.length > 120) {
      nextErrors.contactPerson = "Maximum 120 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function requestSave() {
    if (!validateForm()) return;

    if (mode === "create") {
      const payload: CreateSupplierInput = {
        ...form,
        supplierCode: form.supplierCode.trim().toUpperCase(),
        supplierName: form.supplierName.trim(),
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson?.trim() || null,
        phone: form.phone.trim(),
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
        notes: form.notes?.trim() || null,
      };

      try {
        await createMutation.mutateAsync(payload);
        toast.success("Supplier created successfully.");
        closeDialog();
      } catch (error) {
        const apiError = error as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        toast.error(
          apiError.response?.status === 409
            ? "This supplier code already exists."
            : apiError.response?.data?.message ||
                "Unable to create supplier.",
        );
      }

      return;
    }

    setPendingAction({ type: "save", mode: "edit" });
  }

  async function executeSave() {
    if (
      !pendingAction ||
      pendingAction.type !== "save" ||
      !selectedSupplier
    ) {
      return;
    }

    const payload: CreateSupplierInput = {
      supplierCode: form.supplierCode.trim().toUpperCase(),
      supplierName: form.supplierName.trim(),
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson?.trim() || null,
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      address: form.address?.trim() || null,
      supplierType: form.supplierType,
      rawMaterialTypes: form.rawMaterialTypes,
      notes: form.notes?.trim() || null,
    };

    try {
      await updateMutation.mutateAsync({
        id: selectedSupplier.id,
        data: payload,
      });
      toast.success("Supplier updated successfully.");

      setPendingAction(null);
      closeDialog();
    } catch (error) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      };

      if (apiError.response?.status === 409) {
        toast.error("This supplier code already exists.");
      } else {
        toast.error(
          apiError.response?.data?.message ||
            "Unable to save supplier. Please try again.",
        );
      }
    }
  }

  async function executeDeactivate() {
    if (!pendingAction || pendingAction.type !== "deactivate") return;

    try {
      await deactivateMutation.mutateAsync(
        pendingAction.supplier.id,
      );

      toast.success("Supplier deactivated successfully.");
      setPendingAction(null);
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: { message?: string };
        };
      };

      toast.error(
        apiError.response?.data?.message ||
          "Unable to deactivate supplier.",
      );
    }
  }

  const mutationLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deactivateMutation.isPending;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Supplier Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage suppliers, company information and supplied materials.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            <Plus className="h-4 w-4" />
            Add Supplier
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          label="Total Suppliers"
          value={pagination?.total ?? 0}
          icon={Building2}
        />
        <SummaryCard
          label="Active on Current Page"
          value={activeCount}
          icon={Users}
        />
        <SummaryCard
          label="Inactive on Current Page"
          value={inactiveCount}
          icon={Truck}
        />
      </div>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-foreground">
              Supplier Directory
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Search and manage registered suppliers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setFilters((current) => ({ ...current, page: 1 }));
              }}
              placeholder="Search supplier, company, phone..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15"
            />
          </div>

          <select
            value={filters.supplierType ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                supplierType:
                  (event.target.value as SupplierType) || undefined,
              }))
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-green-600"
          >
            <option value="">All Supplier Types</option>
            {SUPPLIER_TYPES.map((type) => (
              <option key={type} value={type}>
                {supplierTypeLabels[type]}
              </option>
            ))}
          </select>

          <select
            value={filters.isActive === undefined ? "" : String(filters.isActive)}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                isActive:
                  event.target.value === ""
                    ? undefined
                    : event.target.value === "true",
              }))
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-green-600"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={filters.rawMaterialType ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                rawMaterialType:
                  (event.target.value as RawMaterialType) || undefined,
              }))
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-green-600 sm:col-span-2 lg:col-span-1"
          >
            <option value="">All Materials</option>
            {RAW_MATERIAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {materialLabels[type]}
              </option>
            ))}
          </select>

          <select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(event) => {
              const [sortBy, sortOrder] = event.target.value.split(":") as [
                SupplierListParams["sortBy"],
                "asc" | "desc",
              ];

              setFilters((current) => ({
                ...current,
                page: 1,
                sortBy,
                sortOrder,
              }));
            }}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-green-600 sm:col-span-2 lg:col-span-1"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="supplierName:asc">Supplier Name A–Z</option>
            <option value="supplierName:desc">Supplier Name Z–A</option>
            <option value="companyName:asc">Company A–Z</option>
            <option value="companyName:desc">Company Z–A</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading suppliers...
          </div>
        ) : isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              {(error as Error)?.message || "Failed to load suppliers."}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Try Again
            </button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center">
            <Building2 className="h-9 w-9 text-muted-foreground" />
            <p className="font-medium text-foreground">
              No suppliers found
            </p>
            <p className="text-sm text-muted-foreground">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Company</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Materials</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">
                          {supplier.supplierName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {supplier.supplierCode}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-foreground">
                        {supplier.companyName}
                      </td>

                      <td className="px-4 py-3 text-foreground">
                        {supplierTypeLabels[supplier.supplierType]}
                      </td>

                      <td className="max-w-52 px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {supplier.rawMaterialTypes.length ? (
                            supplier.rawMaterialTypes.slice(0, 3).map((item) => (
                              <span
                                key={item}
                                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                              >
                                {materialLabels[item]}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Not specified
                            </span>
                          )}
                          {supplier.rawMaterialTypes.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{supplier.rawMaterialTypes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-foreground">{supplier.phone}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {supplier.email || "No email"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge active={supplier.isActive} />
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(supplier.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            label="View supplier"
                            onClick={() => openView(supplier)}
                          >
                            <Eye className="h-4 w-4" />
                          </ActionButton>

                          {canManage && (
                            <>
                              <ActionButton
                                label="Edit supplier"
                                onClick={() => openEdit(supplier)}
                              >
                                <Pencil className="h-4 w-4" />
                              </ActionButton>

                              {supplier.isActive && (
                                <ActionButton
                                  label="Deactivate supplier"
                                  danger
                                  onClick={() =>
                                    setPendingAction({
                                      type: "deactivate",
                                      supplier,
                                    })
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </ActionButton>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {suppliers.length} of {pagination?.total ?? 0} suppliers
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={filters.limit ?? 10}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      page: 1,
                      limit: Number(event.target.value),
                    }))
                  }
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>

                <button
                  type="button"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.max(1, (current.page ?? 1) - 1),
                    }))
                  }
                  className="h-9 rounded-lg border border-border px-3 text-sm disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="min-w-16 text-center text-sm text-muted-foreground">
                  {pagination?.page ?? 1} / {Math.max(1, pagination?.totalPages ?? 1)}
                </span>

                <button
                  type="button"
                  disabled={
                    (filters.page ?? 1) >= (pagination?.totalPages ?? 1)
                  }
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: (current.page ?? 1) + 1,
                    }))
                  }
                  className="h-9 rounded-lg border border-border px-3 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {mode && (
        <SupplierDialog
          mode={mode}
          supplier={selectedSupplier}
          form={form}
          errors={errors}
          onClose={closeDialog}
          onChange={updateField}
          onToggleMaterial={toggleMaterial}
          onSave={requestSave}
          loading={mutationLoading}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction?.type === "deactivate"
            ? "Deactivate Supplier?"
            : "Save Supplier Changes?"
        }
        description={
          pendingAction?.type === "deactivate"
            ? `Are you sure you want to deactivate "${pendingAction.supplier.supplierName}"?`
            : "Are you sure you want to save these supplier changes?"
        }
        confirmText={
          pendingAction?.type === "deactivate"
            ? "Deactivate"
            : "Save Changes"
        }
        variant={pendingAction?.type === "deactivate" ? "warning" : "warning"}
        loading={mutationLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction?.type === "deactivate") {
            void executeDeactivate();
          } else if (pendingAction?.type === "save") {
            void executeSave();
          }
        }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-green-100 p-2 text-green-800 dark:bg-green-950/50 dark:text-green-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SupplierDialog({
  mode,
  supplier,
  form,
  errors,
  onClose,
  onChange,
  onToggleMaterial,
  onSave,
  loading,
}: {
  mode: DialogMode;
  supplier: Supplier | null;
  form: CreateSupplierInput;
  errors: Record<string, string>;
  onClose: () => void;
  onChange: <K extends keyof CreateSupplierInput>(
    key: K,
    value: CreateSupplierInput[K],
  ) => void;
  onToggleMaterial: (material: RawMaterialType) => void;
  onSave: () => void;
  loading: boolean;
}) {
  const readOnly = mode === "view";

  function fieldClass(hasError: boolean) {
    return `mt-1 h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 ${
      hasError ? "border-red-500" : "border-input"
    }`;
  }

  function inputField(
    label: string,
    key: keyof CreateSupplierInput,
    required = false,
    type = "text",
  ) {
    const value = form[key];

    return (
      <label className="block">
        <span className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        <input
          type={type}
          disabled={readOnly}
          value={typeof value === "string" ? value : ""}
          onChange={(event) =>
            onChange(key, event.target.value as never)
          }
          className={fieldClass(Boolean(errors[key]))}
        />
        {errors[key] && (
          <span className="mt-1 block text-xs text-red-500">
            {errors[key]}
          </span>
        )}
      </label>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {mode === "create"
                ? "Create Supplier"
                : mode === "edit"
                  ? "Edit Supplier"
                  : "Supplier Details"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "view"
                ? "Supplier information"
                : "Enter the supplier information below."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {inputField("Supplier Code", "supplierCode", true)}
            {inputField("Supplier Name", "supplierName", true)}
            {inputField("Company Name", "companyName", true)}
            {inputField("Contact Person", "contactPerson")}
            {inputField("Phone", "phone", true, "tel")}
            {inputField("Email", "email", false, "email")}

            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Supplier Type <span className="text-red-500">*</span>
              </span>
              <select
                disabled={readOnly}
                value={form.supplierType}
                onChange={(event) =>
                  onChange(
                    "supplierType",
                    event.target.value as SupplierType,
                  )
                }
                className={fieldClass(false)}
              >
                {SUPPLIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {supplierTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-foreground">
                Raw Material Types
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {RAW_MATERIAL_TYPES.map((material) => {
                  const checked =
                    form.rawMaterialTypes.includes(material);

                  return (
                    <label
                      key={material}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                        checked
                          ? "border-green-600 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"
                          : "border-border text-muted-foreground hover:bg-muted"
                      } ${readOnly ? "cursor-default" : ""}`}
                    >
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={checked}
                        onChange={() => onToggleMaterial(material)}
                        className="accent-green-700"
                      />
                      {materialLabels[material]}
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Address
              </span>
              <textarea
                disabled={readOnly}
                rows={2}
                value={form.address ?? ""}
                onChange={(event) =>
                  onChange("address", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Notes
              </span>
              <textarea
                disabled={readOnly}
                rows={3}
                value={form.notes ?? ""}
                onChange={(event) =>
                  onChange("notes", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15"
              />
            </label>

            {mode === "view" && supplier && (
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <StatusBadge active={supplier.isActive} />
                <span className="text-xs text-muted-foreground">
                  Created: {formatDate(supplier.createdAt)}
                </span>
                <span className="text-xs text-muted-foreground">
                  Updated: {formatDate(supplier.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>

          {!readOnly && (
            <button
              type="button"
              disabled={loading}
              onClick={onSave}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Supplier" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
