"use client";

import { useEffect, useState } from "react";

type Order = {
  id: string;
  externalOrderId: string;
  buyerUsername?: string;
  buyerName?: string;
  status: string;
  total?: number;
  currency: string;
  title?: string;
  quantity: number;
  createdAt: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
const [syncMessage, setSyncMessage] = useState("");
const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    fetch("http://localhost:4000/orders")
      .then((response) => response.json())
      .then((data) => setOrders(data))
      .catch((error) => console.error("Failed to load orders:", error));
  }, []);

  const handleSyncEbay = async () => {
    setSyncing(true);
setSyncMessage("");
  try {
    const response = await fetch("http://localhost:4000/orders/sync/ebay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storeId: "cmucyeton0000fj5o3qgbd0ot",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to sync eBay orders");
    }

    await response.json();

    const ordersResponse = await fetch("http://localhost:4000/orders");
    const updatedOrders = await ordersResponse.json();
    setOrders(updatedOrders);
    setSyncMessage(
  updatedOrders.length === 0
    ? "Sync complete — no eBay orders found."
    : `Sync complete — ${updatedOrders.length} order(s) found.`
);
  } catch (error) {
  console.error("Failed to sync eBay orders:", error);
  setSyncMessage("eBay order sync failed.");
} finally {
  setSyncing(false);
}
};

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Orders</h1>
<button
  onClick={handleSyncEbay}
  disabled={syncing}
  className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
>
  {syncing ? "Syncing..." : "Sync eBay Orders"}
</button>
{syncMessage && (
  <p className="mt-3 text-sm text-gray-600">{syncMessage}</p>
)}
      {orders.length === 0 ? (
        <p className="mt-4 text-gray-500">No orders yet.</p>
      ) : (
        <div className="mt-6">
          {orders.map((order) => (
            <div key={order.id} className="mb-4 rounded-lg border p-4">
              <div className="font-semibold">
                {order.title || order.externalOrderId}
              </div>

              <div>Status: {order.status}</div>
              <div>Quantity: {order.quantity}</div>
              <div>
                Total: {order.currency} {order.total ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}