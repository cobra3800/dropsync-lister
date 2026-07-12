import Link from 'next/link';
import { ArrowRight, Boxes, Bot, ShieldCheck, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-600 p-2"><Boxes /></div><b>DropSync</b></div>
        <div className="flex gap-3"><Link href="/login" className="rounded-xl px-4 py-2 text-slate-300">Login</Link><Link href="/register" className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-950">Start Free</Link></div>
      </nav>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-blue-500/40 px-4 py-2 text-sm text-blue-200">AI Commerce Platform</p>
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Import Once. Sell Everywhere.</h1>
          <p className="mt-6 text-xl text-slate-300">Use AI to create, optimize, and publish products across marketplaces. Starting with eBay. Built for Shopify, Etsy, Amazon, TikTok Shop, and more.</p>
          <div className="mt-8 flex gap-4"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold">Create account <ArrowRight size={18}/></Link><Link href="/dashboard" className="rounded-xl border border-white/20 px-6 py-3">View dashboard</Link></div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="grid gap-4">
            {[['AI Listings', Bot], ['Marketplace Hub', Store], ['Secure Owner Portal', ShieldCheck]].map(([label, Icon]: any) => <div key={label} className="flex items-center gap-4 rounded-2xl bg-slate-900 p-5"><Icon className="text-blue-400"/><span className="font-semibold">{label}</span></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
