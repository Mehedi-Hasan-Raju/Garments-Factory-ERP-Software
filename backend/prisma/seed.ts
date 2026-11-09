
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

const roles = [
  {
    name: "Owner",
    code: "OWNER",
    description: "Full access to all business modules and system settings",
    isSystem: true,
  },
  {
    name: "Administrator",
    code: "ADMIN",
    description: "Manager creation, warehouse configuration and department setup",
    isSystem: true,
  },
  {
    name: "Manager",
    code: "MANAGER",
    description: "Employee management, warehouse operations and production management",
    isSystem: true,
  },
  {
    name: "Employee",
    code: "EMPLOYEE",
    description: "Assigned tasks and authorized operations only",
    isSystem: true,
  },
  {
    name: "Accountant",
    code: "ACCOUNTANT",
    description: "Finance, salary management and financial reports",
    isSystem: true,
  },
  {
    name: "Storekeeper",
    code: "STOREKEEPER",
    description: "Stock receiving, issuing, transferring and stock counting",
    isSystem: true,
  },
];

const departments = [
  { name: "Administration", code: "ADMIN" },
  { name: "Cutting", code: "CUTTING" },
  { name: "Sewing", code: "SEWING" },
  { name: "Quality Control", code: "QC" },
  { name: "Finishing", code: "FINISHING" },
  { name: "Store", code: "STORE" },
  { name: "Accounts", code: "ACCOUNTS" },
];

const modules = [
  "dashboard",
  "users",
  "roles",
  "departments",
  "employees",
  "warehouses",
  "warehouse_locations",
  "products",
  "inventory",
  "stock_receive",
  "stock_issue",
  "stock_transfer",
  "stock_adjustment",
  "stock_count",
  "stock_history",
  "suppliers",
  "purchase_orders",
  "supplier_payments",
  "buying_houses",
  "buyers",
  "production_orders",
  "cutting",
  "sewing",
  "quality_control",
  "finished_goods",
  "shipments",
  "finance",
  "income",
  "expenses",
  "salaries",
  "reports",
  "imports",
  "expiry_tracking",
  "audit_logs",
  "notifications",
  "settings",
  "tasks",
];

const actions = [
  "view",
  "create",
  "update",
  "delete",
  "approve",
];

type PermissionCode = `${string}.${string}`;

const permissionGrants: Record<string, PermissionCode[]> = {
  ADMIN: [
    "dashboard.view",

    "users.view",
    "users.create",
    "users.update",

    "roles.view",

    "departments.view",
    "departments.create",
    "departments.update",
    "departments.delete",

    "employees.view",

    "warehouses.view",
    "warehouses.create",
    "warehouses.update",

    "warehouse_locations.view",
    "warehouse_locations.create",
    "warehouse_locations.update",
    "warehouse_locations.delete",

    "products.view",
    "inventory.view",
    "stock_history.view",

    "suppliers.view",
    "buying_houses.view",
    "buyers.view",

    "notifications.view",
  ],

  MANAGER: [
    "dashboard.view",

    "users.view",
    "users.create",
    "users.update",

    "employees.view",
    "employees.create",
    "employees.update",

    "departments.view",

    "warehouses.view",
    "warehouse_locations.view",

    "products.view",
    "inventory.view",

    "stock_receive.view",
    "stock_receive.create",

    "stock_issue.view",
    "stock_issue.create",

    "stock_transfer.view",
    "stock_transfer.create",

    "stock_adjustment.view",
    "stock_adjustment.create",

    "stock_count.view",
    "stock_count.create",
    "stock_count.update",

    "stock_history.view",

    "suppliers.view",
    "purchase_orders.view",

    "buying_houses.view",
    "buyers.view",

    "production_orders.view",
    "production_orders.create",
    "production_orders.update",
    "production_orders.approve",

    "cutting.view",
    "cutting.create",
    "cutting.update",

    "sewing.view",
    "sewing.create",
    "sewing.update",

    "quality_control.view",
    "quality_control.create",
    "quality_control.update",
    "quality_control.approve",

    "finished_goods.view",
    "finished_goods.create",

    "shipments.view",
    "shipments.update",

    "expiry_tracking.view",

    "notifications.view",

    "tasks.view",
    "tasks.create",
    "tasks.update",
   "tasks.approve",
  ],

  EMPLOYEE: [
    "dashboard.view",

    "production_orders.view",

    "cutting.view",
    "cutting.update",

    "sewing.view",
    "sewing.update",

    "quality_control.view",

    "finished_goods.view",

    "notifications.view",
    
    "tasks.view",
    "tasks.update",
  ],

  ACCOUNTANT: [
    "dashboard.view",

    "finance.view",

    "income.view",
    "income.create",
    "income.update",

    "expenses.view",
    "expenses.create",
    "expenses.update",

    "salaries.view",
    "salaries.create",
    "salaries.update",

    "supplier_payments.view",
    "supplier_payments.create",
    "supplier_payments.update",

    "suppliers.view",
    "purchase_orders.view",

    "buying_houses.view",
    "buyers.view",

    "production_orders.view",

    "reports.view",

    "notifications.view",
  ],

  STOREKEEPER: [
    "dashboard.view",

    "warehouses.view",
    "warehouse_locations.view",

    "products.view",
    "inventory.view",

    "stock_receive.view",
    "stock_receive.create",

    "stock_issue.view",
    "stock_issue.create",

    "stock_transfer.view",
    "stock_transfer.create",

    "stock_adjustment.view",
    "stock_adjustment.create",

    "stock_count.view",
    "stock_count.create",
    "stock_count.update",

    "stock_history.view",

    "expiry_tracking.view",

    "notifications.view",
  ],
};

