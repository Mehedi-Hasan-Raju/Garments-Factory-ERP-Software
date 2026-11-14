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

async function seed() {
  const ownerEmail = process.env.OWNER_EMAIL
    ?.trim()
    .toLowerCase();

  const ownerPassword = process.env.OWNER_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL
    ?.trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error(
      "OWNER_EMAIL and OWNER_PASSWORD must be configured in .env",
    );
  }

  if (Boolean(adminEmail) !== Boolean(adminPassword)) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must both be configured in .env",
    );
  }

  if (adminEmail && ownerEmail === adminEmail) {
    throw new Error("OWNER_EMAIL and ADMIN_EMAIL must be different");
  }

  if (ownerPassword.length < 12) {
    throw new Error(
      "OWNER_PASSWORD must contain at least 12 characters",
    );
  }

  if (adminPassword && adminPassword.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD must contain at least 12 characters",
    );
  }

  const passwordHash = await bcrypt.hash(ownerPassword, 12);
  const adminPasswordHash = adminPassword
    ? await bcrypt.hash(adminPassword, 12)
    : null;

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
      (department) => department.code,
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
    // 3. GET OWNER ROLE
    // ==========================================

    const ownerRole = await tx.role.findUnique({
      where: {
        code: "OWNER",
      },
    });

    if (!ownerRole) {
      throw new Error("OWNER role not found");
    }

    // ==========================================
    // 4. CREATE / PRESERVE OWNER ACCOUNT
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
        "OWNER account already exists. Password and status preserved.",
      );
    }

    // ==========================================
    // 5. CREATE / PRESERVE ADMIN ACCOUNT
    // ==========================================

    if (!adminEmail || !adminPasswordHash) {
      console.log(
        "ADMIN account not seeded. Configure ADMIN_EMAIL and ADMIN_PASSWORD to create it.",
      );
    } else {
      console.log("Checking ADMIN account...");

      const adminRole = await tx.role.findUnique({
        where: {
          code: "ADMIN",
        },
      });

      if (!adminRole) {
        throw new Error("ADMIN role not found");
      }

      const existingAdmin = await tx.user.findUnique({
        where: {
          email: adminEmail,
        },
      });

      if (!existingAdmin) {
        await tx.user.create({
          data: {
            email: adminEmail,
            passwordHash: adminPasswordHash,
            roleId: adminRole.id,
          },
        });

        console.log("Initial ADMIN account created.");
      } else {
        if (existingAdmin.roleId !== adminRole.id) {
          await tx.user.update({
            where: {
              id: existingAdmin.id,
            },
            data: {
              roleId: adminRole.id,
            },
          });
        }

        console.log(
          "ADMIN account already exists. Password and status preserved.",
        );
      }
    }

    // ==========================================
    // 6. SEED SUMMARY
    // ==========================================

    console.log("Roles:", roles.length);
    console.log("Departments:", departments.length);
  }, {
    maxWait: 15_000,
    timeout: 60_000,
  });

  console.log(
    "Garments ERP database seeding completed successfully.",
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