'use client';

import { useState } from 'react';

type Product = {
  source?: string;
  sourceUrl?: string;
  title?: string;
  price?: number;
  currency?: string;
  brand?: string;
  category?: string;
  description?: string;
  images?: string[];
};

type Listing = {
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  condition?: string;
  itemSpecifics?: Record<string, string>;
  seoKeywords?: string[];
  shippingWeight?: string;
};

type EbayPolicies = {
  fulfillmentPolicies?: unknown[];
  paymentPolicies?: unknown[];
  returnPolicies?: unknown[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [policies, setPolicies] = useState<EbayPolicies | null>(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function importProduct() {
    const cleanUrl = url.trim();

    if (!cleanUrl) {
      setError('Please enter a product URL.');
      return;
    }

    setError('');
    setProduct(null);
    setListing(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/importer/product`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: cleanUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'Product import failed');
      }

      setProduct(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Product import failed',
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadPolicies(storeId: string) {
    const cleanStoreId = storeId.trim();

    if (!cleanStoreId) {
      throw new Error('Store ID is required');
    }

    const response = await fetch(
      `${API_URL}/ebay/policies?storeId=${encodeURIComponent(cleanStoreId)}`,
      {
        credentials: 'include',
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? 'Unable to load eBay policies');
    }

    setPolicies(data);
    return data as EbayPolicies;
  }

  async function generateListing() {
    if (!product) {
      setError('Import a product before generating a listing.');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const response = await fetch(`${API_URL}/ai/generate-listing`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? 'AI generation failed');
      }

      setListing(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'AI generation failed',
      );
    } finally {
      setGenerating(false);
    }
  }

  function handlePublishClick() {
    setError(
      'The Publish button is ready visually. Next, we will connect your store ID, eBay policies, offer creation, and publishing.',
    );

    console.log('Current policies:', policies);
    console.log('Generated listing:', listing);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <h1 className="text-5xl font-bold">AI Product Importer</h1>

      <p className="mt-3 text-slate-400">
        Paste any supplier URL to generate an eBay listing.
      </p>

      <div className="mt-10 max-w-3xl">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.amazon.com/..."
          autoComplete="off"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white placeholder:text-slate-500"
        />

        <button
          type="button"
          onClick={importProduct}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Importing...' : 'Import Product'}
        </button>
      </div>

      {error && (
        <div className="mt-6 max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {product && (
        <section className="mt-10 max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
            Imported successfully
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            {product.title ?? 'Imported Product'}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Supplier</p>
              <p className="font-semibold capitalize">
                {product.source ?? 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Price</p>
              <p className="font-semibold">
                ${Number(product.price ?? 0).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Brand</p>
              <p className="font-semibold">
                {product.brand ?? 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Category</p>
              <p className="font-semibold">
                {product.category ?? 'Unknown'}
              </p>
            </div>
          </div>

          {product.images?.[0] && (
            <img
              src={product.images[0]}
              alt={product.title ?? 'Imported product'}
              className="mt-6 max-h-80 rounded-xl object-contain"
            />
          )}

          <button
            type="button"
            onClick={generateListing}
            disabled={generating}
            className="mt-8 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? 'Generating...' : 'Generate AI Listing'}
          </button>
        </section>
      )}

      {listing && (
        <section className="mt-10 max-w-3xl rounded-2xl border border-emerald-500/30 bg-slate-900 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
            AI listing generated
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            {listing.title ?? 'Generated eBay Listing'}
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-400">Suggested price</p>
              <p className="font-semibold">
                {listing.price ?? '$0.00'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Category</p>
              <p className="font-semibold">
                {listing.category ?? 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Condition</p>
              <p className="font-semibold">
                {listing.condition ?? 'New'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Shipping weight</p>
              <p className="font-semibold">
                {listing.shippingWeight ?? 'Not provided'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-400">Description</p>
            <p className="mt-2 whitespace-pre-wrap">
              {listing.description ?? 'No description generated.'}
            </p>
          </div>

          {listing.itemSpecifics &&
            Object.keys(listing.itemSpecifics).length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-slate-400">
                  Item specifics
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {Object.entries(listing.itemSpecifics).map(
                    ([name, value]) => (
                      <div
                        key={name}
                        className="rounded-lg bg-slate-800 p-3"
                      >
                        <p className="text-xs text-slate-400">
                          {name}
                        </p>
                        <p className="font-medium">{value}</p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {listing.seoKeywords &&
            listing.seoKeywords.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-slate-400">
                  SEO keywords
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.seoKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-slate-800 px-3 py-1 text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

          <button
            type="button"
            onClick={handlePublishClick}
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Publish to eBay
          </button>
        </section>
      )}
    </main>
  );
}