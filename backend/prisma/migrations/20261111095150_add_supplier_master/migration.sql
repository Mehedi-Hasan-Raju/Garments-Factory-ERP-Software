-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'TRADER', 'OTHER');

-- CreateEnum
CREATE TYPE "RawMaterialType" AS ENUM ('FABRIC', 'ACCESSORIES', 'THREAD', 'BUTTON', 'ZIPPER', 'LABEL', 'PACKAGING', 'OTHER');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "supplierCode" VARCHAR(50) NOT NULL,
    "supplierName" VARCHAR(150) NOT NULL,
    "companyName" VARCHAR(150) NOT NULL,
    "contactPerson" VARCHAR(120),
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150),
    "address" TEXT,
    "supplierType" "SupplierType" NOT NULL,
    "rawMaterialTypes" "RawMaterialType"[] DEFAULT ARRAY[]::"RawMaterialType"[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_supplierCode_key" ON "Supplier"("supplierCode");

-- CreateIndex
CREATE INDEX "Supplier_supplierName_idx" ON "Supplier"("supplierName");

-- CreateIndex
CREATE INDEX "Supplier_companyName_idx" ON "Supplier"("companyName");

-- CreateIndex
CREATE INDEX "Supplier_phone_idx" ON "Supplier"("phone");

-- CreateIndex
CREATE INDEX "Supplier_supplierType_isActive_idx" ON "Supplier"("supplierType", "isActive");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");
