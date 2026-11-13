// backend/prisma/demo-seed.ts

import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";

const roles = [
  {
    name: "Owner",
    code: "OWNER",
    description: "Full access to all business modules and settings",
  },
  {
    name: "Administrator",
    code: "ADMIN",
    description: "Management and system administration",
  },
  {
    name: "Manager",
    code: "MANAGER",
    description: "Production and warehouse management",
  },
  {
    name: "Employee",
    code: "EMPLOYEE",
    description: "Assigned operational access",
  },
  {
    name: "Accountant",
    code: "ACCOUNTANT",
    description: "Finance and payroll management",
  },
  {
    name: "Storekeeper",
    code: "STOREKEEPER",
    description: "Inventory and stock operations",
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
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error("OWNER_EMAIL and OWNER_PASSWORD are required.");
  }

  if (ownerPassword.length < 12) {
    throw new Error("OWNER_PASSWORD must be at least 12 characters.");
  }

  console.log("Starting demo database seed...");

  // 1. Roles
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
        isActive: true,
      },
      create: {
        ...role,
        isSystem: true,
        isActive: true,
      },
    });
  }

  const ownerRole = await prisma.role.findUniqueOrThrow({
    where: { code: "OWNER" },
  });

  // 2. Owner account
  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  let ownerId: string;

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);

    const owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        roleId: ownerRole.id,
        status: "ACTIVE",
      },
    });

    ownerId = owner.id;
    console.log("OWNER account created.");
  } else {
    // Do not overwrite existing password or account status.
    const owner = await prisma.user.update({
      where: { id: existingOwner.id },
      data: { roleId: ownerRole.id },
    });

    ownerId = owner.id;
    console.log("Existing OWNER account preserved.");
  }

  // 3. Departments
  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
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

  // 4. Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { code: "WH-DHAKA-01" },
    update: {},
    create: {
      name: "Main Factory Warehouse",
      code: "WH-DHAKA-01",
      description: "Main raw materials and inventory warehouse",
    },
  });

  // 5. Warehouse location
  const location = await prisma.warehouseLocation.upsert({
    where: {
      warehouseId_code: {
        warehouseId: warehouse.id,
        code: "RACK-A01",
      },
    },
    update: {},
    create: {
      name: "Rack A01",
      code: "RACK-A01",
      type: "RACK",
      warehouseId: warehouse.id,
    },
  });

  // 6. Product categories
  const categories = [
    { name: "Fabric", code: "FABRIC" },
    { name: "Accessories", code: "ACCESSORIES" },
    { name: "Packaging", code: "PACKAGING" },
  ];

  for (const category of categories) {
    await prisma.productCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }

  // 7. Units
  const units = [
    { name: "Kilogram", code: "KG" },
    { name: "Piece", code: "PCS" },
    { name: "Meter", code: "MTR" },
  ];

  for (const unit of units) {
    await prisma.unitOfMeasure.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }

  const fabricCategory = await prisma.productCategory.findUniqueOrThrow({
    where: { code: "FABRIC" },
  });

  const accessoriesCategory =
    await prisma.productCategory.findUniqueOrThrow({
      where: { code: "ACCESSORIES" },
    });

  const packagingCategory = await prisma.productCategory.findUniqueOrThrow({
    where: { code: "PACKAGING" },
  });

  const kg = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "KG" },
  });

  const pcs = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "PCS" },
  });

  const meter = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "MTR" },
  });

  // 8. Products
  const productDefinitions = [
    {
      name: "Cotton Fabric",
      sku: "FAB-COT-001",
      categoryId: fabricCategory.id,
      unitId: kg.id,
    },
    {
      name: "Polyester Fabric",
      sku: "FAB-POL-002",
      categoryId: fabricCategory.id,
      unitId: meter.id,
    },
    {
      name: "Sewing Thread",
      sku: "ACC-THR-001",
      categoryId: accessoriesCategory.id,
      unitId: pcs.id,
    },
    {
      name: "Buttons",
      sku: "ACC-BTN-001",
      categoryId: accessoriesCategory.id,
      unitId: pcs.id,
    },
    {
      name: "Carton Box",
      sku: "PKG-BOX-001",
      categoryId: packagingCategory.id,
      unitId: pcs.id,
    },
  ];

  const products = [];

  for (const product of productDefinitions) {
    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });

    products.push(saved);
  }

  // 9. Batch lots and inventory
  const stockDefinitions = [
    { sku: "FAB-COT-001", quantity: 850, minimumStock: 200 },
    { sku: "FAB-POL-002", quantity: 420, minimumStock: 150 },
    { sku: "ACC-THR-001", quantity: 75, minimumStock: 100 },
    { sku: "ACC-BTN-001", quantity: 1200, minimumStock: 300 },
    { sku: "PKG-BOX-001", quantity: 500, minimumStock: 100 },
  ];

  const batches = [];

  for (const item of stockDefinitions) {
    const product = products.find((p) => p.sku === item.sku);

    if (!product) {
      throw new Error(`Product not found: ${item.sku}`);
    }

    const batch = await prisma.batchLot.upsert({
      where: {
        productId_batchNo: {
          productId: product.id,
          batchNo: `DEMO-${item.sku}`,
        },
      },
      update: {},
      create: {
        productId: product.id,
        batchNo: `DEMO-${item.sku}`,
        description: "Demo seed inventory batch",
      },
    });

    batches.push({ product, batch, ...item });

    await prisma.inventoryStock.upsert({
      where: {
        productId_locationId_batchLotId: {
          productId: product.id,
          locationId: location.id,
          batchLotId: batch.id,
        },
      },
      update: {},
      create: {
        productId: product.id,
        locationId: location.id,
        batchLotId: batch.id,
        quantity: item.quantity,
        minimumStock: item.minimumStock,
      },
    });
  }

  // 10. Buying house
  const buyingHouse = await prisma.buyingHouse.upsert({
    where: { code: "BH-DEMO-001" },
    update: {},
    create: {
      code: "BH-DEMO-001",
      name: "Global Fashion Buying House",
      companyName: "Global Fashion Ltd.",
      country: "Bangladesh",
      contactPerson: "Demo Contact",
      phone: "+8801700000001",
      email: "buying@example.com",
    },
  });

  // 11. Buyer
  const buyer = await prisma.buyer.upsert({
    where: { buyerCode: "BUY-DEMO-001" },
    update: {},
    create: {
      buyerCode: "BUY-DEMO-001",
      name: "International Fashion Buyer",
      companyName: "Global Fashion Ltd.",
      country: "Germany",
      buyingHouseId: buyingHouse.id,
      contactPerson: "Demo Buyer",
      email: "buyer@example.com",
    },
  });

  // 12. Production orders
  const orderDefinitions = [
    { number: "DEMO-PO-001", status: "PENDING", quantity: 10000 },
    { number: "DEMO-PO-002", status: "CUTTING", quantity: 8000 },
    { number: "DEMO-PO-003", status: "SEWING", quantity: 12000 },
    { number: "DEMO-PO-004", status: "QC", quantity: 6000 },
    { number: "DEMO-PO-005", status: "COMPLETED", quantity: 5000 },
    { number: "DEMO-PO-006", status: "SHIPPED", quantity: 9000 },
    { number: "DEMO-PO-007", status: "DELIVERED", quantity: 7000 },
  ] as const;

  const productionOrders = [];

  for (let index = 0; index < orderDefinitions.length; index++) {
    const definition = orderDefinitions[index];
    const product = products[index % products.length];

    const order = await prisma.productionOrder.upsert({
      where: { orderNumber: definition.number },
      update: {},
      create: {
        orderNumber: definition.number,
        buyingHouseId: buyingHouse.id,
        buyerId: buyer.id,
        productId: product.id,
        styleNumber: `STYLE-DEMO-${index + 1}`,
        orderQuantity: definition.quantity,
        fabricRequirement: definition.quantity * 0.25,
        cuttingQuantity:
          definition.status === "PENDING" ? 0 : definition.quantity * 0.8,
        sewingQuantity:
          ["SEWING", "QC", "COMPLETED", "SHIPPED", "DELIVERED"].includes(
            definition.status,
          )
            ? definition.quantity * 0.7
            : 0,
        rejectedQuantity:
          ["QC", "COMPLETED", "SHIPPED", "DELIVERED"].includes(
            definition.status,
          )
            ? 50
            : 0,
        finishedGoodsQuantity:
          ["COMPLETED", "SHIPPED", "DELIVERED"].includes(definition.status)
            ? definition.quantity * 0.65
            : 0,
        targetPrice: 450,
        orderValue: definition.quantity * 450,
        orderDate: new Date(Date.now() - (index + 1) * 86400000),
        deliveryDate: new Date(Date.now() + (index + 15) * 86400000),
        status: definition.status,
        shipmentStatus:
          definition.status === "SHIPPED"
            ? "SHIPPED"
            : definition.status === "DELIVERED"
              ? "DELIVERED"
              : "NOT_SHIPPED",
        createdById: ownerId,
        notes: "Demo data created by demo seed.",
      },
    });

    productionOrders.push(order);
  }

  // 13. Stock movements
  for (let index = 0; index < batches.length; index++) {
    const item = batches[index];

    await prisma.stockMovement.upsert({
      where: { movementNo: `DEMO-MOV-${index + 1}` },
      update: {},
      create: {
        movementNo: `DEMO-MOV-${index + 1}`,
        type: "RECEIVE",
        productId: item.product.id,
        batchLotId: item.batch.id,
        toLocationId: location.id,
        quantity: item.quantity,
        referenceNo: `DEMO-RECEIVE-${index + 1}`,
        note: "Demo opening stock",
        createdById: ownerId,
      },
    });
  }

  // 14. Notifications
  const notification = await prisma.notification.findFirst({
    where: {
      recipientId: ownerId,
      title: "Demo seed completed",
    },
  });

  if (!notification) {
    await prisma.notification.create({
      data: {
        recipientId: ownerId,
        title: "Demo seed completed",
        message: "Your Garments ERP demo data is ready.",
        type: "GENERAL",
      },
    });
  }

  console.log("-----------------------------------");
  console.log("Demo seed completed successfully.");
  console.log("OWNER:", ownerEmail);
  console.log("Roles:", roles.length);
  console.log("Departments:", departments.length);
  console.log("Products:", products.length);
  console.log("Production orders:", productionOrders.length);
  console.log("Stock records:", batches.length);
  console.log("-----------------------------------");
}

seed()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });