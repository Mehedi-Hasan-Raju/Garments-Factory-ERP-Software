
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

const roles = [
  {
    name: "Owner",
    code: "OWNER",
    description: "Full business and system control",
    isSystem: true,
  },
  {
    name: "Administrator",
    code: "ADMIN",
    description: "System and user administration",
    isSystem: true,
  },
  {
    name: "Manager",
    code: "MANAGER",
    description: "Department operations and approvals",
    isSystem: true,
  },
  {
    name: "Employee",
    code: "EMPLOYEE",
    description: "Regular factory employee",
    isSystem: true,
  },
  {
    name: "Accountant",
    code: "ACCOUNTANT",
    description: "Finance and accounting operations",
    isSystem: true,
  },
  {
    name: "Storekeeper",
    code: "STOREKEEPER",
    description: "Warehouse and inventory operations",
    isSystem: true,
  },
];

const departments = [
  { name: "Administration", code: "ADMIN" },
  { name: "Purchase", code: "PURCHASE" },
  { name: "Store & Warehouse", code: "WAREHOUSE" },
  { name: "Cutting", code: "CUTTING" },
  { name: "Sewing", code: "SEWING" },
  { name: "Finishing", code: "FINISHING" },
  { name: "Quality Control", code: "QC" },
  { name: "Packing", code: "PACKING" },
  { name: "Merchandising", code: "MERCHANDISING" },
  { name: "Production Planning", code: "PRODUCTION_PLANNING" },
  { name: "Finance & Accounts", code: "FINANCE" },
  { name: "Maintenance", code: "MAINTENANCE" },
  { name: "HR & Compliance", code: "HR_COMPLIANCE" },
];

const modules = [
  "dashboard",
  "users",
  "roles",
  "departments",
  "employees",
  "products",
  "categories",
  "units",
  "warehouses",
  "inventory",
  "suppliers",
  "purchases",
  "grn",
  "production",
  "quality_control",
  "finished_goods",
  "shipments",
  "finance",
  "tasks",
  "reports",
  "notifications",
  "audit_logs",
];

const actions = ["view", "create", "update", "delete", "approve"];

async function seed() {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD must be configured in .env");
  }

  if (ownerPassword.length < 12) {
    throw new Error("OWNER_PASSWORD must contain at least 12 characters");
  }

  console.log("Seeding roles...");

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
  }

  console.log("Seeding departments...");

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: { name: department.name },
      create: department,
    });
  }

  console.log("Seeding permissions...");

  const permissionRecords = modules.flatMap((module) =>
    actions.map((action) => ({
      name: `${module.replaceAll("_", " ")} ${action}`,
      code: `${module}.${action}`,
      module,
      description: `Allows ${action} access for ${module}`,
    }))
  );

  for (const permission of permissionRecords) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        module: permission.module,
        description: permission.description,
      },
      create: permission,
    });
  }

  console.log("Assigning all permissions to OWNER...");

  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: { code: "OWNER" },
  });

  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  });

  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: ownerRole.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  console.log("Creating initial OWNER account...");

  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);

    await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        roleId: ownerRole.id,
      },
    });

    console.log("Initial OWNER account created.");
  } else {
    console.log("OWNER account already exists. Password unchanged.");
  }

  console.log("Database seeding completed successfully.");
}

seed()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
