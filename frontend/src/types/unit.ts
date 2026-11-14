export interface Unit {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export interface CreateUnitInput {
  name: string;
  code: string;
  description?: string | null;
}

export interface UpdateUnitInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UnitResponse {
  success: boolean;
  message: string;
  data: Unit;
}

export interface UnitListResponse {
  success: boolean;
  message: string;
  data: Unit[];
}
