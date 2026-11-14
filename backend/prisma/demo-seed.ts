import "dotenv/config";
import bcrypt from "bcrypt";
import type { RawMaterialType } from "../src/generated/prisma/client.js";
import { prisma } from "../src/lib/prisma.js";

/**
 * Safe demo data seed for the Garments Factory ERP.
 *
 * - Does NOT delete or truncate existing records.
 * - Uses unique business keys + upsert so it can be run repeatedly.
 * - Creates records inside the current dashboard date range.
 * - Uses the configured OWNER_EMAIL / OWNER_PASSWORD for the Owner account.
 *
 * Run from the backend directory:
 *   npx tsx prisma/demo-seed.ts
 */

const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysAhead = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

const roleData = [
  ["Owner", "OWNER", "Full system access"],
  ["Administrator", "ADMIN", "Administration and configuration"],
  ["Manager", "MANAGER", "Operations and production management"],
  ["Accountant", "ACCOUNTANT", "Payroll and supplier payment records"],
  ["Storekeeper", "STOREKEEPER", "Inventory and warehouse operations"],
  ["Employee", "EMPLOYEE", "Assigned operational access"],
] as const;

const departmentData = [
  ["Administration", "ADMIN"],
  ["Cutting", "CUT"],
  ["Sewing", "SEW"],
  ["Quality Control", "QC"],
  ["Finishing", "FIN"],
  ["Store", "STORE"],
  ["Accounts", "ACC"],
  ["Packing", "PACK"],
  ["Maintenance", "MAINT"],
  ["Human Resources", "HR"],
] as const;

const categoryData = [
  ["Fabrics", "FABRIC"],
  ["Accessories", "ACCESS"],
  ["Threads", "THREAD"],
  ["Buttons", "BUTTON"],
  ["Zippers", "ZIPPER"],
  ["Labels", "LABEL"],
  ["Packaging", "PACK"],
  ["Garments", "GARMENT"],
  ["Trims", "TRIM"],
  ["Chemicals", "CHEM"],
] as const;

const unitData = [
  ["Kilogram", "KG"],
  ["Meter", "MTR"],
  ["Piece", "PCS"],
  ["Yard", "YARD"],
  ["Roll", "ROLL"],
  ["Cone", "CONE"],
  ["Box", "BOX"],
  ["Dozen", "DOZ"],
  ["Liter", "LTR"],
  ["Set", "SET"],
] as const;

const productData = [
  ["Cotton Single Jersey Fabric", "FAB-001", "FABRIC", "KG"],
  ["Polyester Mesh Fabric", "FAB-002", "FABRIC", "KG"],
  ["Rib Knit Fabric", "FAB-003", "FABRIC", "KG"],
  ["Sewing Thread 40/2", "THR-001", "THREAD", "CONE"],
  ["Polyester Sewing Thread", "THR-002", "THREAD", "CONE"],
  ["Plastic Button 18L", "BTN-001", "BUTTON", "PCS"],
  ["Metal Jeans Button", "BTN-002", "BUTTON", "PCS"],
  ["Nylon Zipper", "ZIP-001", "ZIPPER", "PCS"],
  ["Woven Brand Label", "LBL-001", "LABEL", "PCS"],
  ["Carton Packaging Box", "PKG-001", "PACK", "PCS"],
  ["Elastic Waistband", "TRM-001", "TRIM", "MTR"],
  ["Printed Care Label", "LBL-002", "LABEL", "PCS"],
] as const;

const warehouseData = [
  ["Main Raw Material Warehouse", "WH-RAW"],
  ["Fabric Warehouse", "WH-FAB"],
  ["Accessories Warehouse", "WH-ACC"],
  ["Thread Warehouse", "WH-THR"],
  ["Cutting Store", "WH-CUT"],
  ["Sewing Store", "WH-SEW"],
  ["Finishing Warehouse", "WH-FIN"],
  ["Packing Warehouse", "WH-PACK"],
  ["Finished Goods Warehouse", "WH-FG"],
  ["Export Dispatch Warehouse", "WH-EXP"],
] as const;

