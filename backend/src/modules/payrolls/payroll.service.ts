
import { AppError } from "../../lib/app-error.js";
import { payrollRepository } from "./payroll.repository.js";
import type {
  GeneratePayrollInput,
  UpdatePayrollAdjustmentInput,
} from "./payroll.validation.js";

const toPaisa = (value: unknown): bigint => {
  const raw = String(value ?? "0");
  const [whole, fraction = ""] = raw.split(".");
  return BigInt(whole || "0") * 100n +
    BigInt((fraction + "00").slice(0, 2));
};

const fromPaisa = (value: bigint): string => {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
};

const roundDivide = (value: bigint, divisor: bigint): bigint =>
  (value + divisor / 2n) / divisor;

const isPrismaError = (error: unknown, code: string) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

export const payrollService = {
  async generate(data: GeneratePayrollInput) {
    const existing = await payrollRepository.findByPeriod(
      data.year,
      data.month
    );

    if (existing) {
      throw new AppError("Payroll already exists for this month", 409);
    }

    const daysInMonth = new Date(
      Date.UTC(data.year, data.month, 0)
    ).getUTCDate();

    const monthStart = new Date(Date.UTC(data.year, data.month - 1, 1));
    const monthEnd = new Date(Date.UTC(data.year, data.month, daysInMonth));

    const employees = await payrollRepository.findEligibleEmployees(
      monthStart,
      monthEnd
    );

    
const items = employees.map((employee) => {
  let basicTotal = 0n;
  let paidDays = 0;

  const componentTotals = new Map<
    string,
    {
      componentId: string;
      componentName: string;
      componentCode: string;
      type: "EARNING" | "DEDUCTION";
      amount: bigint;
    }
  >();

  for (const salary of employee.salaries) {
    const from = new Date(salary.effectiveFrom);
    const to = salary.effectiveTo
      ? new Date(salary.effectiveTo)
      : null;

    let eligibleDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(
        Date.UTC(data.year, data.month - 1, day)
      );

      if (from <= currentDate && (!to || to >= currentDate)) {
        eligibleDays++;
      }
    }

    if (eligibleDays === 0) continue;

    paidDays += eligibleDays;

    basicTotal += roundDivide(
      toPaisa(salary.basicSalary) * BigInt(eligibleDays),
      BigInt(daysInMonth)
    );

    for (const salaryComponent of salary.components) {
      const component = salaryComponent.component;
      const key = component.id;

      const proratedAmount = roundDivide(
        toPaisa(salaryComponent.amount) * BigInt(eligibleDays),
        BigInt(daysInMonth)
      );

      const existing = componentTotals.get(key);

      if (existing) {
        existing.amount += proratedAmount;
      } else {
        componentTotals.set(key, {
          componentId: component.id,
          componentName: component.name,
          componentCode: component.code,
          type: component.type,
          amount: proratedAmount,
        });
      }
    }
  }

  const components = [...componentTotals.values()].map((component) => ({
    ...component,
    amount: fromPaisa(component.amount),
  }));

  const earningTotal = components
    .filter((item) => item.type === "EARNING")
    .reduce((sum, item) => sum + toPaisa(item.amount), 0n);

  const deductionTotal = components
    .filter((item) => item.type === "DEDUCTION")
    .reduce((sum, item) => sum + toPaisa(item.amount), 0n);

  const gross = basicTotal + earningTotal;
  const net = gross - deductionTotal;

  return {
    employeeId: employee.id,
    basicSalary: fromPaisa(basicTotal),
    overtimeAmount: "0.00",
    bonusAmount: "0.00",
    otherDeduction: "0.00",
    grossSalary: fromPaisa(gross),
    totalDeductions: fromPaisa(deductionTotal),
    netSalary: fromPaisa(net),
    daysInMonth,
    paidDays,
    components,
  };
});


    if (items.length === 0) {
      throw new AppError(
        "No active employees with valid salary records found for this month",
        400
      );
    }

    const sum = (values: string[]) =>
      values.reduce((total, value) => total + toPaisa(value), 0n);

    try {
      return await payrollRepository.create({
        year: data.year,
        month: data.month,
        totalBasicSalary: fromPaisa(sum(items.map((i) => i.basicSalary))),
        totalEarnings: fromPaisa(
          sum(items.flatMap((i) =>
            i.components
              .filter((c) => c.type === "EARNING")
              .map((c) => c.amount)
          ))
        ),
        totalDeductions: fromPaisa(
          sum(items.map((i) => i.totalDeductions))
        ),
        totalOvertime: "0.00",
        totalBonus: "0.00",
        totalNetSalary: fromPaisa(sum(items.map((i) => i.netSalary))),
        items,
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        throw new AppError("Payroll already exists for this month", 409);
      }
      throw error;
    }
  },

  async findAll() {
    return payrollRepository.findAll();
  },

  async findById(id: string) {
    const payroll = await payrollRepository.findById(id);

    if (!payroll) throw new AppError("Payroll not found", 404);

    return payroll;
  },

  async updateAdjustment(
    payrollId: string,
    itemId: string,
    data: UpdatePayrollAdjustmentInput
  ) {
    const payroll = await this.findById(payrollId);

    if (payroll.status !== "DRAFT") {
      throw new AppError("Only draft payroll can be adjusted", 409);
    }

    const item = payroll.items.find((entry) => entry.id === itemId);

    if (!item) throw new AppError("Payroll item not found", 404);

    const overtime = data.overtimeAmount !== undefined
      ? toPaisa(data.overtimeAmount)
      : toPaisa(item.overtimeAmount);

    const bonus = data.bonusAmount !== undefined
      ? toPaisa(data.bonusAmount)
      : toPaisa(item.bonusAmount);

    const otherDeduction = data.otherDeduction !== undefined
      ? toPaisa(data.otherDeduction)
      : toPaisa(item.otherDeduction);

    const basic = toPaisa(item.basicSalary);

    const earnings = item.components
      .filter((component) => component.type === "EARNING")
      .reduce((sum, component) => sum + toPaisa(component.amount), 0n);

    const componentDeductions = item.components
      .filter((component) => component.type === "DEDUCTION")
      .reduce((sum, component) => sum + toPaisa(component.amount), 0n);

    const gross = basic + earnings + overtime + bonus;
    const deductions = componentDeductions + otherDeduction;
    const net = gross - deductions;

    if (net < 0n) {
      throw new AppError("Net salary cannot be negative", 400);
    }


const allItems = payroll.items.map((entry) => {
  const isTarget = entry.id === itemId;

  const basic = toPaisa(entry.basicSalary);
  const earnings = entry.components
    .filter((c) => c.type === "EARNING")
    .reduce((s, c) => s + toPaisa(c.amount), 0n);

  const componentDeductions = entry.components
    .filter((c) => c.type === "DEDUCTION")
    .reduce((s, c) => s + toPaisa(c.amount), 0n);

  const itemOvertime = isTarget
    ? overtime
    : toPaisa(entry.overtimeAmount);

  const itemBonus = isTarget
    ? bonus
    : toPaisa(entry.bonusAmount);

  const itemOtherDeduction = isTarget
    ? otherDeduction
    : toPaisa(entry.otherDeduction);

  const itemGross = basic + earnings + itemOvertime + itemBonus;
  const itemDeductions = componentDeductions + itemOtherDeduction;

  return {
    basic,
    earnings,
    overtime: itemOvertime,
    bonus: itemBonus,
    totalDeductions: itemDeductions,
    net: itemGross - itemDeductions,
  };
});

const total = (
  key: "basic" | "earnings" | "overtime" | "bonus" | "totalDeductions" | "net"
) => allItems.reduce((sum, item) => sum + item[key], 0n);


    const result = await payrollRepository.updateAdjustment(
      payrollId,
      itemId,
      {
        overtimeAmount: fromPaisa(overtime),
        bonusAmount: fromPaisa(bonus),
        otherDeduction: fromPaisa(otherDeduction),
        grossSalary: fromPaisa(gross),
        totalDeductions: fromPaisa(deductions),
        netSalary: fromPaisa(net),
        totalBasicSalary: fromPaisa(total("basic")),
        totalEarnings: fromPaisa(total("earnings")),
        totalDeductionsPayroll: fromPaisa(total("totalDeductions")),
        totalOvertime: fromPaisa(total("overtime")),
        totalBonus: fromPaisa(total("bonus")),
        totalNetSalary: fromPaisa(total("net")),
      }
    );

    return result;
  },

  async approve(id: string) {
    await this.findById(id);

    try {
      return await payrollRepository.changeStatus(id, "DRAFT", "APPROVED");
    } catch {
      throw new AppError("Payroll cannot be approved in its current status", 409);
    }
  },

  async markPaid(id: string) {
    await this.findById(id);

    try {
      return await payrollRepository.changeStatus(id, "APPROVED", "PAID");
    } catch {
      throw new AppError("Only approved payroll can be marked as paid", 409);
    }
  },
};
