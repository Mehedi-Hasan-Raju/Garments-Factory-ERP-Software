export type ProductionStatus =
  | "PENDING"
  | "CUTTING"
  | "SEWING"
  | "QC"
  | "COMPLETED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type ShipmentStatus =
  | "NOT_SHIPPED"
  | "READY"
  | "PARTIALLY_SHIPPED"
  | "SHIPPED"
  | "DELIVERED";

export interface ProductionOrder {
  id: string;
  orderNumber: string;

  buyingHouseId: string;
  buyerId: string;
  productId: string;

  styleNumber: string;
  designImageUrl: string | null;

  orderQuantity: string;
  fabricRequirement: string;
  fabricRequirementUnit: string;

  cuttingQuantity: string;
  sewingQuantity: string;
  rejectedQuantity: string;
  finishedGoodsQuantity: string;

  targetPrice: string;
  orderValue: string;
  currency: string;

  paymentTerms: string | null;

  orderDate: string;
  deliveryDate: string;

  status: ProductionStatus;
  shipmentStatus: ShipmentStatus;

  notes: string | null;

  createdById: string;
  createdAt: string;
  updatedAt: string;

  buyingHouse: {
    id: string;
    code?: string;
    name: string;
    companyName?: string;
  };

  buyer: {
    id: string;
    buyerCode?: string;
    name: string;
    companyName?: string | null;
  };

  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface ProductionOrderQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ProductionStatus;
  shipmentStatus?: ShipmentStatus;
  buyingHouseId?: string;
  buyerId?: string;
  productId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ProductionOrderPayload {
  orderNumber: string;
  buyingHouseId: string;
  buyerId: string;
  productId: string;
  styleNumber: string;
  designImageUrl?: string | null;
  orderQuantity: number;
  fabricRequirement: number;
  fabricRequirementUnit: string;
  targetPrice: number;
  currency: string;
  paymentTerms?: string | null;
  orderDate?: string;
  deliveryDate: string;
  notes?: string | null;
}

export interface ProductionProgressPayload {
  cuttingQuantity?: number;
  sewingQuantity?: number;
  rejectedQuantity?: number;
  finishedGoodsQuantity?: number;
}

export interface ProductionOrderPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductionOrderListResponse {
  success: boolean;
  message: string;
  data: ProductionOrder[];
  pagination: ProductionOrderPagination;
}

export interface ProductionOrderResponse {
  success: boolean;
  message: string;
  data: ProductionOrder;
}

export interface BuyingHouseOption {
  id: string;
  code: string;
  name: string;
  companyName: string;
}

export interface BuyerOption {
  id: string;
  buyerCode: string;
  name: string;
  buyingHouseId: string;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
}