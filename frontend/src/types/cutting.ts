
export interface CuttingProductionOrder {
  id: string;
  orderNumber: string;
  styleNumber: string | null;
  orderQuantity: number | string;
  cuttingQuantity: number | string;
  status: string;
}

export interface CuttingEntry {
  id: string;
  cuttingNumber: string;
  productionOrderId: string;
  cuttingDate: string;
  cuttingQuantity: number | string;
  fabricConsumed: number | string;
  fabricConsumedUnit: string;
  notes: string | null;
  productionOrder?: CuttingProductionOrder;
  createdAt?: string;
  updatedAt?: string;
}

export interface CuttingQueryParams {
  productionOrderId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface CuttingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CuttingListResponse {
  success: boolean;
  message: string;
  data: CuttingEntry[];
  pagination: CuttingPagination;
}

export interface CuttingResponse {
  success: boolean;
  message: string;
  data: CuttingEntry;
}

export interface CreateCuttingInput {
  cuttingNumber: string;
  productionOrderId: string;
  cuttingDate?: string;
  cuttingQuantity: number;
  fabricConsumed: number;
  fabricConsumedUnit: string;
  notes?: string | null;
}

export interface UpdateCuttingInput {
  cuttingDate?: string;
  cuttingQuantity?: number;
  fabricConsumed?: number;
  fabricConsumedUnit?: string;
  notes?: string | null;
}

export interface CuttingSummary {
  productionOrder: CuttingProductionOrder;
  totalEntries: number;
  totalCuttingQuantity: number | string;
  totalFabricConsumed: number | string;
  remainingQuantity: number | string;
}
