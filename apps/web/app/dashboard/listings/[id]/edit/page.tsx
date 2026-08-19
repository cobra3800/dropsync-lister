"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Listing = {
  id: string;
  title: string;
  sku: string | null;
  price: number | null;
  quantity: number;
  status: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [status, setStatus] = useState("ACTIVE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadListing() {
      try {
        setError("");

        const response = await fetch(`${API_URL}/listings/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load listing.");
        }

        const listing = (await response.json()) as Listing | null;

        if (!listing) {
          throw new Error("Listing not found.");
        }

        setTitle(listing.title);
        setSku(listing.sku ?? "");
        setPrice(
          listing.price === null ? "" : String(listing.price),
        );
        setQuantity(String(listing.quantity));
        setStatus(listing.status);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid price.");
      return;
    }

    if (
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity < 0
    ) {
      setError("Enter a valid whole-number quantity.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/listings/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          sku: sku.trim() || null,
          price: parsedPrice,
          quantity: parsedQuantity,
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "Unable to save listing.",
        );
      }

      router.push(`/dashboard/listings/${id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save listing.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <div className="mx-auto max-w-4xl">
          Loading listing...
        </div>
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

        <h1 className="mt-4 text-4xl font-bold">
          Edit Listing
        </h1>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl border border-slate-700 bg-slate-900 p-8"
        >
          {error ? (
            <div className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-red-200">
              {error}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Title
            </label>

            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500 bg-slate-800 text-white"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Price
              </label>

              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Quantity
              </label>

              <input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="sku"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                SKU
              </label>

              <input
                id="sku"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PAUSED">PAUSED</option>
                <option value="ENDED">ENDED</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <a
              href={`/dashboard/listings/${id}`}
              className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}