export type StockMovementType =
  | "RECEIVE"
  | "ISSUE"
  | "TRANSFER"
  | "ADJUSTMENT";

export type Stock = {
  id: string;
  productId: string;
  locationId: string;
  batchLotId: string;
  quantity: string | number;
  minimumStock: string | number;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category?: { id: string; name: string } | null;
    unit?: { id: string; name: string; code?: string } | null;
  };
  location: {
    id: string;
    name: string;
    code: string;
    type: "RACK" | "SHELF" | "BIN";
    warehouseId?: string;
  };
  batchLot: {
    id: string;
    batchNo: string;
    expiryDate?: string | null;
  };
};

export type StockMovement = {
  id: string;
  movementNo: string;
  type: StockMovementType;
  quantity: string | number;
  referenceNo?: string | null;
  note?: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  batchLot: { id: string; batchNo: string };
  fromLocation?: { id: string; name: string; code: string } | null;
  toLocation?: { id: string; name: string; code: string } | null;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type StockListResponse = {
  stocks: Stock[];
  pagination: Pagination;
};

export type HistoryResponse = {
  movements: StockMovement[];
  pagination: Pagination;
};

export type ProductOption = {
  id: string;
  name: string;
  sku: string;
  isActive: boolean;
};

export type LocationOption = {
  id: string;
  name: string;
  code: string;
  type: "RACK" | "SHELF" | "BIN";
  warehouseId: string;
};

export type BatchOption = {
  id: string;
  batchNo: string;
  productId: string;
};

export type StockQuery = {
  page: number;
  limit: number;
  search?: string;
  locationId?: string;
  productId?: string;
};

export type HistoryQuery = {
  page: number;
  limit: number;
  type?: StockMovementType;
  referenceNo?: string;
};

export type ReceiveStockInput = {
  productId: string;
  locationId: string;
  batchNo: string;
  quantity: number;
  minimumStock?: number;
  expiryDate?: string;
  referenceNo?: string;
  note?: string;
};

export type IssueStockInput = {
  productId: string;
  locationId: string;
  batchLotId: string;
  quantity: number;
  referenceNo?: string;
  note?: string;
};

export type TransferStockInput = {
  productId: string;
  batchLotId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  referenceNo?: string;
  note?: string;
};

export type AdjustmentStockInput = {
  productId: string;
  locationId: string;
  batchLotId: string;
  direction: "INCREASE" | "DECREASE";
  quantity: number;
  referenceNo?: string;
  note?: string;
};

export type CountStockInput = {
  productId: string;
  locationId: string;
  batchLotId: string;
  actualQuantity: number;
  referenceNo?: string;
  note?: string;
};
