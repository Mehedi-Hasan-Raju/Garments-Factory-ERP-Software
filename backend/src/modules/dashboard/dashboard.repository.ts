import { prisma } from "../../lib/prisma.js";

type DashboardOptions = {
  since: Date;
  recentLimit: number;
};

const productionStatuses = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "QC",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

async function getNotificationSummary(userId: string, limit: number) {
  const [unreadCount, recentNotifications] = await Promise.all([
    prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    }),
    prisma.notification.findMany({
      where: { recipientId: userId },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        actionUrl: true,
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  return { unreadCount, recentNotifications };
}

async function getInventorySummary() {
  const [stockRows, stockAggregate, productCount, warehouseCount] =
    await Promise.all([
      prisma.inventoryStock.findMany({
        select: { quantity: true, minimumStock: true },
      }),
      prisma.inventoryStock.aggregate({
        _sum: { quantity: true },
        _count: { _all: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.warehouse.count({ where: { isActive: true } }),
    ]);

  const lowStockCount = stockRows.filter((row) =>
    row.quantity.lessThanOrEqualTo(row.minimumStock)
  ).length;

  return {
    productCount,
    warehouseCount,
    stockRecordCount: stockAggregate._count._all,
    totalStockQuantity: stockAggregate._sum.quantity?.toString() ?? "0",
    lowStockCount,
  };
}

async function getProductionSummary() {
  const statusCounts = await Promise.all(
    productionStatuses.map(async (status) => ({
      status,
      count: await prisma.productionOrder.count({ where: { status } }),
    }))
  );

  const [totalOrders, cuttingQuantity, sewingQuantity, rejectedQuantity] =
    await Promise.all([
      prisma.productionOrder.count(),
      prisma.cuttingEntry.aggregate({ _sum: { cuttingQuantity: true } }),
      prisma.sewingEntry.aggregate({ _sum: { sewingQuantity: true } }),
      prisma.qCInspection.aggregate({ _sum: { rejectedQuantity: true } }),
    ]);

  return {
    totalOrders,
    byStatus: Object.fromEntries(
      statusCounts.map((item) => [item.status, item.count])
    ),
    cuttingQuantity: cuttingQuantity._sum.cuttingQuantity?.toString() ?? "0",
    sewingQuantity: sewingQuantity._sum.sewingQuantity?.toString() ?? "0",
    rejectedQuantity: rejectedQuantity._sum.rejectedQuantity?.toString() ?? "0",
  };
}

async function getRecentProductionOrders(limit: number, since: Date) {
  return prisma.productionOrder.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      orderNumber: true,
      styleNumber: true,
      status: true,
      shipmentStatus: true,
      orderQuantity: true,
      deliveryDate: true,
      createdAt: true,
      buyingHouse: { select: { name: true } },
      product: { select: { name: true, sku: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

async function getRecentStockMovements(limit: number, since: Date) {
  return prisma.stockMovement.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      movementNo: true,
      type: true,
      quantity: true,
      referenceNo: true,
      createdAt: true,
      product: { select: { name: true, sku: true } },
      fromLocation: { select: { name: true, code: true } },
      toLocation: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export const dashboardRepository = {
  async getOwnerDashboard(userId: string, options: DashboardOptions) {
    const [
      userCount,
      employeeCount,
      activeEmployeeCount,
      departmentCount,
      inventory,
      production,
      purchaseOrderCount,
      pendingPurchaseOrderCount,
      shipmentCount,
      recentProductionOrders,
      recentStockMovements,
      notifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.department.count({ where: { isActive: true } }),
      getInventorySummary(),
      getProductionSummary(),
      prisma.purchaseOrder.count(),
      prisma.purchaseOrder.count({
        where: { status: "PENDING_APPROVAL" },
      }),
      prisma.shipment.count(),
      getRecentProductionOrders(options.recentLimit, options.since),
      getRecentStockMovements(options.recentLimit, options.since),
      getNotificationSummary(userId, options.recentLimit),
    ]);

    return {
      users: { total: userCount },
      employees: { total: employeeCount, active: activeEmployeeCount },
      departments: { active: departmentCount },
      inventory,
      production,
      purchasing: { totalPurchaseOrders: purchaseOrderCount, pendingApproval: pendingPurchaseOrderCount },
      shipments: { total: shipmentCount },
      recent: { productionOrders: recentProductionOrders, stockMovements: recentStockMovements },
      notifications,
    };
  },

  async getAdminDashboard(userId: string, options: DashboardOptions) {
    const [
      managerCount,
      employeeCount,
      activeEmployeeCount,
      departmentCount,
      warehouseCount,
      productCount,
      pendingPurchaseOrders,
      totalPurchaseOrders,
      activeProductionOrders,
      inventory,
      recentProductionOrders,
      notifications,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { code: "MANAGER" }, status: "ACTIVE" } }),
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.department.count({ where: { isActive: true } }),
      prisma.warehouse.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.purchaseOrder.count(),
      prisma.productionOrder.count({
        where: { status: { in: ["PENDING", "CUTTING", "SEWING", "QC"] } },
      }),
      getInventorySummary(),
      getRecentProductionOrders(options.recentLimit, options.since),
      getNotificationSummary(userId, options.recentLimit),
    ]);

    return {
      managers: { active: managerCount },
      employees: { total: employeeCount, active: activeEmployeeCount },
      departments: { active: departmentCount },
      warehouses: { active: warehouseCount },
      products: { active: productCount },
      inventory,
      purchasing: { totalPurchaseOrders, pendingApproval: pendingPurchaseOrders },
      production: { activeOrders: activeProductionOrders },
      recent: { productionOrders: recentProductionOrders },
      notifications,
    };
  },

  async getManagerDashboard(userId: string, options: DashboardOptions) {
    const [
      production,
      cuttingCount,
      sewingCount,
      qcCount,
      finishedGoods,
      shipments,
      activeEmployees,
      recentProductionOrders,
      recentStockMovements,
      notifications,
    ] = await Promise.all([
      getProductionSummary(),
      prisma.cuttingEntry.count({ where: { createdAt: { gte: options.since } } }),
      prisma.sewingEntry.count({ where: { createdAt: { gte: options.since } } }),
      prisma.qCInspection.count({ where: { createdAt: { gte: options.since } } }),
      prisma.finishedGoodsEntry.aggregate({
        _sum: { availableQuantity: true, reservedQuantity: true, shippedQuantity: true },
        _count: { _all: true },
      }),
      prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      getRecentProductionOrders(options.recentLimit, options.since),
      getRecentStockMovements(options.recentLimit, options.since),
      getNotificationSummary(userId, options.recentLimit),
    ]);

    return {
      production,
      operations: { cuttingEntries: cuttingCount, sewingEntries: sewingCount, qcInspections: qcCount },
      finishedGoods: {
        batches: finishedGoods._count._all,
        availableQuantity: finishedGoods._sum.availableQuantity?.toString() ?? "0",
        reservedQuantity: finishedGoods._sum.reservedQuantity?.toString() ?? "0",
        shippedQuantity: finishedGoods._sum.shippedQuantity?.toString() ?? "0",
      },
      shipments: Object.fromEntries(shipments.map((item) => [item.status, item._count._all])),
      employees: { active: activeEmployees },
      recent: { productionOrders: recentProductionOrders, stockMovements: recentStockMovements },
      notifications,
    };
  },

  async getEmployeeDashboard(userId: string, options: DashboardOptions) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });
    const [employee, recentActivity, notifications] = await Promise.all([
      user?.employeeId
        ? prisma.employee.findUnique({
            where: { id: user.employeeId },
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              designation: true,
              status: true,
              joiningDate: true,
              department: { select: { name: true, code: true } },
            },
          })
        : Promise.resolve(null),
      prisma.auditLog.findMany({
        where: { actorId: userId, createdAt: { gte: options.since } },
        select: {
          id: true,
          action: true,
          module: true,
          method: true,
          path: true,
          statusCode: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: options.recentLimit,
      }),
      getNotificationSummary(userId, options.recentLimit),
    ]);

    return {
      profile: employee,
      recentActivity,
      tasks: {
        available: false,
        message: "Task Management is not yet implemented in this backend.",
      },
      notifications,
    };
  },

  async getAccountantDashboard(userId: string, options: DashboardOptions) {
    const [
      payrollCount,
      paidPayrollCount,
      payrollTotals,
      supplierPayments,
      purchaseOrderCount,
      recentPayrolls,
      notifications,
    ] = await Promise.all([
      prisma.payroll.count(),
      prisma.payroll.count({ where: { status: "PAID" } }),
      prisma.payroll.aggregate({
        _sum: { totalNetSalary: true, totalBasicSalary: true, totalDeductions: true },
      }),
      prisma.supplierPayment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.purchaseOrder.count(),
      prisma.payroll.findMany({
        where: { createdAt: { gte: options.since } },
        select: {
          id: true,
          year: true,
          month: true,
          status: true,
          currency: true,
          totalNetSalary: true,
          generatedAt: true,
          paidAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: options.recentLimit,
      }),
      getNotificationSummary(userId, options.recentLimit),
    ]);

    return {
      financeModule: { available: false, message: "Finance & Accounting module is deferred." },
      payroll: {
        totalPayrolls: payrollCount,
        paidPayrolls: paidPayrollCount,
        totalNetSalary: payrollTotals._sum.totalNetSalary?.toString() ?? "0",
        totalBasicSalary: payrollTotals._sum.totalBasicSalary?.toString() ?? "0",
        totalDeductions: payrollTotals._sum.totalDeductions?.toString() ?? "0",
      },
      supplierPayments: {
        completedCount: supplierPayments._count._all,
        completedAmount: supplierPayments._sum.amount?.toString() ?? "0",
      },
      purchasing: { totalPurchaseOrders: purchaseOrderCount },
      recent: { payrolls: recentPayrolls },
      notifications,
    };
  },

  async getStorekeeperDashboard(userId: string, options: DashboardOptions) {
    const [
      inventory,
      movementCounts,
      recentStockMovements,
      finishedGoods,
      recentFinishedGoods,
      notifications,
    ] = await Promise.all([
      getInventorySummary(),
      prisma.stockMovement.groupBy({ by: ["type"], _count: { _all: true } }),
      getRecentStockMovements(options.recentLimit, options.since),
      prisma.finishedGoodsEntry.aggregate({
        _sum: { availableQuantity: true, reservedQuantity: true },
        _count: { _all: true },
      }),
      prisma.finishedGoodsEntry.findMany({
        where: { createdAt: { gte: options.since } },
        select: {
          id: true,
          finishedGoodsNumber: true,
          quantity: true,
          availableQuantity: true,
          receivedDate: true,
          warehouse: { select: { name: true, code: true } },
          productionOrder: { select: { orderNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: options.recentLimit,
      }),
      getNotificationSummary(userId, options.recentLimit),
    ]);

    return {
      inventory,
      stockMovements: Object.fromEntries(movementCounts.map((item) => [item.type, item._count._all])),
      finishedGoods: {
        batches: finishedGoods._count._all,
        availableQuantity: finishedGoods._sum.availableQuantity?.toString() ?? "0",
        reservedQuantity: finishedGoods._sum.reservedQuantity?.toString() ?? "0",
      },
      recent: { stockMovements: recentStockMovements, finishedGoods: recentFinishedGoods },
      notifications,
    };
  },
};
