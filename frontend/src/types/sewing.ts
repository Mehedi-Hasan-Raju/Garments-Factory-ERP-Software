export interface SewingProductionOrder {
  id: string;
  orderNumber: string;
  styleNumber: string | null;
  status: string;
  orderQuantity: number | string;
  cuttingQuantity: number | string;
  sewingQuantity: number | string;
}

export interface SewingEntry {
  id: string;
  sewingNumber: string;
  productionOrderId: string;
  sewingDate: string;
  sewingLine: string | null;
  sewingQuantity: number | string;
  notes: string | null;
  productionOrder?: SewingProductionOrder;
  createdAt?: string;
  updatedAt?: string;
}

export interface SewingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  productionOrderId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface SewingPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SewingListResponse {
  success: boolean;
  message: string;
  data: SewingEntry[];
  pagination: SewingPagination;
}

export interface SewingResponse {
  success: boolean;
  message: string;
  data: SewingEntry;
}

export interface CreateSewingInput {
  sewingNumber: string;
  productionOrderId: string;
  sewingDate?: string;
  sewingLine?: string | null;
  sewingQuantity: number;
  notes?: string | null;
}

export interface UpdateSewingInput {
  sewingNumber?: string;
  sewingDate?: string;
  sewingLine?: string | null;
  sewingQuantity?: number;
  notes?: string | null;
}

export interface SewingSummary {
  id: string;
  orderNumber: string;
  styleNumber: string | null;
  status: string;
  orderQuantity: number | string;
  cuttingQuantity: number | string;
  sewingQuantity: number | string;
  sewingEntries: SewingEntry[];
  remainingSewingCapacity: number | string;
  sewingProgressPercentage: number;
}

export interface SewingSummaryResponse {
  success: boolean;
  message: string;
  data: SewingSummary;
}
