'use client';

import { useState } from 'react';

export default function AIGeneratorPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const [listing, setListing] = useState({
  title: "",
  description: "",
  price: "",
  category: "",
  storeId: "",

  sku: "",
  quantity: 1,
  categoryId: "",
});

async function publishToEbay() {
  try {
    const response = await fetch(
      "http://127.0.0.1:4000/ebay/publish-ai-listing",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),

    storeId: listing.storeId,
    sku: listing.sku,
    quantity: listing.quantity,
    categoryId: listing.categoryId,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(JSON.stringify(data, null, 2));
      return;
    }

    alert("Published successfully!");
  } catch (error) {
    console.error(error);
    alert("Publish failed");
  }
}

async function generate() {
  if (!listing.storeId.trim()) {
  alert("Enter your connected eBay Store ID first.");
  return;
}

if (!url.trim()) {
  alert("Enter a supplier product URL.");
  return;
}

  setLoading(true);

  try {
    const response = await fetch(
      'http://127.0.0.1:4000/ai/generate-listing',
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? 'AI generation failed');
    }
    const categoryResponse = await fetch(
  `http://127.0.0.1:4000/ebay/category-suggestions?storeId=${encodeURIComponent(
    listing.storeId,
  )}&title=${encodeURIComponent(data.title)}`,
  {
    credentials: "include",
  },
);

const categoryData = await categoryResponse.json();

if (!categoryResponse.ok) {
  throw new Error(
    categoryData.message ?? "Unable to find an eBay category",
  );
}

const categoryId =
  categoryData?.categorySuggestions?.[0]?.category?.categoryId ?? "";

    setListing((current) => ({
  ...current,
  title: data.title,
  description: data.description,
  price: data.price,
  category: data.category,

  sku:
  data.sku ??
  `DS-${Date.now().toString().slice(-8)}`,
  quantity: data.quantity ?? 1,
  categoryId,
}));
  } catch (error) {
    console.error(error);
    alert(
      error instanceof Error
        ? error.message
        : 'AI generation failed',
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold mb-2">
          AI Listing Generator
        </h1>

        <p className="text-slate-400 mb-8">
  Paste a supplier URL and let AI build your eBay listing.
</p>

        <input
  value={listing.storeId}
  onChange={(e) =>
    setListing((current) => ({
      ...current,
      storeId: e.target.value,
    }))
  }
  placeholder="Paste your connected eBay Store ID..."
  className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white placeholder:text-slate-400"
/>

         <input
  value={url}
  onChange={(e) => setUrl(e.target.value)}
  placeholder="Paste Amazon, Walmart or supplier URL..."
  className="mb-6 w-full rounded-xl border border-slate-700 bg-slate-800 p-4 text-white placeholder:text-slate-400"
  style={{
    color: "#ffffff",
    WebkitTextFillColor: "#ffffff",
    caretColor: "#ffffff",
  }}
/>
        <button
          onClick={generate}
          className="bg-blue-600 px-6 py-3 rounded-xl"
        >
          {loading ? 'Generating...' : 'Generate with AI'}
        </button>

        {listing.title && (
          <div className="mt-10 rounded-xl bg-slate-900 p-8">

            <h2 className="text-2xl font-bold mb-6">
              AI Results
            </h2>

            <div className="mb-4">
              <strong>Title</strong>
              <p>{listing.title}</p>
            </div>

            <div className="mb-4">
              <strong>Description</strong>
              <p>{listing.description}</p>
            </div>

            <div className="mb-4">
              <strong>Suggested Price</strong>
              <p>${listing.price}</p>
            </div>

            <div className="mb-6">
              <strong>Category</strong>
              <p>{listing.category}</p>
            </div>

            <button
    onClick={publishToEbay}
    className="bg-green-600 px-6 py-3 rounded-xl"
>
    Publish to eBay
</button>

          </div>
        )}

      </div>
    </main>
  );
}