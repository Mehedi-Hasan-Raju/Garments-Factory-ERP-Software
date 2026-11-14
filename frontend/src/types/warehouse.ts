
export type LocationType = "RACK" | "SHELF" | "BIN";

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    locations: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  warehouseId: string;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    code: string;
    type: LocationType;
  } | null;
  _count?: {
    children: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WarehouseListResponse {
  warehouses: Warehouse[];
  pagination: Pagination;
}

export interface LocationListResponse {
  locations: WarehouseLocation[];
  pagination: Pagination;
}

export interface WarehouseQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface LocationQuery {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  type?: LocationType;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  description?: string | null;
}

export interface UpdateWarehouseInput {
  name?: string;
  code?: string;
  description?: string | null;
}

export interface CreateLocationInput {
  name: string;
  code: string;
  type: LocationType;
  warehouseId: string;
  parentId?: string | null;
}

export interface UpdateLocationInput {
  name?: string;
  code?: string;
  type?: LocationType;
  parentId?: string | null;
}
