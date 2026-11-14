
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  Loader2,
  X,
  Package,
  MapPin,
  Hash,
  FileText,
  Warehouse,
} from "lucide-react";

import {
  useInventoryProducts,
  useBinLocations,
  useInventoryStock,
  useReceiveStock,
  useIssueStock,
  useTransferStock,
  useAdjustStock,
  useCountStock,
} from "@/hooks/use-inventory";

import type {
  Stock,
  ReceiveStockInput,
  IssueStockInput,
  TransferStockInput,
  AdjustmentStockInput,
  CountStockInput,
} from "@/types/inventory";

type Operation =
  | "receive"
  | "issue"
  | "transfer"
  | "adjustment"
  | "count";

const operations = [
  {
    id: "receive",
    title: "Receive Stock",
    description: "Add incoming stock to a BIN location.",
    icon: ArrowDownToLine,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "hover:border-emerald-500/50",
  },
  {
    id: "issue",
    title: "Issue Stock",
    description: "Issue stock from an existing batch.",
    icon: ArrowUpFromLine,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "hover:border-orange-500/50",
  },
  {
    id: "transfer",
    title: "Transfer Stock",
    description: "Move stock between BIN locations.",
    icon: ArrowLeftRight,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "hover:border-blue-500/50",
  },
  {
    id: "adjustment",
    title: "Stock Adjustment",
    description: "Increase or decrease stock.",
    icon: SlidersHorizontal,
    color: "text-violet-600",
    bg: "bg-violet-500/10",
    border: "hover:border-violet-500/50",
  },
  {
    id: "count",
    title: "Physical Count",
    description: "Reconcile actual stock quantity.",
    icon: ClipboardCheck,
    color: "text-cyan-600",
    bg: "bg-cyan-500/10",
    border: "hover:border-cyan-500/50",
  },
] as const;

const initialForm = {
  productId: "",
  locationId: "",
  fromLocationId: "",
  toLocationId: "",
  batchLotId: "",
  batchNo: "",
  quantity: "",
  actualQuantity: "",
  minimumStock: "",
  expiryDate: "",
  direction: "INCREASE" as "INCREASE" | "DECREASE",
  referenceNo: "",
  note: "",
};

type FormState = typeof initialForm;

