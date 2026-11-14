"use client";

import { useParams } from "next/navigation";

export default function PurchaseOrderDetailsPage() {
  const params = useParams<{ purchaseOrderId: string }>();

  const purchaseOrderId = params.purchaseOrderId;

  return (
    <div>
      <h1>Purchase Order Details</h1>
      <p>Purchase Order ID: {purchaseOrderId}</p>
    </div>
  );
}