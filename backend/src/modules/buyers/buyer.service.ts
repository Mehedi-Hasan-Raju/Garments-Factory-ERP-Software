import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { buyingHouseRepository } from "../buying-houses/buying-house.repository.js";
import { buyerRepository } from "./buyer.repository.js";
import type {
  CreateBuyerInput,
  BuyerQueryInput,
  UpdateBuyerInput,
} from "./buyer.validation.js";


export const buyerService = {
  async validateBuyingHouse(buyingHouseId: string) {
    const buyingHouse =
      await buyingHouseRepository.findById(buyingHouseId);

    if (!buyingHouse) {
      throw new AppError("Buying House not found", 404);
    }

    if (!buyingHouse.isActive) {
      throw new AppError(
        "Cannot assign a buyer to an inactive Buying House",
        400
      );
    }

    return buyingHouse;
  },

  async create(data: CreateBuyerInput) {
    const existing = await buyerRepository.findByCode(
      data.buyerCode
    );

    if (existing) {
      throw new AppError("Buyer code already exists", 409);
    }

    await this.validateBuyingHouse(data.buyingHouseId);

    return buyerRepository.create(data);
  },

  async findAll(query: BuyerQueryInput) {
    const where: Prisma.BuyerWhereInput = {
      ...(query.country && {
        country: {
          contains: query.country,
          mode: "insensitive",
        },
      }),

      ...(query.buyingHouseId && {
        buyingHouseId: query.buyingHouseId,
      }),

      ...(query.isActive && {
        isActive: query.isActive === "true",
      }),

      ...(query.search && {
        OR: [
          {
            buyerCode: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            companyName: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            country: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            buyingHouse: {
              name: {
                contains: query.search,
                mode: "insensitive",
              },
            },
          },
        ],
      }),
    };

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      buyerRepository.findAll(where, skip, query.limit),
      buyerRepository.count(where),
    ]);

    return {
      data,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async findById(id: string) {
    const buyer = await buyerRepository.findById(id);

    if (!buyer) {
      throw new AppError("Buyer not found", 404);
    }

    return buyer;
  },

  async update(id: string, data: UpdateBuyerInput) {
    const buyer = await this.findById(id);

    if (data.buyerCode) {
      const existing = await buyerRepository.findByCode(
        data.buyerCode
      );

      if (existing && existing.id !== id) {
        throw new AppError("Buyer code already exists", 409);
      }
    }

    if (
      data.buyingHouseId &&
      data.buyingHouseId !== buyer.buyingHouseId
    ) {
      await this.validateBuyingHouse(data.buyingHouseId);
    }

    return buyerRepository.update(id, data);
  },

  async updateStatus(id: string, isActive: boolean) {
    await this.findById(id);

    return buyerRepository.update(id, { isActive });
  },
};
