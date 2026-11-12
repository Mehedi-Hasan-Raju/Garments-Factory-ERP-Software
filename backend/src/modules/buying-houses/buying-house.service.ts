import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../../lib/app-error.js";
import { buyingHouseRepository } from "./buying-house.repository.js";

type CreateBuyingHouseInput = {
  code: string;
  name: string;
  companyName: string;
  country: string;
  address?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  notes?: string | null;
};

export const buyingHouseService = {
  async create(data: CreateBuyingHouseInput) {
    const existing = await buyingHouseRepository.findByCode(data.code);

    if (existing) {
      throw new AppError("Buying House code already exists", 409);
    }

    return buyingHouseRepository.create(data);
  },

  async findAll(query: {
    search?: string;
    country?: string;
    isActive?: "true" | "false";
    page: number;
    limit: number;
  }) {
    const where: Prisma.BuyingHouseWhereInput = {
      ...(query.country && {
        country: {
          contains: query.country,
          mode: "insensitive",
        },
      }),

      ...(query.isActive && {
        isActive: query.isActive === "true",
      }),

      ...(query.search && {
        OR: [
          {
            code: {
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
        ],
      }),
    };

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      buyingHouseRepository.findAll(where, skip, query.limit),
      buyingHouseRepository.count(where),
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
    const buyingHouse = await buyingHouseRepository.findById(id);

    if (!buyingHouse) {
      throw new AppError("Buying House not found", 404);
    }

    return buyingHouse;
  },

  async update(
    id: string,
    data: Partial<CreateBuyingHouseInput>
  ) {
    await this.findById(id);

    if (data.code) {
      const existing = await buyingHouseRepository.findByCode(data.code);

      if (existing && existing.id !== id) {
        throw new AppError("Buying House code already exists", 409);
      }
    }

    return buyingHouseRepository.update(id, data);
  },

  async updateStatus(id: string, isActive: boolean) {
    await this.findById(id);

    return buyingHouseRepository.update(id, {
      isActive,
    });
  },
};