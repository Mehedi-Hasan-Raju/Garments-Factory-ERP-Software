"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type ElementType,
} from "react";
import {
  Ruler,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  Package,
  CheckCircle2,
  XCircle,
  Boxes,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import {
  useUnits,
  useCreateUnit,
  useUpdateUnit,
} from "@/hooks/use-units";
import type { Unit } from "@/types/unit";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type ConfirmAction = {
  title: string;
  description: string;
  confirmText: string;
  variant: "warning" | "danger";
  onConfirm: () => Promise<boolean>;
};

interface UnitFormState {
  name: string;
  code: string;
  description: string;
}

const initialForm: UnitFormState = {
  name: "",
  code: "",
  description: "",
};

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: ElementType;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-5" />
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
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

export default function UnitsPage() {
  const { user } = useAuth();

  const { data: units = [], isLoading, isError, refetch, isFetching } =
    useUnits();

  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();

  const role = user?.role.code;

  const canCreate = role === "OWNER" || role === "MANAGER";
  const canEdit =
    role === "OWNER" ||
    role === "MANAGER" ||
    role === "STOREKEEPER";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [form, setForm] = useState<UnitFormState>(initialForm);
  const [confirmAction, setConfirmAction] =
    useState<ConfirmAction | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const stats = useMemo(() => {
    return {
      total: units.length,
      active: units.filter((unit) => unit.isActive).length,
      inactive: units.filter((unit) => !unit.isActive).length,
      products: units.reduce(
        (total, unit) => total + (unit._count?.products ?? 0),
        0,
      ),
    };
  }, [units]);

  const filteredUnits = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return units.filter((unit) => {
      const matchesSearch =
        !normalizedSearch ||
        unit.name.toLowerCase().includes(normalizedSearch) ||
        unit.code.toLowerCase().includes(normalizedSearch) ||
        (unit.description ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && unit.isActive) ||
        (statusFilter === "INACTIVE" && !unit.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [units, search, statusFilter]);

  function openCreateDialog() {
    setEditingUnit(null);
    setForm(initialForm);
    setDialogOpen(true);
  }

  function openEditDialog(unit: Unit) {
    setEditingUnit(unit);
    setForm({
      name: unit.name,
      code: unit.code,
      description: unit.description ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;

    setDialogOpen(false);
    setEditingUnit(null);
    setForm(initialForm);
  }

  function updateForm(field: keyof UnitFormState, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: field === "code" ? value.toUpperCase() : value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const description = form.description.trim();

    if (name.length < 2 || name.length > 50) {
      toast.error("Unit name must be between 2 and 50 characters.");
      return;
    }

    if (!editingUnit && !/^[A-Z0-9_-]{1,20}$/.test(code)) {
      toast.error(
        "Code must contain uppercase letters, numbers, _ or - (maximum 20 characters).",
      );
      return;
    }

    if (description.length > 500) {
      toast.error("Description cannot exceed 500 characters.");
      return;
    }

    if (editingUnit) {
      const unitId = editingUnit.id;
      const unitName = editingUnit.name;
      const data = {
        name,
        description: description || null,
      };

      setConfirmAction({
        title: "Update Unit?",
        description: `Save changes to "${unitName}"?`,
        confirmText: "Save Changes",
        variant: "warning",
        onConfirm: async () => {
          try {
            await updateMutation.mutateAsync({ id: unitId, data });
            toast.success("Unit updated successfully.");
            setDialogOpen(false);
            setEditingUnit(null);
            setForm(initialForm);
            return true;
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : "Something went wrong. Please try again.";
            toast.error(message);
            return false;
          }
        },
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        code,
        description: description || null,
      });

      toast.success("Unit created successfully.");

      setDialogOpen(false);
      setEditingUnit(null);
      setForm(initialForm);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      toast.error(message);
    }
  }

  async function handleStatusChange(unit: Unit) {
    const nextStatus = !unit.isActive;

    if (
      nextStatus === false &&
      (unit._count?.products ?? 0) > 0
    ) {
      toast.error(
        "This unit is assigned to products and cannot be deactivated.",
      );
      return;
    }

    setConfirmAction({
      title: nextStatus ? "Activate Unit?" : "Deactivate Unit?",
      description: `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } "${unit.name}"?`,
      confirmText: nextStatus ? "Activate" : "Deactivate",
      variant: "warning",
      onConfirm: async () => {
        try {
          await updateMutation.mutateAsync({
            id: unit.id,
            data: { isActive: nextStatus },
          });
          toast.success(
            `Unit ${nextStatus ? "activated" : "deactivated"} successfully.`,
          );
          return true;
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to update unit status.";
          toast.error(message);
          return false;
        }
      },
    });
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-card p-8 text-center">
        <XCircle className="mx-auto size-9 text-destructive" />
        <h2 className="mt-3 font-semibold">Failed to load units</h2>
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
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Ruler className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Unit Management
            </h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage measurement units used across your products and inventory.
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

          {canCreate && (
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" />
              Add Unit
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Units"
          value={stats.total}
          icon={Ruler}
          description="All registered measurement units"
        />
        <SummaryCard
          title="Active Units"
          value={stats.active}
          icon={CheckCircle2}
          description="Currently available for use"
        />
        <SummaryCard
          title="Inactive Units"
          value={stats.inactive}
          icon={XCircle}
          description="Currently unavailable units"
        />
        <SummaryCard
          title="Product Usage"
          value={stats.products}
          icon={Package}
          description="Total product-unit assignments"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, code or description..."
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Units</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Measurement Units</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {filteredUnits.length} unit(s) found
            </p>
          </div>
          <Boxes className="size-5 text-muted-foreground" />
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading units...
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <Ruler className="size-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No units found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : "Create your first measurement unit to get started."}
            </p>

            {canCreate && !search && statusFilter === "ALL" && (
              <button
                onClick={openCreateDialog}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="size-4" />
                Add Unit
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Unit</th>
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Products</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {canEdit && (
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredUnits.map((unit) => (
                  <tr
                    key={unit.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium">{unit.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(unit.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs">
                        {unit.code}
                      </span>
                    </td>

                    <td className="max-w-[240px] px-5 py-4 text-muted-foreground">
                      <span className="line-clamp-2">
                        {unit.description || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Package className="size-4" />
                        {unit._count?.products ?? 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge active={unit.isActive} />
                    </td>

                    {canEdit && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDialog(unit)}
                            title="Edit unit"
                            className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>

                          <button
                            onClick={() => handleStatusChange(unit)}
                            disabled={
                              updateMutation.isPending ||
                              (!unit.isActive &&
                                false)
                            }
                            title={
                              unit.isActive
                                ? "Deactivate unit"
                                : "Activate unit"
                            }
                            className={`rounded-lg border border-border p-2 transition hover:bg-muted disabled:opacity-50 ${
                              unit.isActive
                                ? "text-muted-foreground hover:text-destructive"
                                : "text-primary"
                            }`}
                          >
                            <Power className="size-4" />
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
      </div>

      {/* Create / Edit dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDialog();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingUnit ? "Edit Unit" : "Create Unit"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingUnit
                    ? "Update the measurement unit information."
                    : "Add a new measurement unit to your system."}
                </p>
              </div>

              <button
                onClick={closeDialog}
                disabled={isSaving}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close dialog"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Unit Name <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  minLength={2}
                  maxLength={50}
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  placeholder="e.g. Piece"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Unit Code <span className="text-destructive">*</span>
                </label>
                <input
                  required={!editingUnit}
                  disabled={Boolean(editingUnit)}
                  minLength={1}
                  maxLength={20}
                  value={form.code}
                  onChange={(event) =>
                    updateForm("code", event.target.value)
                  }
                  placeholder="e.g. PCS"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-muted-foreground">
                  {editingUnit
                    ? "Unit code cannot be changed after creation."
                    : "Uppercase letters, numbers, underscore and hyphen only."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe this measurement unit..."
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {form.description.length}/500
                </p>
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
                  {editingUnit ? "Save Changes" : "Create Unit"}
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
        loading={updateMutation.isPending}
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
