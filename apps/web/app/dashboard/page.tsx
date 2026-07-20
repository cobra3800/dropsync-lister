'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
type User = { id: string; email: string; name: string; role: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unauthorized');
        return response.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    router.replace('/login');
    router.refresh();
  }

  if (loading) return <main className="min-h-screen bg-slate-950 p-10 text-white">Loading dashboard…</main>;
  if (!user) return null;

  return (
  <main className="min-h-screen bg-slate-950 text-white flex">

    {/* Sidebar */}
    <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6">

      <h1 className="text-2xl font-bold text-blue-400">
        DropSync
      </h1>

      <p className="mt-1 text-xs text-slate-400">
        AI eCommerce Platform
      </p>

      <nav className="mt-10 space-y-2">

        {[
          "Dashboard",
          "Inventory",
          "Listings",
          "AI Generator",
          "Publish",
          "Analytics",
          "Settings"
        ].map(item => (

          <button
            key={item}
            className="w-full rounded-lg px-4 py-3 text-left hover:bg-slate-800"
          >
            {item}
          </button>

        ))}

      </nav>

      <button
        onClick={logout}
        className="mt-12 w-full rounded-xl bg-red-600 px-4 py-3"
      >
        Log Out
      </button>

    </aside>

    {/* Main Content */}

    <section className="flex-1 p-10">

      <h2 className="text-4xl font-bold">
        Welcome back, {user.name}
      </h2>

      <p className="mt-2 text-slate-400">
        Your AI-powered eBay automation dashboard.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-4">

        {[
          ["Connected Store","1","eBay Connected"],
          ["Inventory","1","Ready"],
          ["Listings","1","Published"],
          ["Membership",user.role,"Active"]
        ].map(([title,value,note])=>(

          <div
            key={title}
            className="rounded-2xl bg-slate-900 p-6 border border-slate-800"
          >

            <div className="text-slate-400 text-sm">
              {title}
            </div>

            <div className="mt-3 text-4xl font-bold">
              {value}
            </div>

            <div className="mt-3 text-sm text-green-400">
              {note}
            </div>

          </div>

        ))}

      </div>

      <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <h3 className="text-2xl font-semibold">
          System Status
        </h3>

        <div className="mt-6 space-y-3">

          <div>✅ Authentication</div>

          <div>✅ eBay OAuth</div>

          <div>✅ Token Refresh</div>

          <div>✅ Inventory API</div>

          <div>✅ Offer API</div>

          <div>✅ Publish Listing API</div>

        </div>

      </div>

    </section>

  </main>
);
}
