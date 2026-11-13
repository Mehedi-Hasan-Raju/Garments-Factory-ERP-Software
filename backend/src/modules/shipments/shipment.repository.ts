
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

import type {
  CreateShipmentInput,
  CreateShipmentEventInput,
  ShipmentListQuery,
  UpdateShipmentStatusInput,
} from "./shipment.validation.js";

const shipmentInclude = {
  productionOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      shipmentStatus: true,
      orderQuantity: true,
      finishedGoodsQuantity: true,
    },
  },
  items: {
    include: {
      finishedGoodsEntry: {
        select: {
          id: true,
          finishedGoodsNumber: true,
          quantity: true,
          availableQuantity: true,
          reservedQuantity: true,
          shippedQuantity: true,
          warehouseId: true,
          warehouseLocationId: true,
        },
      },
    },
  },
  events: {
    orderBy: {
      eventDate: "desc" as const,
    },
  },
};

class ShipmentRepository {
  async create(
    data: CreateShipmentInput,
    createdById: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const productionOrder =
          await tx.productionOrder.findUnique({
            where: {
              id: data.productionOrderId,
            },
          });

        if (!productionOrder) {
          throw new AppError(
            "Production order not found.",
            404
          );
        }

        const finishedGoodsIds = data.items.map(
          (item) => item.finishedGoodsEntryId
        );

        const finishedGoodsEntries =
          await tx.finishedGoodsEntry.findMany({
            where: {
              id: {
                in: finishedGoodsIds,
              },
            },
          });

        if (
          finishedGoodsEntries.length !==
          finishedGoodsIds.length
        ) {
          throw new AppError(
            "One or more finished goods entries were not found.",
            404
          );
        }

        const entryMap = new Map(
          finishedGoodsEntries.map((entry) => [
            entry.id,
            entry,
          ])
        );

        let totalQuantity = new Prisma.Decimal(0);

        for (const item of data.items) {
          const entry = entryMap.get(
            item.finishedGoodsEntryId
          );

          if (!entry) {
            throw new AppError(
              "Finished goods entry not found.",
              404
            );
          }

          if (
            entry.productionOrderId !==
            data.productionOrderId
          ) {
            throw new AppError(
              "All finished goods entries must belong to the same production order.",
              400
            );
          }

          const requestedQuantity =
            new Prisma.Decimal(item.quantity);

          if (
            requestedQuantity.greaterThan(
              entry.availableQuantity
            )
          ) {
            throw new AppError(
              `Insufficient available stock for ${entry.finishedGoodsNumber}.`,
              400
            );
          }

          totalQuantity =
            totalQuantity.plus(requestedQuantity);
        }

        const shipment = await tx.shipment.create({
          data: {
            shipmentNumber: data.shipmentNumber,
            productionOrderId: data.productionOrderId,
            shipmentDate: data.shipmentDate,
            expectedDeliveryDate:
              data.expectedDeliveryDate,
            shippingMethod: data.shippingMethod,
            carrierName: data.carrierName,
            trackingNumber: data.trackingNumber,
            destination: data.destination,
            notes: data.notes,
            totalQuantity,
            createdById,
            status: "PLANNED",
          },
        });

        for (const item of data.items) {
          const entry = entryMap.get(
            item.finishedGoodsEntryId
          )!;

          const quantity = new Prisma.Decimal(
            item.quantity
          );

          await tx.shipmentItem.create({
            data: {
              shipmentId: shipment.id,
              finishedGoodsEntryId: entry.id,
              quantity,
            },
          });

          await tx.finishedGoodsEntry.update({
            where: {
              id: entry.id,
            },
            data: {
              availableQuantity: {
                decrement: quantity,
              },
              reservedQuantity: {
                increment: quantity,
              },
            },
          });

          await tx.finishedGoodsMovement.create({
            data: {
              finishedGoodsEntryId: entry.id,
              movementType: "RESERVATION",
              quantity,
              referenceNumber: data.shipmentNumber,
              notes: "Stock reserved for shipment.",
              createdById,
            },
          });
        }

        await tx.shipmentEvent.create({
          data: {
            shipmentId: shipment.id,
            status: "PLANNED",
            notes: "Shipment created.",
            createdById,
          },
        });

        await this.syncProductionOrderShipmentStatus(
          tx,
          data.productionOrderId
        );

        return tx.shipment.findUnique({
          where: {
            id: shipment.id,
          },
          include: shipmentInclude,
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );
  }

  async findAll(query: ShipmentListQuery) {
    const { page, limit, search, status, productionOrderId } =
      query;

    const where: Prisma.ShipmentWhereInput = {
      ...(status && { status }),
      ...(productionOrderId && { productionOrderId }),

      ...(search && {
        OR: [
          {
            shipmentNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            trackingNumber: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            carrierName: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            productionOrder: {
              orderNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: shipmentInclude,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.shipment.count({
        where,
      }),
    ]);

    return {
      shipments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.shipment.findUnique({
      where: { id },
      include: shipmentInclude,
    });
  }

  async findByProductionOrder(productionOrderId: string) {
    return prisma.shipment.findMany({
      where: {
        productionOrderId,
      },
      include: shipmentInclude,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateStatus(
    id: string,
    data: UpdateShipmentStatusInput,
    createdById: string
  ) {
    return prisma.$transaction(
      async (tx) => {
        const shipment = await tx.shipment.findUnique({
          where: { id },
          include: {
            items: {
              include: {
                finishedGoodsEntry: true,
              },
            },
          },
        });

        if (!shipment) {
          throw new AppError("Shipment not found.", 404);
        }

        const currentStatus = shipment.status;
        const nextStatus = data.status;

        const allowedTransitions: Record<
          string,
          string[]
        > = {
          PLANNED: ["READY", "CANCELLED"],
          READY: ["DISPATCHED", "CANCELLED"],
          DISPATCHED: ["DELIVERED"],
          DELIVERED: [],
          CANCELLED: [],
        };

        if (
          !allowedTransitions[currentStatus]?.includes(
            nextStatus
          )
        ) {
          throw new AppError(
            `Cannot change shipment status from ${currentStatus} to ${nextStatus}.`,
            400
          );
        }

        if (nextStatus === "DISPATCHED") {
          for (const item of shipment.items) {
            const entry = item.finishedGoodsEntry;
            const quantity = item.quantity;

            if (
              entry.reservedQuantity.lessThan(quantity)
            ) {
              throw new AppError(
                `Reserved stock is insufficient for ${entry.finishedGoodsNumber}.`,
                400
              );
            }

            await tx.finishedGoodsEntry.update({
              where: {
                id: entry.id,
              },
              data: {
                reservedQuantity: {
                  decrement: quantity,
                },
                shippedQuantity: {
                  increment: quantity,
                },
              },
            });

            await tx.finishedGoodsMovement.create({
              data: {
                finishedGoodsEntryId: entry.id,
                movementType: "SHIPMENT",
                quantity,
                referenceNumber: shipment.shipmentNumber,
                notes: "Goods dispatched.",
                createdById,
              },
            });
          }
        }

        if (nextStatus === "CANCELLED") {
          for (const item of shipment.items) {
            const entry = item.finishedGoodsEntry;
            const quantity = item.quantity;

            if (
              entry.reservedQuantity.lessThan(quantity)
            ) {
              throw new AppError(
                `Reserved stock is insufficient for ${entry.finishedGoodsNumber}.`,
                400
              );
            }

            await tx.finishedGoodsEntry.update({
              where: {
                id: entry.id,
              },
              data: {
                reservedQuantity: {
                  decrement: quantity,
                },
                availableQuantity: {
                  increment: quantity,
                },
              },
            });

            await tx.finishedGoodsMovement.create({
              data: {
                finishedGoodsEntryId: entry.id,
                movementType: "RELEASE",
                quantity,
                referenceNumber: shipment.shipmentNumber,
                notes: "Shipment cancelled. Reserved stock released.",
                createdById,
              },
            });
          }
        }

        const updatedShipment = await tx.shipment.update({
          where: { id },
          data: {
            status: nextStatus,
            ...(nextStatus === "DISPATCHED" && {
              shipmentDate:
                shipment.shipmentDate ?? new Date(),
            }),
            ...(nextStatus === "DELIVERED" && {
              actualDeliveryDate: new Date(),
            }),
          },
        });

        await tx.shipmentEvent.create({
          data: {
            shipmentId: id,
            status: nextStatus,
            location: data.location,
            notes: data.notes,
            createdById,
          },
        });

        await this.syncProductionOrderShipmentStatus(
          tx,
          shipment.productionOrderId
        );

        return tx.shipment.findUnique({
          where: {
            id: updatedShipment.id,
          },
          include: shipmentInclude,
        });
      },
      {
        isolationLevel: "Serializable",
      }
    );
  }

  async createEvent(
    shipmentId: string,
    data: CreateShipmentEventInput,
    createdById: string
  ) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new AppError("Shipment not found.", 404);
    }

    if (
      shipment.status === "CANCELLED" ||
      shipment.status === "DELIVERED"
    ) {
      throw new AppError(
        "Cannot add tracking events to a closed shipment.",
        400
      );
    }

    return prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status: shipment.status,
        eventDate: data.eventDate,
        location: data.location,
        notes: data.notes,
        createdById,
      },
    });
  }

  async findEvents(shipmentId: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { id: true },
    });

    if (!shipment) {
      throw new AppError("Shipment not found.", 404);
    }

    return prisma.shipmentEvent.findMany({
      where: { shipmentId },
      orderBy: {
        eventDate: "desc",
      },
    });
  }

  private async syncProductionOrderShipmentStatus(
    tx: Prisma.TransactionClient,
    productionOrderId: string
  ) {
    const order = await tx.productionOrder.findUnique({
      where: {
        id: productionOrderId,
      },
      select: {
        id: true,
        finishedGoodsQuantity: true,
      },
    });

    if (!order) {
      throw new AppError("Production order not found.", 404);
    }

    const stock = await tx.finishedGoodsEntry.aggregate({
      where: {
        productionOrderId,
      },
      _sum: {
        shippedQuantity: true,
      },
    });

    const shippedQuantity =
      stock._sum.shippedQuantity ??
      new Prisma.Decimal(0);

    const finishedGoodsQuantity =
      order.finishedGoodsQuantity;

    const activeShipments = await tx.shipment.findMany({
      where: {
        productionOrderId,
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        status: true,
      },
    });

    let shipmentStatus:
      | "NOT_SHIPPED"
      | "READY"
      | "PARTIALLY_SHIPPED"
      | "SHIPPED"
      | "DELIVERED" = "NOT_SHIPPED";

    if (shippedQuantity.greaterThan(0)) {
      if (
        shippedQuantity.greaterThanOrEqualTo(
          finishedGoodsQuantity
        )
      ) {
        const allDelivered =
          activeShipments.length > 0 &&
          activeShipments.every(
            (shipment) => shipment.status === "DELIVERED"
          );

        shipmentStatus = allDelivered
          ? "DELIVERED"
          : "SHIPPED";
      } else {
        shipmentStatus = "PARTIALLY_SHIPPED";
      }
    } else if (activeShipments.length > 0) {
      shipmentStatus = "READY";
    }

    await tx.productionOrder.update({
      where: {
        id: productionOrderId,
      },
      data: {
        shipmentStatus,
      },
    });
  }
}

export const shipmentRepository = new ShipmentRepository();
