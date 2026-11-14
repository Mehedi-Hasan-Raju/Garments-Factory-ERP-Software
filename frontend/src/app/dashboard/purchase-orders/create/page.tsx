
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  Package,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";

type Supplier = {
  id: string;
  supplierCode: string;
  supplierName: string;
  companyName: string;
  isActive: boolean;
};

type Warehouse = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
  unit?: {
    name: string;
    code?: string;
  };
  category?: {
    name: string;
  };
};

type PurchaseItem = {
  productId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

function extractArray<T>(response: unknown): T[] {
  const body = response as {
    data?: T[] | Record<string, unknown>;
  };

  if (Array.isArray(body?.data)) {
    return body.data as T[];
  }

  if (body?.data && typeof body.data === "object") {
    const values = Object.values(body.data);
    const array = values.find(Array.isArray);
    if (array) return array as T[];
  }

  return [];
}

const createEmptyItem = (): PurchaseItem => ({
  productId: "",
  quantity: "1",
  unitPrice: "0",
  notes: "",
});

const inputClass =
  "h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/15 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:disabled:bg-gray-800";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [poNumber, setPoNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([
    createEmptyItem(),
  ]);

  // Suppliers
  const suppliersQuery = useQuery({
    queryKey: ["purchase-order-suppliers"],
    queryFn: async () => {
      const response = await apiClient.get("/suppliers", {
        params: { page: 1, limit: 100, isActive: true },
      });
      return extractArray<Supplier>(response.data);
    },
  });

  // Warehouses
  const warehousesQuery = useQuery({
    queryKey: ["purchase-order-warehouses"],
    queryFn: async () => {
      const response = await apiClient.get("/warehouses", {
        params: { page: 1, limit: 100, isActive: true },
      });
      return extractArray<Warehouse>(response.data);
    },
  });

  // Products
  const productsQuery = useQuery({
    queryKey: ["purchase-order-products"],
    queryFn: async () => {
      const response = await apiClient.get("/products", {
        params: {
          page: 1,
          limit: 100,
          isActive: true,
          sortBy: "name",
          sortOrder: "asc",
        },
      });
      return extractArray<Product>(response.data);
    },
  });

  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Math.max(0, Number(item.quantity) || 0) *
            Math.max(0, Number(item.unitPrice) || 0),
        0,
      ),
    [items],
  );

  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxAmount = Math.max(0, Number(tax) || 0);
  const totalAmount = subtotal - discountAmount + taxAmount;

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        poNumber: poNumber.trim(),
        supplierId,
        warehouseId,
        orderDate,
        ...(expectedDeliveryDate && {
          expectedDeliveryDate,
        }),
        discount: discountAmount,
        tax: taxAmount,
        ...(notes.trim() && { notes: notes.trim() }),
        ...(termsAndConditions.trim() && {
          termsAndConditions: termsAndConditions.trim(),
        }),
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          ...(item.notes.trim() && {
            notes: item.notes.trim(),
          }),
        })),
      };

      const response = await apiClient.post<
        ApiResponse<{ purchaseOrder?: { id: string }; id?: string }>
      >("/purchase-orders", payload);

      return response.data;
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["purchase-orders"],
      });

      toast.success(
        response.message || "Purchase order created successfully",
      );

      const purchaseOrderId =
        response.data?.purchaseOrder?.id ??
        response.data?.id;

      if (purchaseOrderId) {
        router.push(`/dashboard/purchase-orders/${purchaseOrderId}`);
      } else {
        router.push("/dashboard/purchase-orders");
      }
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      toast.error(
        axiosError.response?.data?.message ||
          "Failed to create purchase order. Please try again.",
      );
    },
  });

  function updateItem(
    index: number,
    field: keyof PurchaseItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, createEmptyItem()]);
  }

  function removeItem(index: number) {
    if (items.length === 1) {
      toast.error("At least one product item is required");
      return;
    }

    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function validateForm() {
    if (!poNumber.trim() || poNumber.trim().length < 2) {
      toast.error("Enter a valid PO number");
      return false;
    }

    if (!supplierId) {
      toast.error("Please select a supplier");
      return false;
    }

    if (!warehouseId) {
      toast.error("Please select a warehouse");
      return false;
    }

    if (!orderDate) {
      toast.error("Please select the order date");
      return false;
    }

    if (
      expectedDeliveryDate &&
      expectedDeliveryDate < orderDate
    ) {
      toast.error(
        "Expected delivery date cannot be before order date",
      );
      return false;
    }

    if (items.length === 0) {
      toast.error("Add at least one product");
      return false;
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      if (!item.productId) {
        toast.error(`Select a product in item ${index + 1}`);
        return false;
      }

      if (
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        toast.error(`Enter a valid quantity in item ${index + 1}`);
        return false;
      }

      if (
        !Number.isFinite(Number(item.unitPrice)) ||
        Number(item.unitPrice) < 0
      ) {
        toast.error(`Enter a valid unit price in item ${index + 1}`);
        return false;
      }
    }

    if (discountAmount > subtotal) {
      toast.error("Discount cannot exceed subtotal");
      return false;
    }

    if (totalAmount < 0) {
      toast.error("Total amount cannot be negative");
      return false;
    }

    return true;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createMutation.isPending) return;
    if (!validateForm()) return;

    createMutation.mutate();
  }

  const isLoadingOptions =
    suppliersQuery.isLoading ||
    warehousesQuery.isLoading ||
    productsQuery.isLoading;

  const optionsError =
    suppliersQuery.isError ||
    warehousesQuery.isError ||
    productsQuery.isError;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/purchase-orders")}
            className="mt-1 rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Create Purchase Order
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new supplier purchase order.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
          <ShoppingCart size={14} />
          New Purchase
        </span>
      </div>

      {isLoadingOptions ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="text-center">
            <Loader2 className="mx-auto animate-spin text-[#6B9B70]" size={28} />
            <p className="mt-3 text-sm text-gray-500">
              Loading suppliers, warehouses and products...
            </p>
          </div>
        </div>
      ) : optionsError ? (
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-gray-950">
          <p className="font-medium text-red-600">
            Failed to load purchase order data.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Check your API connection and access permissions.
          </p>
          <button
            type="button"
            onClick={() => {
              void suppliersQuery.refetch();
              void warehousesQuery.refetch();
              void productsQuery.refetch();
            }}
            className="mt-4 rounded-lg bg-[#6B9B70] px-4 py-2 text-sm font-medium text-white hover:bg-[#58845D]"
          >
            Retry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="rounded-lg bg-green-50 p-2 text-[#6B9B70] dark:bg-green-950">
                <ShoppingCart size={19} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  General Information
                </h2>
                <p className="text-xs text-gray-500">
                  Basic purchase order details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  placeholder="e.g. PO-2026-001"
                  maxLength={50}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Supplier <span className="text-red-500">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.supplierName} ({supplier.supplierCode})
                    </option>
                  ))}
                </select>
                {suppliers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No active suppliers found. Create a supplier first.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(event) => setWarehouseId(event.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
                </select>
                {warehouses.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No active warehouses found. Create a warehouse first.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Order Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(event) => setOrderDate(event.target.value)}
                    className={`${inputClass} pl-10`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  min={orderDate}
                  value={expectedDeliveryDate}
                  onChange={(event) =>
                    setExpectedDeliveryDate(event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Product Items */}
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-green-50 p-2 text-[#6B9B70] dark:bg-green-950">
                  <Package size={19} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Purchase Items
                  </h2>
                  <p className="text-xs text-gray-500">
                    Add products and their purchase quantities
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#6B9B70] px-3 py-2 text-sm font-medium text-[#58845D] transition hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {products.length === 0 && (
              <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                No active products found. Create products before creating a purchase order.
              </div>
            )}

            <div className="space-y-4">
              {items.map((item, index) => {
                const selectedProduct = products.find(
                  (product) => product.id === item.productId,
                );

                const lineTotal =
                  (Number(item.quantity) || 0) *
                  (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-xs font-semibold text-[#58845D] dark:bg-green-950">
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                          Item {index + 1}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        title="Remove item"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label className={labelClass}>
                          Product <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(index, "productId", event.target.value)
                          }
                          className={inputClass}
                          required
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} — {product.sku}
                            </option>
                          ))}
                        </select>

                        {selectedProduct && (
                          <p className="mt-1 text-xs text-gray-500">
                            {selectedProduct.category?.name ?? "Uncategorized"}
                            {selectedProduct.unit?.name
                              ? ` · Unit: ${selectedProduct.unit.name}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={labelClass}>
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
                          className={inputClass}
                          required
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Unit Price (৳) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(index, "unitPrice", event.target.value)
                          }
                          className={inputClass}
                          required
                        />
                      </div>

                      <div className="md:col-span-2 lg:col-span-4">
                        <label className={labelClass}>Item Notes</label>
                        <input
                          value={item.notes}
                          onChange={(event) =>
                            updateItem(index, "notes", event.target.value)
                          }
                          placeholder="Optional item notes"
                          maxLength={2000}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
                      <p className="text-sm text-gray-500">
                        Line Total:{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatMoney(lineTotal)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Additional Information and Summary */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 lg:col-span-3 md:p-6">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Additional Information
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Optional purchase notes and terms
                </p>
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Write additional purchase information..."
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#6B9B70] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Terms and Conditions
                </label>
                <textarea
                  value={termsAndConditions}
                  onChange={(event) =>
                    setTermsAndConditions(event.target.value)
                  }
                  rows={4}
                  maxLength={10000}
                  placeholder="Enter purchase terms and conditions..."
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#6B9B70] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </section>

            <section className="h-fit rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 lg:col-span-2 md:p-6">
              <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatMoney(subtotal)}
                  </span>
                </div>

                <div>
                  <label className={labelClass}>Discount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Tax (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(event) => setTax(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-[#58845D]">
                      {formatMoney(totalAmount)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Subtotal − Discount + Tax
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/dashboard/purchase-orders")}
              disabled={createMutation.isPending}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                products.length === 0 ||
                suppliers.length === 0 ||
                warehouses.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B9B70] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#58845D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Purchase Order
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