const supplierData = [
  ["SUP-001", "TexWorld Supplies", "TexWorld Ltd.", "MANUFACTURER"],
  ["SUP-002", "Global Fabric House", "Global Fabric Ltd.", "WHOLESALER"],
  ["SUP-003", "Smart Thread BD", "Smart Thread Industries", "MANUFACTURER"],
  ["SUP-004", "Button & Trim Source", "BTS Trading", "DISTRIBUTOR"],
  ["SUP-005", "ZipPro Bangladesh", "ZipPro Ltd.", "MANUFACTURER"],
  ["SUP-006", "Label Craft", "Label Craft BD", "MANUFACTURER"],
  ["SUP-007", "PackRight Industries", "PackRight Ltd.", "MANUFACTURER"],
  ["SUP-008", "Prime Accessories", "Prime Accessories BD", "TRADER"],
  ["SUP-009", "Knit Materials Ltd.", "Knit Materials", "WHOLESALER"],
  ["SUP-010", "Eastern Textile Supply", "Eastern Textile", "DISTRIBUTOR"],
] as const;

const buyingHouseData = [
  ["BH-001", "Northstar Buying House", "Northstar Sourcing", "Bangladesh"],
  ["BH-002", "Global Apparel Sourcing", "Global Apparel", "United States"],
  ["BH-003", "EuroTex Buying", "EuroTex GmbH", "Germany"],
  ["BH-004", "Pacific Garment Partners", "Pacific Partners", "Australia"],
  ["BH-005", "Fashion Link BD", "Fashion Link", "Bangladesh"],
  ["BH-006", "UrbanWear Sourcing", "UrbanWear", "United Kingdom"],
  ["BH-007", "Asia Clothing Network", "Asia Clothing", "Singapore"],
  ["BH-008", "BlueRiver Buying House", "BlueRiver Group", "Netherlands"],
  ["BH-009", "Modern Stitch Sourcing", "Modern Stitch", "Canada"],
  ["BH-010", "Evergreen Apparel", "Evergreen Group", "Sweden"],
] as const;

const productionStatuses = [
  "PENDING",
  "CUTTING",
  "SEWING",
  "QC",
  "COMPLETED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "CUTTING",
  "SEWING",
] as const;

