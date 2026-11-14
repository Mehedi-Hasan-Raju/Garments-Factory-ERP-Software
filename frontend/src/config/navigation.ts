import type { LucideIcon } from "lucide-react";
import { Ruler,Package } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Building2,
  Warehouse,
  Boxes,
  ShoppingCart,
  ClipboardList,
  Scissors,
  Shirt,
  BadgeCheck,
  PackageCheck,
  Truck,
  Wallet,
  Receipt,
  BarChart3,
  ClipboardCheck,
  Bell,
  Settings,
  FolderTree,
} from "lucide-react";

import type { UserRole } from "@/types/auth";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

const dashboard = (role: UserRole): NavigationGroup => ({
  title: "Overview",
  items: [
    {
      label: "Dashboard",
      href: `/${role.toLowerCase()}/dashboard`,
      icon: LayoutDashboard,
    },
  ],
});

const comingSoon = true;

export const ROLE_NAVIGATION: Record<UserRole, NavigationGroup[]> = {
  OWNER: [
    dashboard("OWNER"),
    {
      title: "Organization",
      items: [
        { label: "Users", href: "/users", icon: Users, disabled: comingSoon },
        { label: "Employees", href: "/employees", icon: UserRound, disabled: comingSoon },
        { label: "Departments", href: "/departments", icon: Building2, disabled: comingSoon },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Warehouses", href: "/dashboard/inventory/warehouse", icon: Warehouse, disabled: false },
        { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, disabled: false },
        {
          label: "Product Categories",
          href: "/dashboard/inventory/categories",
          icon: FolderTree,
          disabled: false,
        },
        {
          label: "Units",
          href: "/dashboard/inventory/units",
          icon: Ruler,
          disabled: false,
        },
        {
          label: "Products",
          href: "/dashboard/inventory/products",
          icon: Package,
          disabled: false,
          
        },
        {
          label: "Suppliers",
          href: "/dashboard/suppliers",
          icon: Truck,
          disabled: false,
        },
        {
         label: "Purchase Orders",
         href: "/dashboard/purchase-orders",
         icon: ShoppingCart,
         disabled: false,
        },
        
        { label: "Production", href: "/production", icon: ClipboardList, disabled: comingSoon },
        { label: "Cutting", href: "/cutting", icon: Scissors, disabled: comingSoon },
        { label: "Sewing", href: "/sewing", icon: Shirt, disabled: comingSoon },
        { label: "Quality Control", href: "/quality-control", icon: BadgeCheck, disabled: comingSoon },
        { label: "Finished Goods", href: "/finished-goods", icon: PackageCheck, disabled: comingSoon },
        { label: "Shipments", href: "/shipments", icon: Truck, disabled: comingSoon },
      ],
    },
    {
      title: "Finance & Reports",
      items: [
        { label: "Payroll", href: "/payroll", icon: Wallet, disabled: comingSoon },
        { label: "Supplier Payments", href: "/supplier-payments", icon: Receipt, disabled: comingSoon },
        { label: "Cash Management", href: "/cash-management", icon: Wallet, disabled: true },
        { label: "Reports", href: "/reports", icon: BarChart3, disabled: comingSoon },
      ],
    },
    {
      title: "System",
      items: [
        { label: "Notifications", href: "/notifications", icon: Bell, disabled: comingSoon },
        { label: "Audit Logs", href: "/audit-logs", icon: ClipboardCheck, disabled: comingSoon },
        { label: "Settings", href: "/settings", icon: Settings, disabled: comingSoon },
      ],
    },
  ],

  ADMIN: [
    dashboard("ADMIN"),
    {
      title: "Organization",
      items: [
        { label: "Users", href: "/users", icon: Users, disabled: comingSoon },
        { label: "Employees", href: "/employees", icon: UserRound, disabled: comingSoon },
        { label: "Departments", href: "/departments", icon: Building2, disabled: comingSoon },
      ],
    },
    {
      title: "Operations",
      items: [
        { label: "Warehouses", href: "/dashboard/inventory/warehouse", icon: Warehouse, disabled: false },
        { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, disabled: false },
        {
          label: "Products",
          href: "/dashboard/inventory/products",
          icon: Package,
          disabled: false,
        },
        {
          label: "Suppliers",
          href: "/dashboard/suppliers",
          icon: Truck,
          disabled: false,
        },
        {
          label: "Purchase Orders",
           href: "/dashboard/purchase-orders",
          icon: ShoppingCart,
         disabled: false,
       },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Reports", href: "/reports", icon: BarChart3, disabled: comingSoon },
      ],
    },
  ],

  MANAGER: [
    dashboard("MANAGER"),
    {
      title: "Production",
      items: [
        { label: "Production Orders", href: "/production", icon: ClipboardList, disabled: comingSoon },
        { label: "Cutting", href: "/cutting", icon: Scissors, disabled: comingSoon },
        { label: "Sewing", href: "/sewing", icon: Shirt, disabled: comingSoon },
        { label: "Quality Control", href: "/quality-control", icon: BadgeCheck, disabled: comingSoon },
        { label: "Finished Goods", href: "/finished-goods", icon: PackageCheck, disabled: comingSoon },
        { label: "Shipments", href: "/shipments", icon: Truck, disabled: comingSoon },
      ],
    },
    {
      title: "Warehouse",
      items: [
        { label: "Warehouses", href: "/dashboard/inventory/warehouse", icon: Warehouse, disabled: false },
        { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, disabled: false },
        {
          label: "Product Categories",
          href: "/dashboard/inventory/categories",
          icon: FolderTree,
          disabled: comingSoon,
        },
        {
          label: "Units",
          href: "/dashboard/inventory/units",
          icon: Ruler,
          disabled: false,
        },
        {
          label: "Products",
          href: "/dashboard/inventory/products",
          icon: Package,
          disabled: false,
        },
        {
          label: "Suppliers",
          href: "/dashboard/suppliers",
          icon: Truck,
          disabled: false,
        },
        {
          label: "Purchase Orders",
           href: "/dashboard/purchase-orders",
          icon: ShoppingCart,
         disabled: false,
       },
      ],
    },
  ],

  ACCOUNTANT: [
    dashboard("ACCOUNTANT"),
    {
      title: "Finance",
      items: [
        { label: "Payroll", href: "/payroll", icon: Wallet, disabled: comingSoon },
         {
          label: "Suppliers",
          href: "/dashboard/suppliers",
          icon: Truck,
          disabled: false,
        },
        {
          label: "Purchase Orders",
           href: "/dashboard/purchase-orders",
          icon: ShoppingCart,
         disabled: false,
       },
        { label: "Supplier Payments", href: "/supplier-payments", icon: Receipt, disabled: comingSoon },
        { label: "Cash Management", href: "/cash-management", icon: Wallet, disabled: true },
        { label: "Reports", href: "/reports", icon: BarChart3, disabled: comingSoon },
      ],
    },
  ],

  STOREKEEPER: [
    dashboard("STOREKEEPER"),
    {
      title: "Warehouse",
      items: [
        { label: "Warehouses", href: "/dashboard/inventory/warehouse", icon: Warehouse, disabled: false },
        { label: "Inventory", href: "/dashboard/inventory", icon: Boxes, disabled: false },
        {
          label: "Units",
          href: "/dashboard/inventory/units",
          icon: Ruler,
          disabled: false,
        },
        { label: "Stock Operations", href: "/stock-operations", icon: ClipboardList, disabled: comingSoon },
        { label: "Finished Goods", href: "/finished-goods", icon: PackageCheck, disabled: comingSoon },
      ],
    },
  ],

  EMPLOYEE: [
    dashboard("EMPLOYEE"),
    {
      title: "My Work",
      items: [
        { label: "Assigned Work", href: "/employee/tasks", icon: ClipboardCheck, disabled: comingSoon },
      ],
    },
  ],
};
