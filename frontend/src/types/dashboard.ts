import type { UserRole } from "@/types/auth";

export type DashboardRange = "7d" | "30d" | "90d";

export interface DashboardQuery {
  range: DashboardRange;
  recentLimit: number;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardNotifications {
  unreadCount: number;
  recentNotifications: DashboardNotification[];
}

export interface RecentProductionOrder {
  id: string;
  orderNumber: string;
  styleNumber: string;
  status: string;
  shipmentStatus: string;
  orderQuantity: number;
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

export interface OwnerDashboardData {
  users: {
    total: number;
  };
  employees: {
    total: number;
    active: number;
  };
  departments: {
    active: number;
  };
  inventory: {
    productCount: number;
    warehouseCount: number;
    stockRecordCount: number;
    totalStockQuantity: string;
    lowStockCount: number;
  };
  production: {
    totalOrders: number;
    byStatus: Record<string, number>;
    cuttingQuantity: string;
    sewingQuantity: string;
    rejectedQuantity: string;
  };
  purchasing: {
    totalPurchaseOrders: number;
    pendingApproval: number;
  };
  shipments: {
    total: number;
  };
  recent: {
    productionOrders: RecentProductionOrder[];
    stockMovements: RecentStockMovement[];
  };
  notifications: DashboardNotifications;
}

export interface DashboardOverviewResponse<T> {
  role: UserRole;
  generatedAt: string;
  range: DashboardRange;
  data: T;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}