const shipmentStatuses = [
  "NOT_SHIPPED",
  "NOT_SHIPPED",
  "NOT_SHIPPED",
  "NOT_SHIPPED",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "NOT_SHIPPED",
  "NOT_SHIPPED",
  "NOT_SHIPPED",
] as const;

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD in backend/.env first.");
  }
  if (ownerPassword.length < 12) {
    throw new Error("OWNER_PASSWORD must be at least 12 characters.");
  }

  console.log("Starting non-destructive Garments ERP demo seed...");

  // 1. Roles and Owner account
  const roles = new Map<string, string>();
  for (const [name, code, description] of roleData) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name, description, isSystem: true, isActive: true },
      create: { name, code, description, isSystem: true, isActive: true },
    });
    roles.set(code, role.id);
  }

  const ownerRoleId = roles.get("OWNER");
  if (!ownerRoleId) throw new Error("OWNER role could not be created.");

  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail },
  });

  let ownerId: string;
  if (existingOwner) {
    const owner = await prisma.user.update({
      where: { id: existingOwner.id },
      data: { roleId: ownerRoleId, status: "ACTIVE" },
    });
    ownerId = owner.id;
    console.log("Existing Owner account preserved; role/status verified.");
  } else {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    const owner = await prisma.user.create({
      data: { email: ownerEmail, passwordHash, roleId: ownerRoleId },
    });
    ownerId = owner.id;
    console.log("Owner account created from OWNER_EMAIL / OWNER_PASSWORD.");
  }

  // 2. Departments
  const departments = [];
  for (const [name, code] of departmentData) {
    const existingDepartment = await prisma.department.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });

    departments.push(
      existingDepartment
        ? await prisma.department.update({
            where: { id: existingDepartment.id },
            data: { isActive: true },
          })
        : await prisma.department.create({
            data: {
              name,
              code,
              isActive: true,
              description: `${name} department`,
            },
          }),
    );
  }

  // 3. Product categories and units
  const categories = new Map<string, string>();
  for (const [name, code] of categoryData) {
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });
    const category = existingCategory
      ? await prisma.productCategory.update({
          where: { id: existingCategory.id },
          data: { isActive: true },
        })
      : await prisma.productCategory.create({
          data: {
            name,
            code,
            isActive: true,
            description: `${name} materials and items`,
          },
        });
    categories.set(code, category.id);
  }

  const units = new Map<string, string>();
  for (const [name, code] of unitData) {
    const existingUnit = await prisma.unitOfMeasure.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });
    const unit = existingUnit
      ? await prisma.unitOfMeasure.update({
          where: { id: existingUnit.id },
          data: { isActive: true },
        })
      : await prisma.unitOfMeasure.create({
          data: { name, code, isActive: true },
        });
    units.set(code, unit.id);
  }

  // 4. Products (12)
  const products = [];
  for (const [name, sku, categoryCode, unitCode] of productData) {
    const categoryId = categories.get(categoryCode);
    const unitId = units.get(unitCode);
    if (!categoryId || !unitId) throw new Error(`Missing category/unit for ${sku}`);

    products.push(
      await prisma.product.upsert({
        where: { sku },
        update: { name, categoryId, unitId, isActive: true },
        create: {
          name,
          sku,
          categoryId,
          unitId,
          isActive: true,
          description: `Demo inventory item: ${name}`,
        },
      }),
    );
  }

  // 5. Warehouses and 3 locations in each warehouse
  const warehouses = [];
  const locations: Array<{ id: string; warehouseId: string; code: string }> = [];
  for (const [name, code] of warehouseData) {
    const warehouse = await prisma.warehouse.upsert({
      where: { code },
      update: { name, isActive: true },
      create: { name, code, isActive: true, description: `${name} - demo warehouse` },
    });
    warehouses.push(warehouse);

    const locationDefinitions = [
      { name: "Rack A", code: `${code}-R1`, type: "RACK" as const },
      { name: "Shelf A1", code: `${code}-S1`, type: "SHELF" as const },
      { name: "Bin A1-01", code: `${code}-B1`, type: "BIN" as const },
    ];

    let rackId: string | undefined;
    let shelfId: string | undefined;
    for (const definition of locationDefinitions) {
      const location = await prisma.warehouseLocation.upsert({
        where: {
          warehouseId_code: { warehouseId: warehouse.id, code: definition.code },
        },
        update: {
          name: definition.name,
          type: definition.type,
          parentId:
            definition.type === "SHELF"
              ? rackId
              : definition.type === "BIN"
                ? shelfId
                : null,
        },
        create: {
          name: definition.name,
          code: definition.code,
          type: definition.type,
          warehouseId: warehouse.id,
          parentId:
            definition.type === "SHELF"
              ? rackId
              : definition.type === "BIN"
                ? shelfId
                : null,
        },
      });
      if (definition.type === "RACK") rackId = location.id;
      if (definition.type === "SHELF") shelfId = location.id;
      locations.push({ id: location.id, warehouseId: warehouse.id, code: location.code });
    }
  }

  // 6. Employees (12) - employee rows only; no demo login accounts/passwords.
  for (let i = 0; i < 12; i++) {
    const department = departments[i % departments.length];
    const employeeCode = `EMP-DEMO-${String(i + 1).padStart(3, "0")}`;
    await prisma.employee.upsert({
      where: { employeeCode },
      update: {
        firstName: ["Aminul", "Nusrat", "Sabbir", "Farzana", "Rakib", "Sumaiya"][i % 6],
        lastName: ["Hasan", "Akter", "Rahman", "Islam"][i % 4],
        designation: ["Production Officer", "Store Assistant", "QC Inspector", "Line Supervisor"][i % 4],
        departmentId: department.id,
        status: i === 9 ? "ON_LEAVE" : i === 10 ? "INACTIVE" : "ACTIVE",
      },
      create: {
        employeeCode,
        firstName: ["Aminul", "Nusrat", "Sabbir", "Farzana", "Rakib", "Sumaiya"][i % 6],
        lastName: ["Hasan", "Akter", "Rahman", "Islam"][i % 4],
        email: `employee.demo.${i + 1}@example.com`,
        phone: `0170000${String(i + 1).padStart(4, "0")}`,
        designation: ["Production Officer", "Store Assistant", "QC Inspector", "Line Supervisor"][i % 4],
        employmentType: i % 4 === 0 ? "CONTRACT" : "FULL_TIME",
        joiningDate: daysAgo(120 + i * 15),
        status: i === 9 ? "ON_LEAVE" : i === 10 ? "INACTIVE" : "ACTIVE",
        departmentId: department.id,
      },
    });
  }

  // 7. Suppliers (10)
  const supplierRawMaterialTypes: RawMaterialType[][] = [
    ["FABRIC"],
    ["THREAD"],
    ["BUTTON", "ZIPPER"],
    ["ACCESSORIES"],
  ];
  const suppliers = [];
  for (let i = 0; i < supplierData.length; i++) {
    const [supplierCode, supplierName, companyName, supplierType] = supplierData[i];
    suppliers.push(
      await prisma.supplier.upsert({
        where: { supplierCode },
        update: { supplierName, companyName, supplierType, isActive: true },
        create: {
          supplierCode,
          supplierName,
          companyName,
          supplierType,
          phone: `0181000${String(i + 1).padStart(4, "0")}`,
          email: `supplier${i + 1}@example.com`,
          contactPerson: `Contact Person ${i + 1}`,
          address: `Industrial Area, Dhaka, Bangladesh`,
          rawMaterialTypes: supplierRawMaterialTypes[i % supplierRawMaterialTypes.length],
          isActive: true,
        },
      }),
    );
  }

  // 8. Buying houses and buyers (10 each)
  const buyingHouses = [];
  const buyers = [];
  for (let i = 0; i < buyingHouseData.length; i++) {
    const [code, name, companyName, country] = buyingHouseData[i];
    const house = await prisma.buyingHouse.upsert({
      where: { code },
      update: { name, companyName, country, isActive: true },
      create: {
        code,
        name,
        companyName,
        country,
        address: `Business District, ${country}`,
        contactPerson: `Sourcing Manager ${i + 1}`,
        phone: `0192000${String(i + 1).padStart(4, "0")}`,
        email: `buyinghouse${i + 1}@example.com`,
        isActive: true,
      },
    });
    buyingHouses.push(house);

    const buyerCode = `BUYER-${String(i + 1).padStart(3, "0")}`;
    buyers.push(
      await prisma.buyer.upsert({
        where: { buyerCode },
        update: { name: `Buyer Contact ${i + 1}`, buyingHouseId: house.id, isActive: true },
        create: {
          buyerCode,
          name: `Buyer Contact ${i + 1}`,
          companyName: `${companyName} Retail`,
          country,
          contactPerson: `Buyer Contact ${i + 1}`,
          designation: "Merchandising Manager",
          email: `buyer${i + 1}@example.com`,
          phone: `0163000${String(i + 1).padStart(4, "0")}`,
          buyingHouseId: house.id,
          isActive: true,
        },
      }),
    );
  }

  // 9. Batch lots and inventory stocks (12 products, 20 stock rows)
  const batchLots = [];
  for (let i = 0; i < products.length; i++) {
    const batchNo = `DEMO-BATCH-${String(i + 1).padStart(3, "0")}`;
    batchLots.push(
      await prisma.batchLot.upsert({
        where: { productId_batchNo: { productId: products[i].id, batchNo } },
        update: { isActive: true, expiryDate: daysAhead(365) },
        create: {
          productId: products[i].id,
          batchNo,
          receivedAt: daysAgo(20 + i),
          expiryDate: daysAhead(365),
          description: `Demo batch for ${products[i].sku}`,
          isActive: true,
        },
      }),
    );
  }

  for (let i = 0; i < 20; i++) {
    const productIndex = i % products.length;
    const locationIndex = i % locations.length;
    const product = products[productIndex];
    const batch = batchLots[productIndex];
    const location = locations[locationIndex];
    const quantity = i % 5 === 0 ? 5 + i : 150 + i * 37;
    const minimumStock = i % 5 === 0 ? 20 : 40;

    await prisma.inventoryStock.upsert({
      where: {
        productId_locationId_batchLotId: {
          productId: product.id,
          locationId: location.id,
          batchLotId: batch.id,
        },
      },
      update: { quantity: String(quantity), minimumStock: String(minimumStock) },
      create: {
        productId: product.id,
        locationId: location.id,
        batchLotId: batch.id,
        quantity: String(quantity),
        minimumStock: String(minimumStock),
      },
    });
  }

  // 10. Stock movements (20) - dates fall inside the last 30 days.
  const movementTypes = ["RECEIVE", "ISSUE", "TRANSFER", "ADJUSTMENT"] as const;
  for (let i = 0; i < 20; i++) {
    const productIndex = i % products.length;
    const from = locations[i % locations.length];
    const to = locations[(i + 1) % locations.length];
    const type = movementTypes[i % movementTypes.length];
    const movementNo = `DEMO-MOV-${String(i + 1).padStart(4, "0")}`;

    await prisma.stockMovement.upsert({
      where: { movementNo },
      update: { type, quantity: String(25 + i * 3), note: "Demo dashboard stock movement" },
      create: {
        movementNo,
        type,
        productId: products[productIndex].id,
        batchLotId: batchLots[productIndex].id,
        fromLocationId: type === "RECEIVE" ? null : from.id,
        toLocationId: type === "ISSUE" ? null : to.id,
        quantity: String(25 + i * 3),
        referenceNo: `DEMO-REF-${String(i + 1).padStart(4, "0")}`,
        note: "Demo dashboard stock movement",
        createdById: ownerId,
        createdAt: daysAgo(i),
      },
    });
  }

  // 11. Purchase orders (10) and their line items
  const poStatuses = [
    "DRAFT", "PENDING_APPROVAL", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED",
    "PENDING_APPROVAL", "APPROVED", "RECEIVED", "CANCELLED", "DRAFT",
  ] as const;

  for (let i = 0; i < 10; i++) {
    const poNumber = `DEMO-PO-${String(i + 1).padStart(4, "0")}`;
    const product = products[i % products.length];
    const supplier = suppliers[i % suppliers.length];
    const warehouse = warehouses[i % warehouses.length];
    const quantity = 100 + i * 25;
    const unitPrice = 120 + i * 8;
    const subtotal = quantity * unitPrice;

    const po = await prisma.purchaseOrder.upsert({
      where: { poNumber },
      update: {
        status: poStatuses[i],
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        subtotal: String(subtotal),
        totalAmount: String(subtotal),
      },
      create: {
        poNumber,
        supplierId: supplier.id,
        warehouseId: warehouse.id,
        orderDate: daysAgo(i + 1),
        expectedDeliveryDate: daysAhead(i + 7),
        status: poStatuses[i],
        subtotal: String(subtotal),
        discount: "0",
        tax: "0",
        totalAmount: String(subtotal),
        notes: "Demo purchase order for dashboard testing",
        createdById: ownerId,
        approvedById: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(poStatuses[i])
          ? ownerId
          : null,
        approvedAt: ["APPROVED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(poStatuses[i])
          ? daysAgo(i)
          : null,
      },
    });

    const existingItem = await prisma.purchaseOrderItem.findFirst({
      where: { purchaseOrderId: po.id, productId: product.id },
    });
    if (!existingItem) {
      await prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: po.id,
          productId: product.id,
          quantity: String(quantity),
          receivedQuantity: poStatuses[i] === "RECEIVED" ? String(quantity) : "0",
          unitPrice: String(unitPrice),
          lineTotal: String(subtotal),
        },
      });
    }
  }

  // 12. Production orders (10), with cutting/sewing/QC records for chart totals.
  const productionOrders = [];
  for (let i = 0; i < 10; i++) {
    const orderNumber = `DEMO-ORD-${String(i + 1).padStart(4, "0")}`;
    const orderQuantity = 1000 + i * 250;
    const status = productionStatuses[i];
    const shipmentStatus = shipmentStatuses[i];
    const product = products[i % products.length];
    const house = buyingHouses[i % buyingHouses.length];
    const buyer = buyers[i % buyers.length];
    const cuttingQuantity = i >= 1 ? orderQuantity * 0.8 : 0;
    const sewingQuantity = i >= 2 ? orderQuantity * 0.6 : 0;
    const rejectedQuantity = i >= 3 ? 12 + i * 3 : 0;
    const finishedGoodsQuantity = ["COMPLETED", "SHIPPED", "DELIVERED"].includes(status)
      ? orderQuantity - rejectedQuantity
      : 0;

    const order = await prisma.productionOrder.upsert({
      where: { orderNumber },
      update: {
        status,
        shipmentStatus,
        orderQuantity: String(orderQuantity),
        cuttingQuantity: String(cuttingQuantity),
        sewingQuantity: String(sewingQuantity),
        rejectedQuantity: String(rejectedQuantity),
        finishedGoodsQuantity: String(finishedGoodsQuantity),
      },
      create: {
        orderNumber,
        buyingHouseId: house.id,
        buyerId: buyer.id,
        productId: product.id,
        styleNumber: `STYLE-DEMO-${String(i + 1).padStart(3, "0")}`,
        orderQuantity: String(orderQuantity),
        fabricRequirement: String(orderQuantity * 0.18),
        fabricRequirementUnit: "KG",
        cuttingQuantity: String(cuttingQuantity),
        sewingQuantity: String(sewingQuantity),
        rejectedQuantity: String(rejectedQuantity),
        finishedGoodsQuantity: String(finishedGoodsQuantity),
        targetPrice: String(450 + i * 15),
        orderValue: String(orderQuantity * (450 + i * 15)),
        currency: "BDT",
        orderDate: daysAgo(i + 1),
        deliveryDate: daysAhead(15 + i * 3),
        status,
        shipmentStatus,
        notes: "Demo production order for dashboard visualization",
        createdById: ownerId,
      },
    });
    productionOrders.push(order);

    // Unique record numbers make these inserts repeat-safe.
    const cuttingNumber = `DEMO-CUT-${String(i + 1).padStart(4, "0")}`;
    if (!(await prisma.cuttingEntry.findUnique({ where: { cuttingNumber } }))) {
      await prisma.cuttingEntry.create({
        data: {
          cuttingNumber,
          productionOrderId: order.id,
          cuttingDate: daysAgo(i),
          cuttingQuantity: String(cuttingQuantity),
          fabricConsumed: String(orderQuantity * 0.16),
          fabricConsumedUnit: "KG",
          createdById: ownerId,
        },
      });
    }

    const sewingNumber = `DEMO-SEW-${String(i + 1).padStart(4, "0")}`;
    if (!(await prisma.sewingEntry.findUnique({ where: { sewingNumber } }))) {
      await prisma.sewingEntry.create({
        data: {
          sewingNumber,
          productionOrderId: order.id,
          sewingDate: daysAgo(Math.max(0, i - 1)),
          sewingLine: `Line ${((i % 5) + 1).toString()}`,
          sewingQuantity: String(sewingQuantity),
          createdById: ownerId,
        },
      });
    }

    const qcNumber = `DEMO-QC-${String(i + 1).padStart(4, "0")}`;
    if (!(await prisma.qCInspection.findUnique({ where: { qcNumber } }))) {
      await prisma.qCInspection.create({
        data: {
          qcNumber,
          productionOrderId: order.id,
          inspectionDate: daysAgo(Math.max(0, i - 2)),
          inspectedQuantity: String(sewingQuantity),
          passedQuantity: String(Math.max(0, sewingQuantity - rejectedQuantity)),
          rejectedQuantity: String(rejectedQuantity),
          reworkQuantity: "0",
          notes: "Demo QC inspection",
          createdById: ownerId,
        },
      });
    }
  }


  // 13. Shipment records (10) - feeds Owner/Manager shipment summaries.
  const shipmentRecordStatuses = [
    "PLANNED", "READY", "DISPATCHED", "DELIVERED", "CANCELLED",
    "PLANNED", "READY", "DISPATCHED", "DELIVERED", "PLANNED",
  ] as const;

  for (let i = 0; i < productionOrders.length; i++) {
    const shipmentNumber = `DEMO-SHIP-${String(i + 1).padStart(4, "0")}`;
    const status = shipmentRecordStatuses[i];
    await prisma.shipment.upsert({
      where: { shipmentNumber },
      update: {
        status,
        totalQuantity: String(300 + i * 50),
      },
      create: {
        shipmentNumber,
        productionOrderId: productionOrders[i].id,
        shipmentDate: i % 2 === 0 ? daysAgo(Math.max(0, i - 1)) : null,
        expectedDeliveryDate: daysAhead(10 + i),
        actualDeliveryDate: status === "DELIVERED" ? daysAgo(1) : null,
        shippingMethod: i % 2 === 0 ? "Sea Freight" : "Air Freight",
        carrierName: `Demo Logistics ${i + 1}`,
        trackingNumber: `DEMO-TRACK-${String(i + 1).padStart(4, "0")}`,
        destination: ["Hamburg, Germany", "London, United Kingdom", "New York, USA"][i % 3],
        status,
        totalQuantity: String(300 + i * 50),
        notes: "Demo shipment record",
        createdById: ownerId,
      },
    });
  }

  // 14. Supplier payments (10) - feeds Accountant dashboard aggregates.
  const paymentMethods = [
    "BANK_TRANSFER", "CASH", "CHEQUE", "MOBILE_BANKING", "OTHER",
  ] as const;
  for (let i = 0; i < 10; i++) {
    const paymentNo = `DEMO-PAY-${String(i + 1).padStart(4, "0")}`;
    await prisma.supplierPayment.upsert({
      where: { paymentNo },
      update: { amount: String(15000 + i * 2500), status: "COMPLETED" },
      create: {
        paymentNo,
        supplierId: suppliers[i].id,
        amount: String(15000 + i * 2500),
        currency: "BDT",
        paymentMethod: paymentMethods[i % paymentMethods.length],
        status: "COMPLETED",
        paymentDate: daysAgo(i + 1),
        transactionReference: `DEMO-TXN-${String(i + 1).padStart(4, "0")}`,
        notes: "Demo supplier payment",
        createdById: ownerId,
      },
    });
  }

  // 15. Payroll headers (10 months) - feeds Accountant dashboard aggregates.
  const payrollStatuses = [
    "PAID", "PAID", "APPROVED", "PAID", "DRAFT",
    "PAID", "APPROVED", "PAID", "CANCELLED", "PAID",
  ] as const;

  for (let month = 1; month <= 10; month++) {
    const basic = 850000 + month * 12500;
    const earnings = 95000 + month * 2500;
    const deductions = 42000 + month * 1000;
    const net = basic + earnings - deductions;

    await prisma.payroll.upsert({
      where: { year_month: { year: 2026, month } },
      update: {
        status: payrollStatuses[month - 1],
        totalBasicSalary: String(basic),
        totalEarnings: String(earnings),
        totalDeductions: String(deductions),
        totalNetSalary: String(net),
      },
      create: {
        year: 2026,
        month,
        currency: "BDT",
        status: payrollStatuses[month - 1],
        totalBasicSalary: String(basic),
        totalEarnings: String(earnings),
        totalDeductions: String(deductions),
        totalOvertime: String(25000 + month * 1000),
        totalBonus: String(30000 + month * 1500),
        totalNetSalary: String(net),
        generatedAt: new Date(2026, month - 1, 25),
        approvedAt: ["APPROVED", "PAID"].includes(payrollStatuses[month - 1])
          ? new Date(2026, month - 1, 26)
          : null,
        paidAt: payrollStatuses[month - 1] === "PAID"
          ? new Date(2026, month - 1, 28)
          : null,
      },
    });
  }

  // 16. Owner notifications (10), fixed IDs prevent duplicate notifications.
  const notificationTypes = [
    "INVENTORY", "PRODUCTION", "PURCHASE", "SHIPMENT", "HR",
    "PAYMENT", "GENERAL", "INVENTORY", "PRODUCTION", "PURCHASE",
  ];
  for (let i = 0; i < 10; i++) {
    const id = `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    await prisma.notification.upsert({
      where: { id },
      update: {
        recipientId: ownerId,
        isRead: i % 3 === 0,
        title: [
          "Low stock alert",
          "Production order updated",
          "Purchase order awaiting review",
          "Shipment status changed",
          "Employee record updated",
          "Supplier payment recorded",
          "Daily system summary",
          "Fabric stock received",
          "QC inspection completed",
          "New purchase order created",
        ][i],
      },
      create: {
        id,
        recipientId: ownerId,
        title: [
          "Low stock alert",
          "Production order updated",
          "Purchase order awaiting review",
          "Shipment status changed",
          "Employee record updated",
          "Supplier payment recorded",
          "Daily system summary",
          "Fabric stock received",
          "QC inspection completed",
          "New purchase order created",
        ][i],
        message: `Demo notification ${i + 1} for Owner dashboard testing.`,
        type: notificationTypes[i],
        actionUrl: "/owner/dashboard",
        isRead: i % 3 === 0,
        readAt: i % 3 === 0 ? daysAgo(i) : null,
        createdAt: daysAgo(i),
      },
    });
  }

  console.log("\nDemo seed completed successfully.");
  console.log("Created/verified:");
  console.log("- 6 roles and Owner account");
  console.log("- 10 departments");
  console.log("- 10 product categories and 10 units");
  console.log("- 12 products");
  console.log("- 10 warehouses and 30 warehouse locations");
  console.log("- 12 employees");
  console.log("- 10 suppliers");
  console.log("- 10 buying houses and 10 buyers");
  console.log("- 12 batch lots and 20 inventory stock rows");
  console.log("- 20 stock movements");
  console.log("- 10 purchase orders with line items");
  console.log("- 10 production orders, cutting entries, sewing entries and QC inspections");
  console.log("- 10 shipment records");
  console.log("- 10 supplier payments and 10 monthly payroll summaries");
  console.log("- 10 Owner notifications");
  console.log("\nNo existing records were deleted or truncated.");
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
