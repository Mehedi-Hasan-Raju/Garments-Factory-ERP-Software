export type ProductionStatus =
  | "PENDING"
  | "CUTTING"
  | "SEWING"
  | "QC"
  | "COMPLETED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface DashboardProduction {
  totalOrders: number;
  byStatus: Partial<Record<ProductionStatus, number>>;
  cuttingQuantity: string;
  sewingQuantity: string;
  rejectedQuantity: string;
}

export interface DashboardInventory {
  productCount: number;
  warehouseCount: number;
  stockRecordCount: number;
  totalStockQuantity: string;
  lowStockCount: number;
}

export interface RecentProductionOrder {
  id: string;
  orderNumber: string;
  styleNumber: string;
  status: ProductionStatus;
  shipmentStatus: string;
  orderQuantity: string;
  deliveryDate: string;
  createdAt: string;
  buyingHouse: {
    name: string;
  };
  product: {
    name: string;
    sku: string;
  };
}

export interface RecentStockMovement {
  id: string;
  movementNo: string;
  type: string;
  quantity: string;
  referenceNo: string | null;
  createdAt: string;
  product: {
    name: string;
    sku: string;
  };
  fromLocation: {
    name: string;
    code: string;
  } | null;
  toLocation: {
    name: string;
    code: string;
  } | null;
}

export interface DashboardOverview {
  role: string;
  generatedAt: string;
  range: "7d" | "30d" | "90d";
  data: {
    users?: { total: number };
    employees?: { total?: number; active?: number };
    departments?: { active: number };
    managers?: { active: number };
    warehouses?: { active: number };
    products?: { active: number };
    inventory?: DashboardInventory;
    production?: DashboardProduction | {
      activeOrders: number;
    };
    purchasing?: {
      totalPurchaseOrders: number;
      pendingApproval?: number;
    };
    shipments?: number | Record<string, number>;
    recent?: {
      productionOrders?: RecentProductionOrder[];
      stockMovements?: RecentStockMovement[];
    };
    notifications?: {
      unreadCount: number;
      recentNotifications: Array<{
        id: string;
        title: string;
        message: string;
        type: string;
        actionUrl: string | null;
        isRead: boolean;
        createdAt: string;
      }>;
    };
    [key: string]: unknown;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}