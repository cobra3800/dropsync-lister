"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

type Listing = {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  sku: string | null;
  price: number | null;
  quantity: number;
  status: string;
  condition: string;
  category: string | null;
  imageUrl: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
const aiTitle = searchParams.get("aiTitle");
const aiPrice = searchParams.get("aiPrice");
const aiDescription = searchParams.get("aiDescription");
const aiCondition = searchParams.get("aiCondition");
const aiCategory = searchParams.get("aiCategory");
  const id = params.id;

  const [storeId, setStoreId] = useState("");
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [sku, setSku] = useState("");
const [price, setPrice] = useState("");
const [quantity, setQuantity] = useState("1");
const [status, setStatus] = useState("ACTIVE");
const [condition, setCondition] = useState("NEW");
const [category, setCategory] = useState("");
const [imageUrl, setImageUrl] = useState<string | null>(null);
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
        console.log("LOADED LISTING IMAGE URL:", listing?.imageUrl);

        if (!listing) {
          throw new Error("Listing not found.");
        }
        setStoreId(listing.storeId);
setTitle(aiTitle ?? listing.title);
setDescription(aiDescription ?? listing.description ?? "");
setSku(listing.sku ?? "");
setPrice(
  aiPrice ?? (listing.price === null ? "" : String(listing.price)),
);
setQuantity(String(listing.quantity));
setStatus(listing.status);
setCondition(aiCondition ?? listing.condition);
setCategory(aiCategory ?? listing.category ?? "");
setImageUrl(listing.imageUrl ?? null);
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
  }, [id, aiTitle, aiPrice, aiDescription, aiCondition, aiCategory]);

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
          description: description.trim() || null,
          sku: sku.trim() || null,
          price: parsedPrice,
          quantity: parsedQuantity,
          status,
          condition,
          category: category.trim() || null,
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
if (storeId && sku.trim()) {
  const offerResponse = await fetch(
    `${API_URL}/ebay/offer-by-sku?storeId=${encodeURIComponent(
      storeId,
    )}&sku=${encodeURIComponent(sku.trim())}`,
    {
      cache: "no-store",
    },
  );

  if (!offerResponse.ok) {
    throw new Error("Unable to find the eBay offer.");
  }

  const offerData = await offerResponse.json();
  const offer = offerData?.offers?.[0];

  if (!offer?.offerId) {
    throw new Error("No eBay offer found for this SKU.");
  }
const inventoryUpdateResponse = await fetch(
  `${API_URL}/ebay/inventory-item`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
  storeId,
  sku: sku.trim(),
  title: title.trim(),
  description: description.trim(),
  quantity: parsedQuantity,
  condition,
  imageUrls: imageUrl ? [imageUrl] : [],
}),
  },
);

if (!inventoryUpdateResponse.ok) {
  const inventoryError = await inventoryUpdateResponse
    .json()
    .catch(() => null);

  throw new Error(
    typeof inventoryError?.message === "string"
      ? inventoryError.message
      : "Unable to update eBay inventory item.",
  );
}
  const ebayUpdateResponse = await fetch(
    `${API_URL}/ebay/update-price-quantity`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        storeId,
        offerId: offer.offerId,
        sku: sku.trim(),
        price: parsedPrice,
        quantity: parsedQuantity,
      }),
    },
  );

  if (!ebayUpdateResponse.ok) {
    const ebayError = await ebayUpdateResponse
      .json()
      .catch(() => null);

    throw new Error(
      typeof ebayError?.message === "string"
        ? ebayError.message
        : "Unable to update eBay listing.",
    );
  }
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
<div>
  <label
    htmlFor="description"
    className="mb-2 block text-sm font-medium text-slate-300"
  >
    Description
  </label>

  <textarea
    id="description"
    value={description}
    onChange={(event) => setDescription(event.target.value)}
    rows={8}
    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
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
<div>
  <label
    htmlFor="condition"
    className="mb-2 block text-sm font-medium text-slate-300"
  >
    Condition
  </label>

  <select
    id="condition"
    value={condition}
    onChange={(event) => setCondition(event.target.value)}
    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
  >
    <option value="NEW">NEW</option>
    <option value="USED">USED</option>
    <option value="REFURBISHED">REFURBISHED</option>
  </select>
</div>
<div>
  <label
    htmlFor="category"
    className="mb-2 block text-sm font-medium text-slate-300"
  >
    Category
  </label>

  <input
    id="category"
    value={category}
    onChange={(event) => setCategory(event.target.value)}
    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
  />
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