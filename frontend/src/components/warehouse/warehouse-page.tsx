
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Warehouse as WarehouseIcon,
  MapPin,
  Layers3,
  Boxes,
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Loader2,
  X,
  Package,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";

import {
  useWarehouses,
  useWarehouseLocations,
  useCreateWarehouse,
  useUpdateWarehouse,
  useUpdateWarehouseStatus,
  useDeleteWarehouse,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from "@/hooks/use-warehouse";

import type {
  Warehouse,
  WarehouseLocation,
  LocationType,
} from "@/types/warehouse";

type Tab = "warehouses" | "locations";

type WarehouseForm = {
  name: string;
  code: string;
  description: string;
};

type LocationForm = {
  name: string;
  code: string;
  type: LocationType;
  parentId: string;
};

const emptyWarehouseForm: WarehouseForm = {
  name: "",
  code: "",
  description: "",
};

const emptyLocationForm: LocationForm = {
  name: "",
  code: "",
  type: "RACK",
  parentId: "",
};

export default function WarehousePage() {
  const { user } = useAuth();
  const role = user?.role.code;

  const canManageWarehouse = role === "OWNER" || role === "ADMIN";
  const canDeleteWarehouse = role === "OWNER";
  const canManageLocations = role === "OWNER" || role === "ADMIN";

  const [tab, setTab] = useState<Tab>("warehouses");
  const [search, setSearch] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");

  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false);

  const [editingWarehouse, setEditingWarehouse] =
    useState<Warehouse | null>(null);

  const [editingLocation, setEditingLocation] =
    useState<WarehouseLocation | null>(null);

  const [warehouseForm, setWarehouseForm] =
    useState<WarehouseForm>(emptyWarehouseForm);

  const [locationForm, setLocationForm] =
    useState<LocationForm>(emptyLocationForm);

  const [expandedRacks, setExpandedRacks] = useState<string[]>([]);
  const [expandedShelves, setExpandedShelves] = useState<string[]>([]);

  const warehousesQuery = useWarehouses({
    page: 1,
    limit: 100,
    search: search || undefined,
  });

  const warehouses = warehousesQuery.data?.warehouses ?? [];

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse.id === selectedWarehouseId,
  );

  const locationsQuery = useWarehouseLocations({
    page: 1,
    limit: 100,
    warehouseId: selectedWarehouseId || undefined,
  });

  const locations = locationsQuery.data?.locations ?? [];

  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const updateWarehouseStatus = useUpdateWarehouseStatus();
  const deleteWarehouse = useDeleteWarehouse();

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const racks = useMemo(
    () => locations.filter((location) => location.type === "RACK"),
    [locations],
  );

  const shelves = useMemo(
    () => locations.filter((location) => location.type === "SHELF"),
    [locations],
  );

  const bins = useMemo(
    () => locations.filter((location) => location.type === "BIN"),
    [locations],
  );

  const getChildren = (parentId: string, type: LocationType) =>
    locations.filter(
      (location) =>
        location.parentId === parentId && location.type === type,
    );

  const activeCount = warehouses.filter((item) => item.isActive).length;
  const inactiveCount = warehouses.length - activeCount;

  const openCreateWarehouse = () => {
    setEditingWarehouse(null);
    setWarehouseForm(emptyWarehouseForm);
    setWarehouseDialog(true);
  };

  const openEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name,
      code: warehouse.code,
      description: warehouse.description ?? "",
    });
    setWarehouseDialog(true);
  };

  const openCreateLocation = (type: LocationType = "RACK", parentId = "") => {
    setEditingLocation(null);
    setLocationForm({
      ...emptyLocationForm,
      type,
      parentId,
    });
    setLocationDialog(true);
  };

  const openEditLocation = (location: WarehouseLocation) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      code: location.code,
      type: location.type,
      parentId: location.parentId ?? "",
    });
    setLocationDialog(true);
  };

  const handleWarehouseSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (warehouseForm.name.trim().length < 2) {
      toast.error("Warehouse name must be at least 2 characters.");
      return;
    }

    if (warehouseForm.code.trim().length < 2) {
      toast.error("Warehouse code must be at least 2 characters.");
      return;
    }

    const payload = {
      name: warehouseForm.name.trim(),
      code: warehouseForm.code.trim(),
      description: warehouseForm.description.trim() || null,
    };

    try {
      if (editingWarehouse) {
        await updateWarehouse.mutateAsync({
          id: editingWarehouse.id,
          payload,
        });
        toast.success("Warehouse updated successfully.");
      } else {
        const created = await createWarehouse.mutateAsync(payload) as Warehouse;
        setSelectedWarehouseId(created.id);
        toast.success("Warehouse created successfully.");
      }

      setWarehouseDialog(false);
      setWarehouseForm(emptyWarehouseForm);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Warehouse operation failed.",
      );
    }
  };

  const handleLocationSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedWarehouseId) {
      toast.error("Select a warehouse first.");
      return;
    }

    if (locationForm.name.trim().length < 2) {
      toast.error("Location name must be at least 2 characters.");
      return;
    }

    if (locationForm.code.trim().length < 2) {
      toast.error("Location code must be at least 2 characters.");
      return;
    }

    if (locationForm.type !== "RACK" && !locationForm.parentId) {
      toast.error(`Please select a parent ${locationForm.type === "SHELF" ? "Rack" : "Shelf"}.`);
      return;
    }

    try {
      if (editingLocation) {
        const payload = {
          name: locationForm.name.trim(),
          code: locationForm.code.trim(),
          type: locationForm.type,
          parentId: locationForm.parentId || null,
        };

        await updateLocation.mutateAsync({
          id: editingLocation.id,
          payload,
        });
        toast.success("Location updated successfully.");
      } else {
        const payload = {
          name: locationForm.name.trim(),
          code: locationForm.code.trim(),
          type: locationForm.type,
          warehouseId: selectedWarehouseId,
          parentId: locationForm.parentId || null,
        };

        await createLocation.mutateAsync(payload);
        toast.success("Location created successfully.");
      }

      setLocationDialog(false);
      setLocationForm(emptyLocationForm);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Location operation failed.",
      );
    }
  };

  const handleWarehouseStatus = async (warehouse: Warehouse) => {
    try {
      await updateWarehouseStatus.mutateAsync({
        id: warehouse.id,
        isActive: !warehouse.isActive,
      });

      toast.success(
        warehouse.isActive
          ? "Warehouse deactivated."
          : "Warehouse activated.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Status update failed.",
      );
    }
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    const confirmed = window.confirm(
      `Delete "${warehouse.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteWarehouse.mutateAsync(warehouse.id);

      if (selectedWarehouseId === warehouse.id) {
        setSelectedWarehouseId("");
      }

      toast.success("Warehouse deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete warehouse.",
      );
    }
  };

  const handleDeleteLocation = async (location: WarehouseLocation) => {
    const confirmed = window.confirm(
      `Delete "${location.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteLocation.mutateAsync(location.id);
      toast.success("Location deleted successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete location.",
      );
    }
  };

  const toggleExpanded = (
    id: string,
    current: string[],
    setter: (value: string[]) => void,
  ) => {
    setter(
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const locationCount =
    (selectedWarehouse?._count?.locations ?? 0) || locations.length;

  const isWarehouseSaving =
    createWarehouse.isPending || updateWarehouse.isPending;

  const isLocationSaving =
    createLocation.isPending || updateLocation.isPending;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <WarehouseIcon className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Warehouse Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage warehouses, racks, shelves and bin locations.
          </p>
        </div>

        {canManageWarehouse && tab === "warehouses" && (
          <button
            onClick={openCreateWarehouse}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Add Warehouse
          </button>
        )}

        {canManageLocations && tab === "locations" && selectedWarehouseId && (
          <button
            onClick={() => openCreateLocation("RACK")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" />
            Add Rack
          </button>
        )}
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Warehouses"
          value={warehouses.length}
          icon={WarehouseIcon}
        />
        <MetricCard
          title="Active Warehouses"
          value={activeCount}
          icon={Power}
        />
        <MetricCard
          title="Inactive Warehouses"
          value={inactiveCount}
          icon={Layers3}
        />
        <MetricCard
          title="Locations"
          value={locationCount}
          icon={MapPin}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b">
        <TabButton
          active={tab === "warehouses"}
          onClick={() => setTab("warehouses")}
        >
          <WarehouseIcon className="size-4" />
          Warehouses
        </TabButton>

        <TabButton
          active={tab === "locations"}
          onClick={() => setTab("locations")}
        >
          <FolderTree className="size-4" />
          Location Management
        </TabButton>
      </div>

      {/* Warehouse section */}
      {tab === "warehouses" && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">All Warehouses</h2>
              <p className="text-sm text-muted-foreground">
                Select a warehouse to manage its locations.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search warehouse..."
                className="field pl-9"
              />
            </div>
          </div>

          {warehousesQuery.isLoading ? (
            <LoadingState />
          ) : warehousesQuery.isError ? (
            <ErrorState message="Could not load warehouses." />
          ) : warehouses.length === 0 ? (
            <EmptyState
              title="No warehouses found"
              description="Create your first warehouse to get started."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Warehouse</th>
                      <th className="px-5 py-3 font-medium">Code</th>
                      <th className="px-5 py-3 font-medium">Locations</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {warehouses.map((warehouse) => (
                      <tr
                        key={warehouse.id}
                        className={`transition-colors hover:bg-muted/30 ${
                          selectedWarehouseId === warehouse.id
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <td className="px-5 py-4">
                          <button
                            onClick={() => {
                              setSelectedWarehouseId(warehouse.id);
                              setTab("locations");
                            }}
                            className="flex items-center gap-3 text-left"
                          >
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <WarehouseIcon className="size-5" />
                            </div>
                            <div>
                              <p className="font-medium">{warehouse.name}</p>
                              <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                                {warehouse.description || "No description"}
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs">
                          {warehouse.code}
                        </td>

                        <td className="px-5 py-4">
                          {warehouse._count?.locations ?? 0}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge active={warehouse.isActive} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <ActionButton
                              title="View locations"
                              onClick={() => {
                                setSelectedWarehouseId(warehouse.id);
                                setTab("locations");
                              }}
                            >
                              <ChevronRight className="size-4" />
                            </ActionButton>

                            {canManageWarehouse && (
                              <>
                                <ActionButton
                                  title="Edit warehouse"
                                  onClick={() => openEditWarehouse(warehouse)}
                                >
                                  <Pencil className="size-4" />
                                </ActionButton>

                                <ActionButton
                                  title={
                                    warehouse.isActive
                                      ? "Deactivate"
                                      : "Activate"
                                  }
                                  onClick={() =>
                                    handleWarehouseStatus(warehouse)
                                  }
                                >
                                  <Power className="size-4" />
                                </ActionButton>
                              </>
                            )}

                            {canDeleteWarehouse && (
                              <ActionButton
                                title="Delete warehouse"
                                onClick={() =>
                                  handleDeleteWarehouse(warehouse)
                                }
                                danger
                              >
                                <Trash2 className="size-4" />
                              </ActionButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Location section */}
      {tab === "locations" && (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Location Hierarchy</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Warehouse → Rack → Shelf → Bin
              </p>
            </div>

            <select
              value={selectedWarehouseId}
              onChange={(event) => setSelectedWarehouseId(event.target.value)}
              className="field w-full sm:max-w-xs"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          {!selectedWarehouseId ? (
            <EmptyState
              title="Select a warehouse"
              description="Choose a warehouse to view and manage its Rack, Shelf and Bin locations."
            />
          ) : locationsQuery.isLoading ? (
            <LoadingState />
          ) : locationsQuery.isError ? (
            <ErrorState message="Could not load warehouse locations." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard title="Racks" value={racks.length} icon={Layers3} />
                <MetricCard title="Shelves" value={shelves.length} icon={Boxes} />
                <MetricCard title="Bins" value={bins.length} icon={Package} />
              </div>

              <div className="rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <h3 className="font-semibold">
                      {selectedWarehouse?.name ?? "Warehouse Locations"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locations.length} locations loaded
                    </p>
                  </div>

                  {canManageLocations && (
                    <button
                      onClick={() => openCreateLocation("RACK")}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Plus className="size-4" />
                      Add Rack
                    </button>
                  )}
                </div>

                {racks.length === 0 ? (
                  <EmptyState
                    title="No racks found"
                    description="Create a rack to start building your location hierarchy."
                  />
                ) : (
                  <div className="divide-y">
                    {racks.map((rack) => {
                      const rackShelves = getChildren(rack.id, "SHELF");
                      const rackExpanded = expandedRacks.includes(rack.id);

                      return (
                        <div key={rack.id}>
                          <LocationRow
                            location={rack}
                            level={0}
                            expanded={rackExpanded}
                            onToggle={() =>
                              toggleExpanded(
                                rack.id,
                                expandedRacks,
                                setExpandedRacks,
                              )
                            }
                            onAdd={() =>
                              openCreateLocation("SHELF", rack.id)
                            }
                            onEdit={() => openEditLocation(rack)}
                            onDelete={() => handleDeleteLocation(rack)}
                            canManage={canManageLocations}
                            canExpand={rackShelves.length > 0}
                          />

                          {rackExpanded && (
                            <div className="border-t bg-muted/10">
                              {rackShelves.map((shelf) => {
                                const shelfBins = getChildren(
                                  shelf.id,
                                  "BIN",
                                );
                                const shelfExpanded =
                                  expandedShelves.includes(shelf.id);

                                return (
                                  <div key={shelf.id}>
                                    <LocationRow
                                      location={shelf}
                                      level={1}
                                      expanded={shelfExpanded}
                                      onToggle={() =>
                                        toggleExpanded(
                                          shelf.id,
                                          expandedShelves,
                                          setExpandedShelves,
                                        )
                                      }
                                      onAdd={() =>
                                        openCreateLocation("BIN", shelf.id)
                                      }
                                      onEdit={() => openEditLocation(shelf)}
                                      onDelete={() =>
                                        handleDeleteLocation(shelf)
                                      }
                                      canManage={canManageLocations}
                                      canExpand={shelfBins.length > 0}
                                    />

                                    {shelfExpanded &&
                                      shelfBins.map((bin) => (
                                        <LocationRow
                                          key={bin.id}
                                          location={bin}
                                          level={2}
                                          expanded={false}
                                          onToggle={() => {}}
                                          onAdd={() => {}}
                                          onEdit={() =>
                                            openEditLocation(bin)
                                          }
                                          onDelete={() =>
                                            handleDeleteLocation(bin)
                                          }
                                          canManage={canManageLocations}
                                          canExpand={false}
                                        />
                                      ))}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* Warehouse dialog */}
      {warehouseDialog && (
        <Dialog
          title={editingWarehouse ? "Edit Warehouse" : "Create Warehouse"}
          description="Enter the warehouse information below."
          onClose={() => setWarehouseDialog(false)}
        >
          <form onSubmit={handleWarehouseSubmit} className="space-y-5">
            <Field label="Warehouse Name">
              <input
                required
                minLength={2}
                maxLength={100}
                value={warehouseForm.name}
                onChange={(event) =>
                  setWarehouseForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Main Raw Materials Warehouse"
                className="field"
              />
            </Field>

            <Field label="Warehouse Code">
              <input
                required
                minLength={2}
                maxLength={30}
                pattern="[A-Za-z0-9_-]+"
                value={warehouseForm.code}
                onChange={(event) =>
                  setWarehouseForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="e.g. WH-001"
                className="field"
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={4}
                maxLength={5000}
                value={warehouseForm.description}
                onChange={(event) =>
                  setWarehouseForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe this warehouse..."
                className="field resize-y"
              />
            </Field>

            <DialogActions
              onCancel={() => setWarehouseDialog(false)}
              loading={isWarehouseSaving}
              submitLabel={editingWarehouse ? "Save Changes" : "Create Warehouse"}
            />
          </form>
        </Dialog>
      )}

      {/* Location dialog */}
      {locationDialog && (
        <Dialog
          title={editingLocation ? "Edit Location" : "Create Location"}
          description="Add a Rack, Shelf or Bin to this warehouse."
          onClose={() => setLocationDialog(false)}
        >
          <form onSubmit={handleLocationSubmit} className="space-y-5">
            <Field label="Location Type">
              <select
                value={locationForm.type}
                disabled={Boolean(editingLocation)}
                onChange={(event) => {
                  setLocationForm((current) => ({
                    ...current,
                    type: event.target.value as LocationType,
                    parentId: "",
                  }));
                }}
                className="field"
              >
                <option value="RACK">Rack</option>
                <option value="SHELF">Shelf</option>
                <option value="BIN">Bin</option>
              </select>
            </Field>

            {locationForm.type !== "RACK" && (
              <Field
                label={locationForm.type === "SHELF" ? "Parent Rack" : "Parent Shelf"}
              >
                <select
                  required
                  value={locationForm.parentId}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      parentId: event.target.value,
                    }))
                  }
                  className="field"
                >
                  <option value="">
                    Select {locationForm.type === "SHELF" ? "Rack" : "Shelf"}
                  </option>

                  {locations
                    .filter((location) =>
                      locationForm.type === "SHELF"
                        ? location.type === "RACK"
                        : location.type === "SHELF",
                    )
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </option>
                    ))}
                </select>
              </Field>
            )}

            <Field label="Location Name">
              <input
                required
                minLength={2}
                maxLength={100}
                value={locationForm.name}
                onChange={(event) =>
                  setLocationForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Rack A"
                className="field"
              />
            </Field>

            <Field label="Location Code">
              <input
                required
                minLength={2}
                maxLength={30}
                pattern="[A-Za-z0-9_-]+"
                value={locationForm.code}
                onChange={(event) =>
                  setLocationForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="e.g. RACK-A"
                className="field"
              />
            </Field>

            <DialogActions
              onCancel={() => setLocationDialog(false)}
              loading={isLocationSaving}
              submitLabel={editingLocation ? "Save Changes" : "Create Location"}
            />
          </form>
        </Dialog>
      )}
    </div>
  );
}

/* ---------- Reusable UI ---------- */

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ActionButton({
  children,
  title,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function LocationRow({
  location,
  level,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  canManage,
  canExpand,
}: {
  location: WarehouseLocation;
  level: number;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
  canExpand: boolean;
}) {
  const Icon =
    location.type === "RACK"
      ? Layers3
      : location.type === "SHELF"
        ? Boxes
        : Package;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 sm:px-5"
      style={{ paddingLeft: `${20 + level * 30}px` }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          disabled={!canExpand}
          onClick={onToggle}
          className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{location.name}</p>
          <p className="text-xs text-muted-foreground">
            {location.code} · {location.type}
            {location._count?.children
              ? ` · ${location._count.children} children`
              : ""}
          </p>
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          {location.type !== "BIN" && (
            <ActionButton
              title={`Add ${location.type === "RACK" ? "Shelf" : "Bin"}`}
              onClick={onAdd}
            >
              <Plus className="size-4" />
            </ActionButton>
          )}
          <ActionButton title="Edit location" onClick={onEdit}>
            <Pencil className="size-4" />
          </ActionButton>
          <ActionButton title="Delete location" onClick={onDelete} danger>
            <Trash2 className="size-4" />
          </ActionButton>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Dialog({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function DialogActions({
  onCancel,
  loading,
  submitLabel,
}: {
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border bg-card p-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
      {message}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <WarehouseIcon className="mx-auto size-9 text-muted-foreground/50" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
