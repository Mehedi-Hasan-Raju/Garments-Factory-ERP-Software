export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface PurchaseOrderProduct {
  id: string;
  name: string;
  sku: string;
  category?: { id: string; name: string };
  unit?: { id: string; name: string; code: string };
}

export interface PurchaseOrderSupplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  companyName: string;
}

export interface PurchaseOrderWarehouse {
  id: string;
  name: string;
  code: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantity: string | number;
  receivedQuantity: string | number;
  unitPrice: string | number;
  lineTotal: string | number;
  notes: string | null;
  product: PurchaseOrderProduct;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  supplier: PurchaseOrderSupplier;
  warehouse: PurchaseOrderWarehouse;
  orderDate: string;
  expectedDeliveryDate: string | null;
  status: PurchaseOrderStatus;
  subtotal: string | number;
  discount: string | number;
  tax: string | number;
  totalAmount: string | number;
  notes: string | null;
  termsAndConditions: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreatePurchaseOrderInput {
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  discount: number;
  tax: number;
  notes?: string;
  termsAndConditions?: string;
  items: PurchaseOrderItemInput[];
}

export interface UpdatePurchaseOrderInput {
  expectedDeliveryDate?: string;
  discount?: number;
  tax?: number;
  notes?: string | null;
  termsAndConditions?: string | null;
  items?: PurchaseOrderItemInput[];
}

export interface PurchaseOrderListParams {
  search?: string;
  status?: PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface PurchaseOrderPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseOrderListData {
  purchaseOrders: PurchaseOrder[];
  pagination: PurchaseOrderPagination;
}

export interface ReceivePurchaseOrderItemInput {
  purchaseOrderItemId: string;
  quantity: number;
  locationId: string;
  batchNo: string;
  expiryDate?: string;
  description?: string;
}

export interface ReceivePurchaseOrderInput {
  items: ReceivePurchaseOrderItemInput[];
}