export default function StockOperationPanel() {
  const [selected, setSelected] = useState<Operation | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [batchChoice, setBatchChoice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productsQuery = useInventoryProducts();
  const locationsQuery = useBinLocations();

  const selectedLocationId =
    selected === "transfer" ? form.fromLocationId : form.locationId;

  const stockQuery = useInventoryStock({
    page: 1,
    limit: 100,
    productId: form.productId || undefined,
  });

  const batchStockQuery = useInventoryStock(
    {
      page: 1,
      limit: 100,
      productId: form.productId || undefined,
      locationId: selectedLocationId || undefined,
    },
    Boolean(form.productId && selectedLocationId),
  );

  const receiveMutation = useReceiveStock();
  const issueMutation = useIssueStock();
  const transferMutation = useTransferStock();
  const adjustmentMutation = useAdjustStock();
  const countMutation = useCountStock();

  const products = productsQuery.data ?? [];
  const locations = locationsQuery.data ?? [];
  const stocks = stockQuery.data?.stocks ?? [];

  const existingBatches = useMemo(() => {
    const batchStocks = batchStockQuery.data?.stocks ?? [];
    const uniqueBatches = new Map<string, { id: string; batchNo: string }>();

    for (const stock of batchStocks) {
      uniqueBatches.set(stock.batchLot.id, {
        id: stock.batchLot.id,
        batchNo: stock.batchLot.batchNo,
      });
    }

    return Array.from(uniqueBatches.values());
  }, [batchStockQuery.data?.stocks]);

  const selectedProductStocks = useMemo(
    () =>
      stocks.filter(
        (stock) =>
          stock.productId === form.productId &&
          Number(stock.quantity) > 0,
      ),
    [stocks, form.productId],
  );

  const availableBatches = useMemo(() => {
    const unique = new Map<string, Stock>();

    selectedProductStocks.forEach((stock) => {
      if (!unique.has(stock.batchLotId)) {
        unique.set(stock.batchLotId, stock);
      }
    });

    return [...unique.values()];
  }, [selectedProductStocks]);

  const close = () => {
    if (submitting) return;
    setSelected(null);
    setForm(initialForm);
    setBatchChoice("");
  };

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "productId"
        ? {
            batchLotId: "",
            locationId: "",
            fromLocationId: "",
            toLocationId: "",
          }
        : {}),
      ...(key === "locationId" ? { batchLotId: "" } : {}),
      ...(key === "fromLocationId" ? { batchLotId: "" } : {}),
    }));
  };

  const validate = (): string | null => {
    if (!form.productId) return "Please select a product.";

    if (selected === "receive") {
      if (!form.locationId) return "Please select a BIN location.";
      if (!form.batchNo.trim()) return "Batch number is required.";
      if (!Number(form.quantity) || Number(form.quantity) <= 0) {
        return "Quantity must be greater than zero.";
      }
      if (form.minimumStock && Number(form.minimumStock) < 0) {
        return "Minimum stock cannot be negative.";
      }
    }

    if (
      selected === "issue" ||
      selected === "adjustment" ||
      selected === "count"
    ) {
      if (!form.locationId) return "Please select a BIN location.";
      if (!form.batchLotId) return "Please select a batch.";
    }

    if (selected === "transfer") {
      if (!form.fromLocationId || !form.toLocationId) {
        return "Please select both locations.";
      }
      if (form.fromLocationId === form.toLocationId) {
        return "Source and destination must be different.";
      }
      if (!form.batchLotId) return "Please select a batch.";
    }

    if (
      selected === "issue" ||
      selected === "transfer" ||
      selected === "adjustment"
    ) {
      if (!Number(form.quantity) || Number(form.quantity) <= 0) {
        return "Quantity must be greater than zero.";
      }
    }

    if (selected === "count") {
      if (
        form.actualQuantity === "" ||
        Number(form.actualQuantity) < 0
      ) {
        return "Actual quantity cannot be negative.";
      }
    }

    return null;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || submitting) return;

    const validationError = validate();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const optionalFields = {
      ...(form.referenceNo.trim()
        ? { referenceNo: form.referenceNo.trim() }
        : {}),
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    };

    setSubmitting(true);

    try {
      if (selected === "receive") {
        const payload: ReceiveStockInput = {
          productId: form.productId,
          locationId: form.locationId,
          batchNo: form.batchNo.trim(),
          quantity: Number(form.quantity),
          ...(form.minimumStock !== ""
            ? { minimumStock: Number(form.minimumStock) }
            : {}),
          ...(form.expiryDate ? { expiryDate: form.expiryDate } : {}),
          ...optionalFields,
        };
        await receiveMutation.mutateAsync(payload);
      }

      if (selected === "issue") {
        const payload: IssueStockInput = {
          productId: form.productId,
          locationId: form.locationId,
          batchLotId: form.batchLotId,
          quantity: Number(form.quantity),
          ...optionalFields,
        };
        await issueMutation.mutateAsync(payload);
      }

      if (selected === "transfer") {
        const payload: TransferStockInput = {
          productId: form.productId,
          batchLotId: form.batchLotId,
          fromLocationId: form.fromLocationId,
          toLocationId: form.toLocationId,
          quantity: Number(form.quantity),
          ...optionalFields,
        };
        await transferMutation.mutateAsync(payload);
      }

      if (selected === "adjustment") {
        const payload: AdjustmentStockInput = {
          productId: form.productId,
          locationId: form.locationId,
          batchLotId: form.batchLotId,
          direction: form.direction,
          quantity: Number(form.quantity),
          ...optionalFields,
        };
        await adjustmentMutation.mutateAsync(payload);
      }

      if (selected === "count") {
        const payload: CountStockInput = {
          productId: form.productId,
          locationId: form.locationId,
          batchLotId: form.batchLotId,
          actualQuantity: Number(form.actualQuantity),
          ...optionalFields,
        };
        await countMutation.mutateAsync(payload);
      }

      toast.success("Stock operation completed successfully.");
      setSelected(null);
      setForm(initialForm);
      setBatchChoice("");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Stock operation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = productsQuery.isLoading || locationsQuery.isLoading;
  const isReadError = productsQuery.isError || locationsQuery.isError;

  const showBatch =
    selected === "issue" ||
    selected === "transfer" ||
    selected === "adjustment" ||
    selected === "count";

  const batchLocationId =
    selected === "transfer" ? form.fromLocationId : form.locationId;

  const batchesForLocation = availableBatches.filter(
    (stock) => stock.locationId === batchLocationId,
  );

  const activeOperation = operations.find((item) => item.id === selected);
  const ActiveIcon = activeOperation?.icon;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Stock Operations
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose an operation to manage your inventory.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {operations.map((operation) => {
          const Icon = operation.icon;

          return (
            <button
              key={operation.id}
              type="button"
              onClick={() => {
                setForm(initialForm);
                setBatchChoice("");
                setSelected(operation.id);
              }}
              className={`group rounded-xl border bg-card p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${operation.border}`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex size-11 items-center justify-center rounded-xl ${operation.bg} ${operation.color}`}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-muted-foreground transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>

              <p className="mt-4 font-semibold tracking-tight">
                {operation.title}
              </p>
              <p className="mt-1.5 min-h-10 text-xs leading-5 text-muted-foreground">
                {operation.description}
              </p>
            </button>
          );
        })}
      </div>

      {selected && activeOperation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[3px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) close();
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b px-6 py-5 sm:px-8">
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${activeOperation.bg} ${activeOperation.color}`}
                >
                  {ActiveIcon && <ActiveIcon className="size-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">
                    {activeOperation.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeOperation.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={close}
                disabled={submitting}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-7 overflow-y-auto px-6 py-7 sm:px-8">
                {isLoading && (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Loading products and locations...
                  </div>
                )}

                {isReadError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Could not load products or BIN locations. Please refresh and try again.
                  </div>
                )}

                <FormSection
                  title="Product Information"
                  description="Select the product for this stock operation."
                  icon={Package}
                >
                  <div className="grid gap-5">
                    <Field label="Product" required>
                      <select
                        required
                        value={form.productId}
                        onChange={(event) => {
                          update("productId", event.target.value);
                          update("batchNo", "");
                          setBatchChoice("");
                        }}
                        className="field"
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </FormSection>

                {selected === "receive" && (
                  <FormSection
                    title="Receiving Details"
                    description="Specify where the incoming stock will be stored."
                    icon={Warehouse}
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      <LocationSelect
                        label="Destination BIN"
                        value={form.locationId}
                        locations={locations}
                        onChange={(value) => update("locationId", value)}
                      />

                      <Field label="Quantity" required>
                        <input
                          required
                          type="number"
                          min="0.000001"
                          step="any"
                          placeholder="Enter quantity"
                          value={form.quantity}
                          onChange={(event) =>
                            update("quantity", event.target.value)
                          }
                          className="field"
                        />
                      </Field>

                      <div className="space-y-2 md:col-span-2">
                        <Field label="Batch Number" required>
                          <select
                            className="field"
                            value={batchChoice}
                            disabled={
                              !form.productId || batchStockQuery.isLoading
                            }
                            onChange={(event) => {
                              const value = event.target.value;
                              setBatchChoice(value);
                              update(
                                "batchNo",
                                value === "__new__" ? "" : value,
                              );
                            }}
                          >
                            <option value="">
                              {batchStockQuery.isLoading
                                ? "Loading batches..."
                                : "Select a batch number"}
                            </option>
                            {existingBatches.map((batch) => (
                              <option key={batch.id} value={batch.batchNo}>
                                {batch.batchNo}
                              </option>
                            ))}
                            <option value="__new__">
                              + Create New Batch Number
                            </option>
                          </select>
                        </Field>

                        {batchChoice === "__new__" && (
                          <input
                            className="field"
                            type="text"
                            placeholder="Enter new batch number"
                            value={form.batchNo}
                            onChange={(event) =>
                              update("batchNo", event.target.value)
                            }
                            maxLength={100}
                            required
                          />
                        )}

                        {!form.productId && (
                          <p className="text-xs text-muted-foreground">
                            Select a product first.
                          </p>
                        )}

                        {form.productId &&
                          !batchStockQuery.isLoading &&
                          existingBatches.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No existing batches found. Create a new batch.
                            </p>
                          )}
                      </div>

                      <Field label="Minimum Stock">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Optional minimum stock"
                          value={form.minimumStock}
                          onChange={(event) =>
                            update("minimumStock", event.target.value)
                          }
                          className="field"
                        />
                      </Field>

                      <Field label="Expiry Date">
                        <input
                          type="date"
                          value={form.expiryDate}
                          onChange={(event) =>
                            update("expiryDate", event.target.value)
                          }
                          className="field"
                        />
                      </Field>
                    </div>
                  </FormSection>
                )}

                {showBatch && (
                  <FormSection
                    title="Stock Location & Batch"
                    description="Choose the BIN and batch from which stock will be managed."
                    icon={MapPin}
                  >
                    <div className="grid gap-5 md:grid-cols-2">
                      {selected === "transfer" ? (
                        <>
                          <LocationSelect
                            label="Source BIN"
                            value={form.fromLocationId}
                            locations={locations}
                            onChange={(value) =>
                              update("fromLocationId", value)
                            }
                          />
                          <LocationSelect
                            label="Destination BIN"
                            value={form.toLocationId}
                            locations={locations}
                            onChange={(value) =>
                              update("toLocationId", value)
                            }
                          />
                        </>
                      ) : (
                        <div className="md:col-span-2">
                          <LocationSelect
                            label="BIN Location"
                            value={form.locationId}
                            locations={locations}
                            onChange={(value) =>
                              update("locationId", value)
                            }
                          />
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <Field label="Existing Batch" required>
                          <select
                            required
                            value={form.batchLotId}
                            onChange={(event) =>
                              update("batchLotId", event.target.value)
                            }
                            disabled={
                              !form.productId ||
                              !batchLocationId ||
                              batchStockQuery.isFetching
                            }
                            className="field"
                          >
                            <option value="">
                              {batchStockQuery.isFetching
                                ? "Loading available batches..."
                                : "Select batch"}
                            </option>
                            {batchesForLocation.map((stock) => (
                              <option
                                key={stock.batchLotId}
                                value={stock.batchLotId}
                              >
                                {stock.batchLot.batchNo} — Available:{" "}
                                {Number(stock.quantity).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        </Field>

                        {batchesForLocation.length === 0 &&
                          form.productId &&
                          batchLocationId &&
                          !batchStockQuery.isFetching && (
                            <p className="mt-2 text-xs text-amber-600">
                              No available batch found for this product and location.
                            </p>
                          )}
                      </div>
                    </div>
                  </FormSection>
                )}

                {(selected === "issue" ||
                  selected === "transfer" ||
                  selected === "adjustment") && (
                  <FormSection
                    title="Quantity Details"
                    description="Enter the quantity for this operation."
                    icon={Hash}
                  >
                    <div
                      className={`grid gap-5 ${
                        selected === "adjustment" ? "md:grid-cols-2" : ""
                      }`}
                    >
                      {selected === "adjustment" && (
                        <Field label="Adjustment Direction" required>
                          <select
                            value={form.direction}
                            onChange={(event) =>
                              update("direction", event.target.value)
                            }
                            className="field"
                          >
                            <option value="INCREASE">Increase</option>
                            <option value="DECREASE">Decrease</option>
                          </select>
                        </Field>
                      )}

                      <Field label="Quantity" required>
                        <input
                          required
                          type="number"
                          min="0.000001"
                          step="any"
                          placeholder="Enter quantity"
                          value={form.quantity}
                          onChange={(event) =>
                            update("quantity", event.target.value)
                          }
                          className="field"
                        />
                      </Field>
                    </div>
                  </FormSection>
                )}

                {selected === "count" && (
                  <FormSection
                    title="Physical Count"
                    description="Enter the actual quantity found during the physical stock count."
                    icon={ClipboardCheck}
                  >
                    <Field label="Actual Physical Quantity" required>
                      <input
                        required
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Enter actual quantity"
                        value={form.actualQuantity}
                        onChange={(event) =>
                          update("actualQuantity", event.target.value)
                        }
                        className="field"
                      />
                    </Field>
                  </FormSection>
                )}

                <FormSection
                  title="Additional Information"
                  description="Add an optional reference number or note."
                  icon={FileText}
                >
                  <div className="grid gap-5">
                    <Field label="Reference Number">
                      <input
                        maxLength={100}
                        placeholder="Enter reference number (optional)"
                        value={form.referenceNo}
                        onChange={(event) =>
                          update("referenceNo", event.target.value)
                        }
                        className="field"
                      />
                    </Field>

                    <Field label="Note">
                      <textarea
                        maxLength={2000}
                        rows={4}
                        placeholder="Write any additional details..."
                        value={form.note}
                        onChange={(event) =>
                          update("note", event.target.value)
                        }
                        className="field min-h-28 resize-y"
                      />
                    </Field>
                  </div>
                </FormSection>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={close}
                  className="rounded-lg border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || isLoading || isReadError}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "Processing..." : "Confirm Operation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3 border-b pb-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="block text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function LocationSelect({
  label,
  value,
  locations,
  onChange,
}: {
  label: string;
  value: string;
  locations: {
    id: string;
    name: string;
    code: string;
    type: string;
  }[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} required>
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      >
        <option value="">Select BIN location</option>
        {locations
          .filter((location) => location.type === "BIN")
          .map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} ({location.code})
            </option>
          ))}
      </select>
    </Field>
  );
}
