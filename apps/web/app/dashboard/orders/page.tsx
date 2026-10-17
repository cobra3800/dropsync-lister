
"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  externalOrderId: string;
  buyerUsername?: string;
  buyerName?: string;
  status: string;
  total: number;
  currency: string;
  title?: string;
  quantity: number;
createdAt: string;
shippingCarrier?: string | null;
trackingNumber?: string | null;
fulfillmentStatus?: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STORE_ID = "cmucyeton0000fj5o3qgbd0ot";

function statusColor(status: string) {
  const value = status.toUpperCase();

  if (value.includes("CANCEL")) {
    return "bg-red-100 text-red-700";
  }
  if (value.includes("SHIPPED") || value.includes("FULFILLED")) {
    return "bg-green-100 text-green-700";
  }
  if (value.includes("PAID") || value.includes("COMPLETE")) {
    return "bg-blue-100 text-blue-700";
  }
  return "bg-yellow-100 text-yellow-800";
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(Number(amount) || 0);
  } catch {
    return `${currency || "USD"} ${Number(amount || 0).toFixed(2)}`;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [shippingFilter, setShippingFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");

  const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState("");
  const [error, setError] = useState("");
const resetFilters = () => {
  setSearch("");
  setStatusFilter("ALL");
  setShippingFilter("ALL");
  setSortOrder("NEWEST");
  setCurrentPage(1);
};
  const loadOrders = async () => {
    const response = await fetch(`${API_URL}/orders`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Unable to load orders");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected orders response");
    }

    setOrders(data);
    return data as Order[];
  };

  useEffect(() => {
    loadOrders()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRefreshOrders = async () => {
    setRefreshing(true);
    setError("");
    setSyncMessage("");

    try {
      const data = await loadOrders();
      setSyncMessage(
        `Orders refreshed — ${data.length} order(s) found.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Refresh failed"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncEbay = async () => {
    setSyncing(true);
    setError("");
    setSyncMessage("");

    try {
      const response = await fetch(`${API_URL}/orders/sync/ebay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storeId: STORE_ID }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync eBay orders");
      }

      await response.json();
      const updatedOrders = await loadOrders();

      setSyncMessage(
        updatedOrders.length === 0
          ? "Sync complete — no eBay orders found."
          : `Sync complete — ${updatedOrders.length} total order(s) loaded.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "eBay sync failed"
      );
    } finally {
      setSyncing(false);
    }
  };

  const statuses = useMemo(
    () => [...new Set(orders.map((order) => order.status))],
    [orders]
  );

const filteredOrders = useMemo(() => {
  const term = search.toLowerCase().trim();

  return orders.filter((order) => {
    const matchesSearch =
      !term ||
      (order.title || "").toLowerCase().includes(term) ||
      order.externalOrderId.toLowerCase().includes(term) ||
      (order.buyerUsername || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;

    const matchesShipping =
      shippingFilter === "ALL" ||
      (order.fulfillmentStatus || "NOT_SHIPPED") === shippingFilter;

    return matchesSearch && matchesStatus && matchesShipping;
  });
}, [orders, search, statusFilter, shippingFilter]);

const sortedOrders = useMemo(() => {
  return [...filteredOrders].sort((a, b) => {
    if (sortOrder === "HIGHEST") {
      return Number(b.total) - Number(a.total);
    }

    if (sortOrder === "LOWEST") {
      return Number(a.total) - Number(b.total);
    }

    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    if (sortOrder === "OLDEST") {
      return dateA - dateB;
    }

    return dateB - dateA;
  });
}, [filteredOrders, sortOrder]);
const totalPages = Math.max(
  1,
  Math.ceil(sortedOrders.length / pageSize)
);

const safeCurrentPage = Math.min(currentPage, totalPages);

const paginatedOrders = sortedOrders.slice(
  (safeCurrentPage - 1) * pageSize,
  safeCurrentPage * pageSize
);
  const activeOrders = orders.filter(
    (order) => !order.status.toUpperCase().includes("CANCEL")
  );

  const salesByCurrency = activeOrders.reduce<Record<string, number>>(
    (totals, order) => {
      const currency = order.currency || "USD";
      totals[currency] =
        (totals[currency] || 0) + (Number(order.total) || 0);
      return totals;
    },
    {}
  );


const ordersAwaitingShipment = activeOrders.filter((order) => {
  const fulfillment = (order.fulfillmentStatus || "").toUpperCase();
  const status = (order.status || "").toUpperCase();

  const shipped =
    fulfillment.includes("SHIPPED") ||
    fulfillment.includes("FULFILLED") ||
    status.includes("SHIPPED") ||
    status.includes("FULFILLED") ||
    Boolean(order.trackingNumber?.trim());

  return !shipped;
});

const awaitingShipment = ordersAwaitingShipment.length;


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Orders
        </h1>
        <p className="mt-1 text-gray-500">
          Manage and synchronize your marketplace orders.
        </p>
      </div>

      
<div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-2 text-3xl font-bold">{orders.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Orders</p>
          <p className="mt-2 text-3xl font-bold">
            {activeOrders.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Active Order Value
          </p>
          <div className="mt-2 text-xl font-bold">
            {Object.keys(salesByCurrency).length === 0
              ? formatMoney(0, "USD")
              : Object.entries(salesByCurrency).map(
                  ([currency, amount]) => (
                    <div key={currency}>
                      {formatMoney(amount, currency)}
                    </div>
                  )
                )}
          </div>
        </div>
      
<div className="rounded-xl border bg-white p-5 shadow-sm">
  <p className="text-sm text-gray-500">
    Awaiting Shipment
  </p>
  <p className="mt-2 text-3xl font-bold text-orange-600">
    {awaitingShipment}
  </p>
</div>

      </div>

<div className="rounded-xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
  <h2 className="text-lg font-bold text-orange-800">
    Orders Needing Attention
  </h2>

  <p className="mt-1 text-sm text-orange-700">
    Orders that are waiting to be shipped.
  </p>

  <div className="mt-3 text-2xl font-bold text-orange-600">
    {awaitingShipment}
  </div>

  <p className="mt-2 text-sm text-gray-600">
    {awaitingShipment === 0
      ? "All active orders appear to be shipped."
      : `${awaitingShipment} order(s) may need shipping attention.`}
  </p>
  
{ordersAwaitingShipment.length > 0 && (
  <div className="mt-4 space-y-3">
    {ordersAwaitingShipment.map((order) => (
      <div
        key={order.id}
        className="rounded-lg border border-orange-200 bg-white p-4"
      >
        <p className="font-semibold text-gray-900">
          {order.title}
        </p>

        <p className="mt-1 text-sm text-gray-600">
          Order ID: {order.externalOrderId}
        </p>

        <a
          href={`/dashboard/orders/${encodeURIComponent(order.id)}`}
          className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          View Order Details →
        </a>
      </div>
    ))}
  </div>
)}

</div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSyncEbay}
          disabled={syncing || refreshing}
          className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync eBay Orders"}
        </button>

        <button
          onClick={handleRefreshOrders}
          disabled={syncing || refreshing}
          className="rounded-lg bg-gray-700 px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "Refresh Orders"}
        </button>
      </div>

      {syncMessage && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {syncMessage}
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        
<div className="relative w-full md:flex-1">
  <input
    type="text"
    value={search}
    onChange={(event) => setSearch(event.target.value)}
    placeholder="Search orders, products, buyers..."
    className="w-full rounded-lg border bg-white px-4 py-3 pr-12 text-gray-900"
  />

  {search && (
    <button
      type="button"
      onClick={() => setSearch("")}
      aria-label="Clear search"
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
    >
      ✕
    </button>
  )}
</div>


        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-3 font-medium text-purple-900 shadow-sm hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="ALL">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

<div className="mb-4">
  <select
    value={shippingFilter}
    onChange={(event) => setShippingFilter(event.target.value)}
    className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 font-medium text-green-900 shadow-sm hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
  >
    <option value="ALL">All Shipping Statuses</option>
    <option value="NOT_SHIPPED">Not Shipped</option>
    <option value="SHIPPED">Shipped</option>
    <option value="DELIVERED">Delivered</option>
  </select>
</div>
<div className="mb-4">
  <select
    value={sortOrder}
    onChange={(event) => setSortOrder(event.target.value)}
    className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 font-medium text-blue-900 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"

  >
    <option value="NEWEST">Newest First</option>
    <option value="OLDEST">Oldest First</option>
    <option value="HIGHEST">Highest Price</option>
    <option value="LOWEST">Lowest Price</option>
  </select>
</div>
<div className="mb-4">
  <button
    type="button"
    onClick={resetFilters}
    className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 font-medium text-red-900 shadow-sm hover:bg-red-100"
  >
    Reset Filters
  </button>
</div>
      {loading ? (
        <p className="text-gray-500">Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          {orders.length === 0
            ? "No orders yet. Sync eBay to get started."
            : "No orders match your search or filter."}
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => (
            <div
  key={order.id}
  onClick={() => {
    window.location.href = `/dashboard/orders/${order.id}`;
  }}
  className="rounded-xl border bg-white p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {order.title || order.externalOrderId}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Order ID: {order.externalOrderId}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}
                >
                  {order.status}
                </span>
                <span
  className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${
    order.fulfillmentStatus === "DELIVERED"
      ? "bg-purple-100 text-purple-700"
      : order.fulfillmentStatus === "SHIPPED"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-800"
  }`}
>
  {order.fulfillmentStatus === "DELIVERED"
    ? "Delivered"
    : order.fulfillmentStatus === "SHIPPED"
    ? "Shipped"
    : "Not Shipped"}
</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-3">
                <div>
                  <span className="text-gray-500">Quantity: </span>
                  {order.quantity ?? 0}
                </div>

                <div>
                  <span className="text-gray-500">Total: </span>
                  <span className="font-semibold">
                    {formatMoney(order.total, order.currency)}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500">Buyer: </span>
                  {order.buyerName ||
                    order.buyerUsername ||
                    "Not available"}
                </div>
              </div>
              {(order.shippingCarrier || order.trackingNumber) && (
  <div className="mt-3 border-t pt-3 text-sm text-gray-700">
    {order.shippingCarrier && (
      <p>
        <span className="font-semibold">Shipping Carrier: </span>
        {order.shippingCarrier}
      </p>
    )}

    {order.trackingNumber && (
      <p>
        <span className="font-semibold">Tracking Number: </span>
        {order.trackingNumber}
      </p>
    )}
  </div>
)}
            </div>

          ))}
        </div>
      )}
      
