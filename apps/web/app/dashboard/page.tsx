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
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">DropSync</Link>
          <div className="flex items-center gap-4"><span className="text-sm text-slate-300">{user.name} · {user.role}</span><button onClick={logout} className="rounded-xl border border-white/15 px-4 py-2 text-sm">Log out</button></div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-blue-300">Authenticated successfully</p>
        <h1 className="mt-2 text-4xl font-bold">Good morning, {user.name}.</h1>
        <p className="mt-3 text-slate-400">Your DropSync dashboard is protected and connected to the API.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            ['Connected stores', '0', 'Connect eBay next'],
            ['Draft products', '0', 'AI listing engine coming soon'],
            ['Membership', user.role === 'OWNER' ? 'Owner' : 'Starter', 'Managed securely']
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-slate-400">{label}</p><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-3 text-sm text-slate-500">{note}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
