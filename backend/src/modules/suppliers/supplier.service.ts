
import { Prisma } from "../../generated/prisma/client.js";
import { supplierRepository } from "./supplier.repository.js";
import type {
  CreateSupplierInput,
  SupplierQueryInput,
  UpdateSupplierInput,
} from "./supplier.validation.js";
import { AppError } from "../../lib/app-error.js";

function handlePrismaError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError("Supplier code already exists", 409);
  }

  throw error;
}

export const supplierService = {
  async create(data: CreateSupplierInput) {
    const existing = await supplierRepository.findByCode(data.supplierCode);

    if (existing) {
      throw new AppError("Supplier code already exists", 409);
    }

    try {
      return await supplierRepository.create({
        supplierCode: data.supplierCode,
        supplierName: data.supplierName,
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        supplierType: data.supplierType,
        rawMaterialTypes: data.rawMaterialTypes,
        notes: data.notes,
      });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async findAll(query: SupplierQueryInput) {
    const [suppliers, total] = await supplierRepository.findAll(query);

    return {
      suppliers,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async findById(id: string) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    return supplier;
  },

  async update(id: string, data: UpdateSupplierInput) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    if (data.supplierCode && data.supplierCode !== supplier.supplierCode) {
      const existing = await supplierRepository.findByCode(data.supplierCode);

      if (existing) {
        throw new AppError("Supplier code already exists", 409);
      }
    }

    const updateData: Prisma.SupplierUpdateInput = {
      ...data,
    };

    try {
      return await supplierRepository.update(id, updateData);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async deactivate(id: string) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    if (!supplier.isActive) {
      throw new AppError("Supplier is already inactive", 400);
    }

    return supplierRepository.update(id, { isActive: false });
  },
};
