"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ImportHistoryItem = {
  id: string;
  title: string | null;
  marketplace: string;
  status: string;
  createdAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/import-history`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load import history.");
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid response.");
      }

      setHistory(data as ImportHistoryItem[]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load import history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);
const clearCompleted = async () => {
  const confirmed = window.confirm(
    "Delete all completed imports from the history?",
  );

  if (!confirmed) return;

  setClearing(true);
  setError("");

  try {
    const response = await fetch(`${API_URL}/import-history/completed`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Unable to clear completed imports.");
    }

    await loadHistory();
  } catch (caught) {
    setError(
      caught instanceof Error
        ? caught.message
        : "Unable to clear completed imports.",
    );
  } finally {
    setClearing(false);
  }
};
const deleteImport = async (id: string) => {
  const confirmed = window.confirm("Delete this import from the history?");

  if (!confirmed) return;

  setDeletingId(id);
  setError("");

  try {
    const response = await fetch(`${API_URL}/import-history/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Unable to delete this import.");
    }

    await loadHistory();
  } catch (caught) {
    setError(
      caught instanceof Error
        ? caught.message
        : "Unable to delete this import.",
    );
  } finally {
    setDeletingId(null);
  }
};

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return history;
    }

    return history.filter((item) =>
      [
        item.title ?? "",
        item.marketplace,
        item.status,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [history, search]);

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">Import History</h1>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, marketplace, or status..."
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none placeholder:text-slate-400 focus:border-blue-500 md:max-w-md"
            />

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {filteredHistory.length}{" "}
                {filteredHistory.length === 1 ? "Import" : "Imports"}
              </span>
<button
  type="button"
  onClick={() => void clearCompleted()}
  disabled={clearing || loading || history.length === 0}
  className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {clearing ? "Clearing..." : "Clear Completed"}
</button>
              <button
                type="button"
                onClick={() => void loadHistory()}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
              {error}
            </div>
          ) : loading && history.length === 0 ? (
            <p className="text-slate-300">Loading import history...</p>
          ) : filteredHistory.length === 0 ? (
            <p className="text-slate-300">
              {history.length === 0
                ? "No imports yet."
                : "No imports match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="py-3 pr-4">Product</th>
                    <th className="px-4 py-3">Marketplace</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Imported</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800 last:border-b-0"
                    >
                      <td className="py-4 pr-4 font-medium">
                        {item.title ?? "Untitled product"}
                      </td>

                      <td className="px-4 py-4">
                        {item.marketplace}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "COMPLETED"
                              ? "bg-green-600 text-white"
                              : item.status === "FAILED"
                                ? "bg-red-600 text-white"
                                : item.status === "PROCESSING"
                                  ? "bg-blue-600 text-white"
                                  : "bg-yellow-600 text-white"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right">
  <button
    type="button"
    onClick={() => void deleteImport(item.id)}
    disabled={deletingId === item.id}
    className="rounded-md border border-red-500 px-3 py-1 text-sm font-semibold text-red-300 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
  >
    {deletingId === item.id ? "Deleting..." : "Delete"}
  </button>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}