"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Listing = {
  id: string;
  title: string;
  sku: string | null;
  price: number | null;
  quantity: number;
  marketplace: string;
  status: string;
  imageUrl: string | null;
  externalId: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/listings`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load listings.");
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid response.");
      }

      setListings(data as Listing[]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load listings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return listings;
    }

    return listings.filter((listing) =>
      [
        listing.title,
        listing.sku ?? "",
        listing.marketplace,
        listing.status,
        listing.externalId ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [listings, search]);

  return (
    <main className="min-h-full bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Listings</h1>
            <p className="mt-1 text-slate-600">
              Manage products published across your marketplaces.
            </p>
          </div>

          <a
            href="/import"
            className="rounded-lg bg-green-600 px-4 py-2 font-semibold hover:bg-green-700"
          >
            New Import
          </a>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <input
  type="search"
  value={search}
  onChange={(event) => setSearch(event.target.value)}
  placeholder="Search title, SKU, status, marketplace..."
  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 md:max-w-xl"
/>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {filteredListings.length}{" "}
                {filteredListings.length === 1 ? "Listing" : "Listings"}
              </span>

              <button
                type="button"
                onClick={() => void loadListings()}
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
          ) : loading && listings.length === 0 ? (
            <p className="text-slate-300">Loading listings...</p>
          ) : filteredListings.length === 0 ? (
            <p className="text-slate-300">
              {listings.length === 0
                ? "No listings yet."
                : "No listings match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="py-3 pr-4">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Marketplace</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">eBay Item ID</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredListings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="border-b border-slate-800 last:border-b-0"
                    >
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-slate-800 text-xs text-slate-500">
                            {listing.imageUrl ? (
                              <img
                                src={listing.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "No image"
                            )}
                          </div>

                          <a
  href={`/dashboard/listings/${listing.id}`}
  className="max-w-md font-medium text-blue-400 hover:underline"
>
  {listing.title}
</a>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {listing.sku ?? "—"}
                      </td>

                      <td className="px-4 py-4">
                        {listing.price === null
                          ? "—"
                          : `$${listing.price.toFixed(2)}`}
                      </td>

                      <td className="px-4 py-4">{listing.quantity}</td>

                      <td className="px-4 py-4">
                        {listing.marketplace}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            listing.status === "ACTIVE"
                              ? "bg-green-600 text-white"
                              : listing.status === "FAILED"
                                ? "bg-red-600 text-white"
                                : listing.status === "DRAFT"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-blue-600 text-white"
                          }`}
                        >
                          {listing.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-300">
                        {listing.externalId ?? "—"}
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