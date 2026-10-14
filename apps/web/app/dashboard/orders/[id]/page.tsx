
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
  createdAt: string;
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (err) {
        setError("Unable to load order details.");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

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
    </div>
  );
}