{!loading && sortedOrders.length > 0 && (
  <div className="mt-6 flex items-center justify-between gap-4">
    <button
      type="button"
      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
      disabled={safeCurrentPage === 1}
      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Previous
    </button>

    <span className="text-sm font-medium text-gray-700">
      Page {safeCurrentPage} of {totalPages}
    </span>
<span className="text-sm font-medium text-gray-600">
  Showing{" "}
  {filteredOrders.length === 0
    ? 0
    : (safeCurrentPage - 1) * pageSize + 1}
  –
  {Math.min(safeCurrentPage * pageSize, filteredOrders.length)}
  {" "}of {filteredOrders.length} orders
</span>
<label className="flex items-center gap-2 text-sm text-gray-700">
  Orders per page:
  <select
    value={pageSize}
    onChange={(event) => {
      setPageSize(Number(event.target.value));
      setCurrentPage(1);
    }}
    className="rounded-lg border bg-white px-3 py-2 text-gray-900"
  >
    <option value={10}>10</option>
    <option value={25}>25</option>
    <option value={50}>50</option>
  </select>
</label>

    <button
      type="button"
      onClick={() =>
        setCurrentPage((page) => Math.min(totalPages, page + 1))
      }
      disabled={safeCurrentPage === totalPages}
      className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

    </div>
  );
}