async function seed() {
  const ownerEmail = process.env.OWNER_EMAIL
    ?.trim()
    .toLowerCase();

  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error(
      "OWNER_EMAIL and OWNER_PASSWORD must be configured in .env"
    );
  }

  if (ownerPassword.length < 12) {
    throw new Error(
      "OWNER_PASSWORD must contain at least 12 characters"
    );
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  console.log("Starting Garments ERP database seed...");

  await prisma.$transaction(async (tx) => {
    // ==========================================
    // 1. SEED ROLES
    // ==========================================

    console.log("Seeding roles...");

    for (const role of roles) {
      await tx.role.upsert({
        where: {
          code: role.code,
        },
        update: {
          name: role.name,
          description: role.description,
          isSystem: true,
          isActive: true,
        },
        create: role,
      });
    }

    // ==========================================
    // 2. SEED DEPARTMENTS
    // ==========================================

    console.log("Seeding departments...");

    for (const department of departments) {
      await tx.department.upsert({
        where: {
          code: department.code,
        },
        update: {
          name: department.name,
          isActive: true,
        },
        create: {
          ...department,
          isActive: true,
        },
      });
    }

    const departmentCodes = departments.map(
      (department) => department.code
    );

    // Deactivate obsolete departments that have employees.
    await tx.department.updateMany({
      where: {
        code: {
          notIn: departmentCodes,
        },
        employees: {
          some: {},
        },
      },
      data: {
        isActive: false,
      },
    });

    // Delete obsolete departments without employees.
    await tx.department.deleteMany({
      where: {
        code: {
          notIn: departmentCodes,
        },
        employees: {
          none: {},
        },
      },
    });

    // ==========================================
    // 3. SEED PERMISSIONS
    // ==========================================

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
      await tx.permission.upsert({
        where: {
          code: permission.code,
        },
        update: {
          name: permission.name,
          module: permission.module,
          description: permission.description,
        },
        create: permission,
      });
    }

    const validPermissionCodes = permissionRecords.map(
      (permission) => permission.code
    );

    // ==========================================
    // 4. REMOVE OLD PERMISSIONS
    // ==========================================

    console.log("Removing obsolete permissions...");

    await tx.permission.deleteMany({
      where: {
        code: {
          notIn: validPermissionCodes,
        },
      },
    });

    // ==========================================
    // 5. GET ROLE RECORDS
    // ==========================================

    const roleRecords = await tx.role.findMany({
      where: {
        code: {
          in: roles.map((role) => role.code),
        },
      },
    });

    const roleMap = new Map(
      roleRecords.map((role) => [role.code, role])
    );

    // ==========================================
    // 6. RESET SYSTEM ROLE PERMISSIONS
    // ==========================================

    console.log("Updating role permissions...");

    const systemRoleIds = roleRecords.map(
      (role) => role.id
    );

    await tx.rolePermission.deleteMany({
      where: {
        roleId: {
          in: systemRoleIds,
        },
      },
    });

    const allPermissions = await tx.permission.findMany({
      select: {
        id: true,
        code: true,
      },
    });

    const permissionIdMap = new Map(
      allPermissions.map((permission) => [
        permission.code,
        permission.id,
      ])
    );

    const rolePermissionRecords: {
      roleId: string;
      permissionId: string;
    }[] = [];

    // OWNER gets every permission.
    const ownerRole = roleMap.get("OWNER");

    if (!ownerRole) {
      throw new Error("OWNER role not found");
    }

    for (const permission of allPermissions) {
      rolePermissionRecords.push({
        roleId: ownerRole.id,
        permissionId: permission.id,
      });
    }

    // Assign role-specific permissions.
    for (const [roleCode, permissionCodes] of Object.entries(
      permissionGrants
    )) {
      const role = roleMap.get(roleCode);

      if (!role) {
        throw new Error(`Role ${roleCode} not found`);
      }

      for (const permissionCode of permissionCodes) {
        const permissionId = permissionIdMap.get(
          permissionCode
        );

        if (!permissionId) {
          throw new Error(
            `Permission not found: ${permissionCode}`
          );
        }

        rolePermissionRecords.push({
          roleId: role.id,
          permissionId,
        });
      }
    }

    await tx.rolePermission.createMany({
      data: rolePermissionRecords,
      skipDuplicates: true,
    });

    // ==========================================
    // 7. CREATE / PRESERVE OWNER ACCOUNT
    // ==========================================

    console.log("Checking OWNER account...");

    const existingOwner = await tx.user.findUnique({
      where: {
        email: ownerEmail,
      },
    });

    if (!existingOwner) {
      await tx.user.create({
        data: {
          email: ownerEmail,
          passwordHash,
          roleId: ownerRole.id,
        },
      });

      console.log("Initial OWNER account created.");
    } else {
      // Preserve password, status and existing sessions.
      // Ensure the configured owner retains OWNER role.
      if (existingOwner.roleId !== ownerRole.id) {
        await tx.user.update({
          where: {
            id: existingOwner.id,
          },
          data: {
            roleId: ownerRole.id,
          },
        });
      }

      console.log(
        "OWNER account already exists. Password and status preserved."
      );
    }

    // ==========================================
    // 8. SEED SUMMARY
    // ==========================================

    console.log("Roles:", roles.length);
    console.log("Departments:", departments.length);
    console.log("Modules:", modules.length);
    console.log("Permissions:", permissionRecords.length);
    console.log(
      "Role Permission Assignments:",
      rolePermissionRecords.length
    );
  });

  console.log(
    "Garments ERP database seeding completed successfully."
  );
}

seed()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
