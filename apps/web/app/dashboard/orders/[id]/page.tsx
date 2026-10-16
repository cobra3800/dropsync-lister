
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Order = {
  id: string;
  externalOrderId: string;
  marketplace: string;
  title: string;
  status: string;
  quantity: number;
  total: number;
  currency: string;
  buyerName?: string;
  buyerUsername?: string;
  buyerEmail?: string;
  shippingName?: string;
  
shippingAddress?: string;
shippingCarrier?: string | null;
trackingNumber?: string | null;
fulfillmentStatus?: string | null;
createdAt: string;

};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const [shippingCarrier, setShippingCarrier] = useState("");
const [fulfillmentStatus, setFulfillmentStatus] = useState("NOT_SHIPPED");
const [trackingNumber, setTrackingNumber] = useState("");
const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function loadOrder() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:4000";

        const response = await fetch(
          `${apiUrl}/orders/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          throw new Error("Could not load order");
        }

        const data = await response.json();

        if (!data) {
          throw new Error("Order not found");
        }

        setOrder(data);
        
setShippingCarrier(data.shippingCarrier ?? "");
setFulfillmentStatus(data.fulfillmentStatus || "NOT_SHIPPED");
setTrackingNumber(data.trackingNumber ?? "");

      } catch (err) {
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

async function handleSaveShipping() {
  if (!order || savingShipping) return;

  setSavingShipping(true);
  setError("");

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4000";

    const response = await fetch(
      `${apiUrl}/orders/${encodeURIComponent(order.id)}/shipping`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  shippingCarrier,
  trackingNumber,
  fulfillmentStatus,
}),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save shipping");
    }

    const updatedOrder = await response.json();
    setOrder(updatedOrder);
    alert("Shipping information saved!");
  } catch (err) {
    alert("Unable to save shipping information.");
  } finally {
    setSavingShipping(false);
  }
}

  if (loading) {
    return <div className="p-6">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          {error || "Order not found"}
        </p>
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="mt-4 text-blue-600"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="text-blue-600 hover:underline"
      >
        ← Back to Orders
      </button>

      <div>
        <h1 className="text-3xl font-bold">
          Order Details
        </h1>
        <p className="text-gray-500">
          Order #{order.externalOrderId}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          {order.title}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Marketplace</p>
            <p>{order.marketplace}</p>
          </div>

          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-semibold">{order.status}</p>
          </div>

          <div>
            <p className="text-gray-500">Quantity</p>
            <p>{order.quantity}</p>
          </div>

          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: order.currency || "USD",
              }).format(order.total)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          Buyer Information
        </h2>

        <p><strong>Name:</strong> {order.buyerName || "Not available"}</p>
        <p><strong>Username:</strong> {order.buyerUsername || "Not available"}</p>
        <p><strong>Email:</strong> {order.buyerEmail || "Not available"}</p>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          Shipping Information
        </h2>

        <p><strong>Name:</strong> {order.shippingName || "Not available"}</p>
        <p className="whitespace-pre-wrap">
          <strong>Address:</strong> {order.shippingAddress || "Not available"}
        </p>
      </div>
    
<div className="rounded-xl border bg-white p-6 space-y-4">
  <h2 className="text-xl font-semibold">
    Shipping & Tracking
  </h2>

  <div>
    <label className="block mb-2">Shipping Carrier</label>
    <input
      type="text"
      value={shippingCarrier}
      onChange={(e) => setShippingCarrier(e.target.value)}
      placeholder="USPS, UPS, FedEx"
      className="w-full rounded-lg border p-3"
    />
  </div>

  <div>
    <label className="block mb-2">Tracking Number</label>
    <input
      type="text"
      value={trackingNumber}
      onChange={(e) => setTrackingNumber(e.target.value)}
      placeholder="Enter tracking number"
      className="w-full rounded-lg border p-3"
    />
  </div>
<div>
  <label className="block mb-2">
    Fulfillment Status
  </label>

  <select
    value={fulfillmentStatus}
    onChange={(e) => setFulfillmentStatus(e.target.value)}
    className="w-full rounded-lg border p-3"
  >
    <option value="NOT_SHIPPED">Not Shipped</option>
    <option value="SHIPPED">Shipped</option>
    <option value="DELIVERED">Delivered</option>
  </select>
</div>
  <button
    type="button"
    onClick={handleSaveShipping}
    disabled={savingShipping}
    className="rounded-lg bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
  >
    {savingShipping ? "Saving..." : "Save Shipping"}
  </button>
</div>

    </div>
  );
}
