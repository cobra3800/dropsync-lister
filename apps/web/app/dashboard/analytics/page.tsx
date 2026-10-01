'use client';

import { useEffect, useState } from 'react';
export default function AnalyticsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    useEffect(() => {
  fetch('http://localhost:4000/orders')
    .then((response) => response.json())
    .then((data) => {
      setOrders(Array.isArray(data) ? data : []);
    })
    .catch((error) => {
      console.error('Unable to load orders:', error);
    });
}, []);
const totalRevenue = orders.reduce(
  (sum, order: any) => sum + Number(order.total ?? 0),
  0,
);
  const stats = [
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}` },
    { label: 'Total Orders', value: String(orders.length) },
    { label: 'Items Sold', value: String(orders.reduce((sum, order: any) => sum + Number(order.quantity ?? 0), 0)) },
    { label: 'Average Order', value: `$${orders.length ? (totalRevenue / orders.length).toFixed(2) : '0.00'}` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>

      <p className="mt-2 text-gray-600">
        Track your sales, orders, revenue, and store performance.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}