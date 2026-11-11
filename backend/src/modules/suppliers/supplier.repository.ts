
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { SupplierQueryInput } from "./supplier.validation.js";

export const supplierRepository = {
  create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  },

  findAll(query: SupplierQueryInput) {
    const {
      search,
      supplierType,
      rawMaterialType,
      isActive,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.SupplierWhereInput = {
      ...(supplierType && { supplierType }),
      ...(rawMaterialType && {
        rawMaterialTypes: { has: rawMaterialType },
      }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { supplierCode: { contains: search, mode: "insensitive" } },
          { supplierName: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
          { contactPerson: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return prisma.$transaction([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.supplier.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
    });
  },

  findByCode(supplierCode: string) {
    return prisma.supplier.findUnique({
      where: { supplierCode },
    });
  },

  update(id: string, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  },
};
