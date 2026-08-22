"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Listing = {
  id: string;
  storeId: string;
  title: string;
  sku: string | null;
  price: number | null;
  quantity: number;
  marketplace: string;
  status: string;
  imageUrl: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function OptimizeListingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [optimized, setOptimized] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/listings/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load listing.");
        }

        const data = (await response.json()) as Listing;
        setListing(data);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load listing.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadListing();
    }
  }, [id]);

  async function handleOptimize() {
    if (!listing) return;

    try {
      setOptimizing(true);
      setError("");
      setOptimized(null);

      const product = {
        id: listing.id,
        source: listing.marketplace,
        title: listing.title,
        description: "",
        images: listing.imageUrl ? [listing.imageUrl] : [],
        price: listing.price ?? 0,
        quantity: listing.quantity,
        condition: "NEW",
        sku: listing.sku ?? undefined,
      };

      const currentListing = {
        title: listing.title,
        description: "",
        price: listing.price ?? 0,
        quantity: listing.quantity,
        sku: listing.sku ?? "",
        marketplace: listing.marketplace,
      };

      const response = await fetch(
        `${API_URL}/ai/optimize-listing`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product,
            listing: currentListing,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Unable to optimize listing.",
        );
      }

      setOptimized(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to optimize listing.",
      );
    } finally {
      setOptimizing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading listing...
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p>{error || "Listing not found."}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <div className="mx-auto max-w-4xl">
        <a
          href={`/dashboard/listings/${id}`}
          className="text-blue-400 hover:underline"
        >
          ← Back to Listing
        </a>

        <h1 className="mt-6 text-4xl font-bold">
          Optimize Listing with AI
        </h1>

        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Current Listing
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {listing.title}
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Price</p>
              <p className="mt-1 text-xl font-bold">
                ${listing.price ?? 0}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4">
              <p className="text-sm text-slate-400">Quantity</p>
              <p className="mt-1 text-xl font-bold">
                {listing.quantity}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800 p-4">
              <p className="text-sm text-slate-400">SKU</p>
              <p className="mt-1 font-bold">
                {listing.sku ?? "—"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOptimize}
            disabled={optimizing}
            className="mt-6 rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {optimizing ? "Optimizing..." : "Optimize with AI"}
          </button>

          {error ? (
            <div className="mt-5 rounded-lg border border-red-700 bg-red-950/50 p-4 text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        {optimized ? (
          <div className="mt-8 rounded-xl border border-purple-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">
              AI Optimized Result
            </h2>

            <div className="mt-5 space-y-5 rounded-lg bg-slate-950 p-6">

  <div>
    <p className="text-sm font-semibold text-purple-400">Optimized Title</p>
    <p className="mt-1 text-lg font-semibold text-white">
      {String(optimized.title ?? "")}
    </p>
  </div>

  <div>
    <p className="text-sm font-semibold text-purple-400">Optimized Description</p>
    <p className="mt-1 whitespace-pre-wrap text-slate-200">
      {String(optimized.description ?? "")}
    </p>
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-sm text-slate-400">Suggested Price</p>
      <p className="mt-1 text-xl font-bold text-white">
        ${String(optimized.price ?? "")}
      </p>
    </div>

    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-sm text-slate-400">Condition</p>
      <p className="mt-1 font-semibold text-white">
        {String(optimized.condition ?? "")}
      </p>
    </div>

    <div className="rounded-lg bg-slate-800 p-4">
      <p className="text-sm text-slate-400">Category</p>
      <p className="mt-1 font-semibold text-white">
        {String(optimized.category ?? "")}
      </p>
    </div>
  </div>


<a
  href={`/dashboard/listings/${id}/edit?aiTitle=${encodeURIComponent(
  String(optimized.title ?? "")
)}&aiPrice=${encodeURIComponent(
  String(optimized.price ?? "")
)}`}
  className="mt-6 inline-block rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-700"
>
  Apply AI Changes
</a>
</div>
          </div>
        ) : null}
      </div>
    </main>
  );
}