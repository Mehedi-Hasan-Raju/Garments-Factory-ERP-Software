import { AppError } from "../../lib/app-error.js";
import { purchaseOrderRepository } from "./purchase-order.repository.js";
import { notifyRoles } from "../../lib/automatic-notification.js";

import type {
  CreatePurchaseOrderInput,
  PurchaseOrderQuery,
  ReceivePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from "./purchase-order.validation.js";

function handleRepositoryError(error: unknown): never {
  const code = error instanceof Error ? error.message : "";

  const errors: Record<string, { message: string; status: number }> = {
    SUPPLIER_NOT_FOUND: {
      message: "Active supplier not found",
      status: 404,
    },
    WAREHOUSE_NOT_FOUND: {
      message: "Active warehouse not found",
      status: 404,
    },
    PRODUCT_NOT_FOUND: {
      message: "One or more active products were not found",
      status: 404,
    },
    PURCHASE_ORDER_NOT_FOUND: {
      message: "Purchase order not found",
      status: 404,
    },
    PURCHASE_ORDER_ITEM_NOT_FOUND: {
      message: "Purchase order item not found",
      status: 404,
    },
    ONLY_DRAFT_CAN_BE_UPDATED: {
      message: "Only draft purchase orders can be updated",
      status: 400,
    },
    INVALID_PURCHASE_ORDER_STATUS: {
      message: "Purchase order is not in a valid status for this action",
      status: 400,
    },
    PURCHASE_ORDER_CANNOT_BE_CANCELLED: {
      message: "This purchase order cannot be cancelled",
      status: 400,
    },
    PURCHASE_ORDER_NOT_READY_FOR_RECEIVING: {
      message: "Purchase order must be approved before receiving goods",
      status: 400,
    },
    RECEIVE_QUANTITY_EXCEEDS_REMAINING: {
      message: "Receiving quantity exceeds the remaining purchase quantity",
      status: 400,
    },
    INVALID_WAREHOUSE_BIN: {
      message: "Selected BIN does not belong to the purchase order warehouse",
      status: 400,
    },
    BATCH_LOT_INACTIVE: {
      message: "Selected batch/lot is inactive",
      status: 400,
    },
    INVALID_TOTAL_AMOUNT: {
      message: "Discount cannot make the purchase order total negative",
      status: 400,
    },
  };

  const matched = errors[code];

  if (matched) {
    throw new AppError(matched.message, matched.status);
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    throw new AppError("Purchase order number already exists", 409);
  }

  throw error;
}

export const purchaseOrderService = {
  async create(data: CreatePurchaseOrderInput, userId: string) {
    try {
      const created = await purchaseOrderRepository.create(data, userId);
      await notifyRoles(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"], {
        title: "Purchase Order Created",
        message: `Purchase order ${created.poNumber} has been created.`,
        type: "PURCHASE",
        actionUrl: `/purchase-orders/${created.id}`,
      });
      return created;
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async findMany(query: PurchaseOrderQuery) {
    return purchaseOrderRepository.findMany(query);
  },

  async findById(id: string) {
    const purchaseOrder = await purchaseOrderRepository.findById(id);

    if (!purchaseOrder) {
      throw new AppError("Purchase order not found", 404);
    }

    return purchaseOrder;
  },

  async update(id: string, data: UpdatePurchaseOrderInput) {
    try {
      return await purchaseOrderRepository.update(id, data);
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async submit(id: string) {
    try {
      const updated = await purchaseOrderRepository.submit(id);
      if (!updated) return updated;
      await notifyRoles(["OWNER", "MANAGER", "ACCOUNTANT"], {
        title: "Purchase Order Submitted",
        message: `Purchase order ${updated.poNumber} has been submitted for approval.`,
        type: "PURCHASE",
        actionUrl: `/purchase-orders/${id}`,
      });
      return updated;
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async approve(id: string, userId: string) {
    try {
      const updated = await purchaseOrderRepository.approve(id, userId);
      if (!updated) return updated;
      await notifyRoles(["OWNER", "MANAGER", "ACCOUNTANT", "STOREKEEPER"], {
        title: "Purchase Order Approved",
        message: `Purchase order ${updated.poNumber} has been approved.`,
        type: "PURCHASE",
        actionUrl: `/purchase-orders/${id}`,
      });
      return updated;
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async cancel(id: string) {
    try {
      return await purchaseOrderRepository.cancel(id);
    } catch (error) {
      handleRepositoryError(error);
    }
  },

  async receive(
    id: string,
    data: ReceivePurchaseOrderInput,
    userId: string,
  ) {
    try {
      const updated = await purchaseOrderRepository.receive(id, data, userId);
      if (!updated) return updated;
      await notifyRoles(["OWNER", "ADMIN", "MANAGER", "STOREKEEPER", "ACCOUNTANT"], {
        title: "Purchase Goods Received",
        message: `Goods have been received against purchase order ${updated.poNumber}.`,
        type: "PURCHASE",
        actionUrl: `/purchase-orders/${id}`,
      });
      return updated;
    } catch (error) {
      handleRepositoryError(error);
    }
  },
};