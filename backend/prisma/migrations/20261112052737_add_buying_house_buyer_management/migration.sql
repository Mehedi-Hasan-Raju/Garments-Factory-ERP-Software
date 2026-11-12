-- CreateTable
CREATE TABLE "BuyingHouse" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "companyName" VARCHAR(150) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "contactPerson" VARCHAR(120),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "website" VARCHAR(255),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyingHouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" UUID NOT NULL,
    "buyerCode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "companyName" VARCHAR(150),
    "country" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "contactPerson" VARCHAR(120),
    "designation" VARCHAR(100),
    "phone" VARCHAR(30),
    "email" VARCHAR(150),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "buyingHouseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuyingHouse_code_key" ON "BuyingHouse"("code");

-- CreateIndex
CREATE INDEX "BuyingHouse_name_idx" ON "BuyingHouse"("name");

-- CreateIndex
CREATE INDEX "BuyingHouse_companyName_idx" ON "BuyingHouse"("companyName");

-- CreateIndex
CREATE INDEX "BuyingHouse_country_idx" ON "BuyingHouse"("country");

-- CreateIndex
CREATE INDEX "BuyingHouse_isActive_idx" ON "BuyingHouse"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Buyer_buyerCode_key" ON "Buyer"("buyerCode");

-- CreateIndex
CREATE INDEX "Buyer_buyingHouseId_isActive_idx" ON "Buyer"("buyingHouseId", "isActive");

-- CreateIndex
CREATE INDEX "Buyer_name_idx" ON "Buyer"("name");

-- CreateIndex
CREATE INDEX "Buyer_country_idx" ON "Buyer"("country");

-- CreateIndex
CREATE INDEX "Buyer_email_idx" ON "Buyer"("email");

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_buyingHouseId_fkey" FOREIGN KEY ("buyingHouseId") REFERENCES "BuyingHouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
