"use client";

import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Boxes,
  History,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useInventoryStock,
  useLowStock,
  useStockHistory,
  useBinLocations,
} from "@/hooks/use-inventory";

import type {
  Stock,
  StockMovement,
  StockMovementType,
} from "@/types/inventory";
import StockOperationPanel from "@/components/inventory/stock-operation-panel";

type Tab = "stock" | "low-stock" | "history";

const number = (value: string | number) =>
  Number(value ?? 0).toLocaleString();

const date = (value: string) =>
  new Date(value).toLocaleString();

const movementLabel: Record<StockMovementType, string> = {
  RECEIVE: "Received",
  ISSUE: "Issued",
  TRANSFER: "Transferred",
  ADJUSTMENT: "Adjusted",
};

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("stock");
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("");
  const [page, setPage] = useState(1);
  const [historyType, setHistoryType] = useState("");

  const stockQuery = useInventoryStock({
    page,
    limit: 10,
    search: search || undefined,
    locationId: locationId || undefined,
  });

  const lowStockQuery = useLowStock();

  const historyQuery = useStockHistory({
    page,
    limit: 10,
    type: (historyType || undefined) as
      | StockMovementType
      | undefined,
  });

  const locationsQuery = useBinLocations();

  const stocks = stockQuery.data?.stocks ?? [];
  const lowStocks = lowStockQuery.data ?? [];
  const movements = historyQuery.data?.movements ?? [];

  const stockPagination = stockQuery.data?.pagination;
  const historyPagination = historyQuery.data?.pagination;

  const totalStockQuantity = useMemo(
    () =>
      stocks.reduce(
        (total, stock) => total + Number(stock.quantity),
        0,
      ),
    [stocks],
  );

  const isLoading =
    tab === "stock"
      ? stockQuery.isLoading
      : tab === "low-stock"
        ? lowStockQuery.isLoading
        : historyQuery.isLoading;

  const error =
    tab === "stock"
      ? stockQuery.error
      : tab === "low-stock"
        ? lowStockQuery.error
        : historyQuery.error;

  const refresh = () => {
    if (tab === "stock") void stockQuery.refetch();
    if (tab === "low-stock") void lowStockQuery.refetch();
    if (tab === "history") void historyQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor stock levels, manage stock operations and track movements.
          </p>
        </div>

        <button
          onClick={refresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Stock Records"
          value={stockPagination?.total ?? "—"}
          icon={<Package className="size-5" />}
          description="Records in inventory"
        />

        <MetricCard
          title="Current Page Quantity"
          value={number(totalStockQuantity)}
          icon={<Boxes className="size-5" />}
          description="Quantity on this page only"
        />

        <MetricCard
          title="Low Stock Records"
          value={lowStocks.length}
          icon={<AlertTriangle className="size-5" />}
          description="Records at or below minimum"
          warning
        />

        <MetricCard
          title="Movement Records"
          value={historyPagination?.total ?? "—"}
          icon={<History className="size-5" />}
          description="Stock movement history"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <TabButton
            active={tab === "stock"}
            onClick={() => {
              setTab("stock");
              setPage(1);
            }}
          >
            <Package className="size-4" />
            All Stock
          </TabButton>

          <TabButton
            active={tab === "low-stock"}
            onClick={() => {
              setTab("low-stock");
              setPage(1);
            }}
          >
            <AlertTriangle className="size-4" />
            Low Stock
          </TabButton>

          <TabButton
            active={tab === "history"}
            onClick={() => {
              setTab("history");
              setPage(1);
            }}
          >
            <History className="size-4" />
            Stock History
          </TabButton>
        </div>

        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search product name or SKU..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {tab === "stock" && (
            <select
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All BIN locations</option>
              {locationsQuery.data?.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          )}

          {tab === "history" && (
            <select
              value={historyType}
              onChange={(event) => {
                setHistoryType(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">All movement types</option>
              <option value="RECEIVE">Receive</option>
              <option value="ISSUE">Issue</option>
              <option value="TRANSFER">Transfer</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load inventory data.{" "}
            {error instanceof Error ? error.message : "Please try again."}
            <button
              onClick={refresh}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading inventory data...
          </div>
        ) : (
          <>
            {tab === "stock" && (
              <StockTable stocks={stocks} />
            )}

            {tab === "low-stock" && (
              <StockTable stocks={lowStocks} />
            )}

            {tab === "history" && (
              <HistoryTable movements={movements} />
            )}
          </>
        )}

        {!isLoading && !error && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {tab === "low-stock"
                ? `${lowStocks.length} low stock records`
                : `Page ${page} of ${
                    tab === "history"
                      ? historyPagination?.totalPages ?? 1
                      : stockPagination?.totalPages ?? 1
                  }`}
            </p>

            {tab !== "low-stock" && (
              <div className="flex gap-2">
                <button
                  disabled={
                    tab === "history"
                      ? !historyPagination?.hasPreviousPage
                      : !stockPagination?.hasPreviousPage
                  }
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={
                    tab === "history"
                      ? !historyPagination?.hasNextPage
                      : !stockPagination?.hasNextPage
                  }
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <StockOperationPanel />
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  description,
  warning = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        <span
          className={`rounded-lg p-2 ${
            warning
              ? "bg-amber-500/10 text-amber-600"
              : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function StockTable({ stocks }: { stocks: Stock[] }) {
  if (!stocks.length) {
    return (
      <EmptyState message="No stock records found." />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Batch</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3 text-right">Quantity</th>
            <th className="px-4 py-3 text-right">Minimum</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {stocks.map((stock) => {
            const quantity = Number(stock.quantity);
            const minimum = Number(stock.minimumStock);
            const low = minimum > 0 && quantity <= minimum;

            return (
              <tr key={stock.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  {stock.product.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {stock.product.sku}
                </td>
                <td className="px-4 py-3">
                  {stock.product.category?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {stock.batchLot.batchNo}
                </td>
                <td className="px-4 py-3">
                  <div>{stock.location.name}</div>
                  <span className="text-xs text-muted-foreground">
                    {stock.location.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {number(quantity)}{" "}
                  {stock.product.unit?.code ?? ""}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {number(minimum)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      low
                        ? "bg-amber-500/10 text-amber-700"
                        : "bg-emerald-500/10 text-emerald-700"
                    }`}
                  >
                    {low ? "Low Stock" : "In Stock"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({
  movements,
}: {
  movements: StockMovement[];
}) {
  if (!movements.length) {
    return <EmptyState message="No stock movements found." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Movement</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Batch</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3 text-right">Quantity</th>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {movements.map((movement) => (
            <tr key={movement.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">
                {movement.movementNo}
              </td>
              <td className="px-4 py-3">
                {movement.product.name}
                <div className="text-xs text-muted-foreground">
                  {movement.product.sku}
                </div>
              </td>
              <td className="px-4 py-3">
                {movement.batchLot.batchNo}
              </td>
              <td className="px-4 py-3">
                {movementLabel[movement.type]}
              </td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                {number(movement.quantity)}
              </td>
              <td className="px-4 py-3">
                {movement.referenceNo ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {date(movement.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Package className="size-6 text-muted-foreground" />
      </div>
      <p className="mt-4 font-medium">{message}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Try changing your search or filters.
      </p>
    </div>
  );
}


