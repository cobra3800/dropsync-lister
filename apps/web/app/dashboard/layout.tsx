import type { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Listings", href: "/dashboard/listings", icon: "▦" },
  { label: "Import History", href: "/dashboard/import-history", icon: "↻" },
  { label: "AI Optimizer", href: "/ai-generator", icon: "✦" },
  { label: "Import Product", href: "/import", icon: "↓" },
  { label: "Stores", href: "/dashboard/stores", icon: "□" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "⌁" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <a
          href="/dashboard"
          className="flex items-center gap-3 text-xl font-bold"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            DS
          </span>
          <span>DropSync</span>
        </a>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            🔔
          </button>

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
              JH
            </span>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold">John Henry</p>
              <p className="text-xs text-slate-500">Owner</p>
            </div>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-slate-200 bg-white p-4 lg:block">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm">
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 right-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Pro Plan</p>
          <p className="mt-1 text-xs text-slate-500">
            78% of monthly limits used
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-[78%] rounded-full bg-blue-600" />
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Upgrade Plan
          </button>
        </div>
      </aside>

      <main className="pt-16 lg:pl-64">
        <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}