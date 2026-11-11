-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalary" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalaryComponent" (
    "id" UUID NOT NULL,
    "employeeSalaryId" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeSalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payroll" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalBasicSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalOvertime" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalBonus" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalNetSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItem" (
    "id" UUID NOT NULL,
    "payrollId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "overtimeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grossSalary" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netSalary" DECIMAL(12,2) NOT NULL,
    "daysInMonth" INTEGER NOT NULL,
    "paidDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollItemComponent" (
    "id" UUID NOT NULL,
    "payrollItemId" UUID NOT NULL,
    "componentId" UUID,
    "componentName" VARCHAR(100) NOT NULL,
    "componentCode" VARCHAR(50) NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollItemComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_code_key" ON "SalaryComponent"("code");

-- CreateIndex
CREATE INDEX "SalaryComponent_type_isActive_idx" ON "SalaryComponent"("type", "isActive");

-- CreateIndex
CREATE INDEX "EmployeeSalary_employeeId_effectiveFrom_idx" ON "EmployeeSalary"("employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "EmployeeSalary_effectiveTo_idx" ON "EmployeeSalary"("effectiveTo");

-- CreateIndex
CREATE INDEX "EmployeeSalaryComponent_componentId_idx" ON "EmployeeSalaryComponent"("componentId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalaryComponent_employeeSalaryId_componentId_key" ON "EmployeeSalaryComponent"("employeeSalaryId", "componentId");

-- CreateIndex
CREATE INDEX "Payroll_status_year_month_idx" ON "Payroll"("status", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_year_month_key" ON "Payroll"("year", "month");

-- CreateIndex
CREATE INDEX "PayrollItem_employeeId_idx" ON "PayrollItem"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollItem_payrollId_employeeId_key" ON "PayrollItem"("payrollId", "employeeId");

-- CreateIndex
CREATE INDEX "PayrollItemComponent_payrollItemId_idx" ON "PayrollItemComponent"("payrollItemId");

-- CreateIndex
CREATE INDEX "PayrollItemComponent_componentId_idx" ON "PayrollItemComponent"("componentId");

-- AddForeignKey
ALTER TABLE "EmployeeSalary" ADD CONSTRAINT "EmployeeSalary_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComponent" ADD CONSTRAINT "EmployeeSalaryComponent_employeeSalaryId_fkey" FOREIGN KEY ("employeeSalaryId") REFERENCES "EmployeeSalary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalaryComponent" ADD CONSTRAINT "EmployeeSalaryComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItemComponent" ADD CONSTRAINT "PayrollItemComponent_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "PayrollItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollItemComponent" ADD CONSTRAINT "PayrollItemComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "SalaryComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
