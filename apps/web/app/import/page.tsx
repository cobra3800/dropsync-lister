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

type EbayPolicy = {
  fulfillmentPolicyId?: string;
  paymentPolicyId?: string;
  returnPolicyId?: string;
};

type EbayPolicies = {
  fulfillmentPolicies?: EbayPolicy[];
  paymentPolicies?: EbayPolicy[];
  returnPolicies?: EbayPolicy[];
};

type Store = {
  id: string;
  name?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [storeId, setStoreId] = useState('');

  const [product, setProduct] = useState<Product | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [policies, setPolicies] = useState<EbayPolicies | null>(null);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [publishStep, setPublishStep] = useState('');
  const [publishResult, setPublishResult] = useState<any>(null);
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
    setPublishResult(null);
    setPublishStep('');
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

  async function generateListing() {
    if (!product) {
      setError('Import a product before generating a listing.');
      return;
    }

    setError('');
    setListing(null);
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
    async function createDefaultStore() {
  const response = await fetch(`${API_URL}/stores`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'My eBay Store',
      marketplace: 'EBAY_US',
      organizationId: 'owner-org',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to create store');
  }

  setStoreId(data.id);

  return data;
}

  async function loadStoreId() {
  const response = await fetch(`${API_URL}/stores`, {
    credentials: 'include',
  });

  const data = await response.json();
  async function loadStoreId() {
  const response = await fetch(`${API_URL}/stores`, {
    credentials: 'include',
  });

  const data = await response.json();

  console.log('Stores returned by API:', data);

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load stores');
  }

  // Keep the remaining connectedStore code here
}

  if (!response.ok) {
    throw new Error(data.message ?? 'Unable to load stores');
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No store was found for this account');
  }

  const connectedStore =
    data.find((store: Store & { ebayAccount?: unknown }) =>
      Boolean(store.ebayAccount),
    ) ?? null;

  if (!connectedStore?.id) {
    throw new Error(
      'No eBay-connected store was found. Reconnect your eBay account.',
    );
  }

  console.log('Using connected eBay store:', connectedStore);

  setStoreId(connectedStore.id);

  return connectedStore.id as string;
}

  async function loadPolicies(activeStoreId: string) {
    const cleanStoreId = activeStoreId.trim();

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
  throw new Error(data.message ?? 'Unable to load stores');
}

    setPolicies(data);

    return data as EbayPolicies;
  }

  async function handlePublishClick() {
    if (!product || !listing) {
      setError('Import a product and generate an AI listing first.');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishResult(null);
    setPublishStep('Loading connected store...');

    try {
      const activeStoreId = storeId || (await loadStoreId());
      const sku = `dropsync-${Date.now()}`;

      setPublishStep('Loading eBay policies...');

const activePolicies =
  policies ?? (await loadPolicies(activeStoreId));

const fulfillmentData =
  activePolicies.fulfillmentPolicies as unknown as {
    total: number;
    fulfillmentPolicies: Array<{
      fulfillmentPolicyId: string;
    }>;
  };

const paymentData =
  activePolicies.paymentPolicies as unknown as {
    total: number;
    paymentPolicies: Array<{
      paymentPolicyId: string;
    }>;
  };

const returnData =
  activePolicies.returnPolicies as unknown as {
    total: number;
    returnPolicies: Array<{
      returnPolicyId: string;
    }>;
  };

const fulfillmentPolicyId =
  fulfillmentData.fulfillmentPolicies?.[0]?.fulfillmentPolicyId ?? '';

const paymentPolicyId =
  paymentData.paymentPolicies?.[0]?.paymentPolicyId ?? '';

const returnPolicyId =
  returnData.returnPolicies?.[0]?.returnPolicyId ?? '';

console.log('Active policies:', activePolicies);

console.log('Policy IDs:', {
  fulfillmentPolicyId,
  paymentPolicyId,
  returnPolicyId,
});

if (!fulfillmentPolicyId || !paymentPolicyId || !returnPolicyId) {
  throw new Error(
    'Missing eBay business policies. Create fulfillment, payment, and return policies in the connected eBay seller account.',
  );
}

setPublishStep('Creating inventory item...');

      const inventoryResponse = await fetch(
        `${API_URL}/ebay/inventory-item`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId: activeStoreId,
            sku,
            title: listing.title ?? product.title,
            description: listing.description ?? product.description,
            quantity: 1,
            condition: 'NEW',
            imageUrls: product.images ?? [],
            aspects: {
               Type: ['Pedestal Fan'],
},
          }),
        },
      );

      const inventoryResult = await inventoryResponse.json();

      if (!inventoryResponse.ok) {
        throw new Error(
          inventoryResult.message ?? 'Unable to create inventory item',
        );
      }

      setPublishStep('Creating eBay offer...');

const rawOfferPrice = Number(listing.price ?? product.price ?? 0);

const offerPrice =
  Number.isFinite(rawOfferPrice) && rawOfferPrice > 0
    ? rawOfferPrice
    : 19.99;

console.log('Offer price being sent:', offerPrice);

const offerResponse = await fetch(
  `${API_URL}/ebay/create-offer`,
  {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      storeId: activeStoreId,
      sku,
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      availableQuantity: 1,
      categoryId: '20612',
      merchantLocationKey: 'main',
      price: offerPrice,
      currency: 'USD',
      fulfillmentPolicyId,
      paymentPolicyId,
      returnPolicyId,
    }),
  },
);

const offerResult = await offerResponse.json();

      if (!offerResponse.ok) {
        throw new Error(
          offerResult.message ?? 'Unable to create eBay offer',
        );
      }

      if (!offerResult.offerId) {
        throw new Error('eBay did not return an offer ID');
      }

      setPublishStep('Publishing offer to eBay...');

      const publishResponse = await fetch(
        `${API_URL}/ebay/publish-offer`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeId: activeStoreId,
            offerId: offerResult.offerId,
          }),
        },
      );

      const result = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(
          result.message ?? 'Unable to publish eBay offer',
        );
      }

      setPublishResult(result);
      setPublishStep('Published successfully!');
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to publish listing';

      console.error(caughtError);
      setError(message);
      setPublishStep('');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <h1 className="text-5xl font-bold">
        AI Product Importer
      </h1>

      <p className="mt-3 text-slate-300">
        Paste any supplier URL to generate an eBay listing.
      </p>

      <div className="mt-10 max-w-3xl">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.amazon.com/..."
          autoComplete="off"
          style={{
            color: 'white',
            WebkitTextFillColor: 'white',
            caretColor: 'white',
          }}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white placeholder:text-slate-400"
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
        <div className="mt-6 max-w-3xl rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
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
              <p className="text-sm text-slate-200">
                Supplier
              </p>
              <p className="font-semibold capitalize">
                {product.source ?? 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-200">Price</p>
              <p className="font-semibold">
                ${Number(product.price ?? 0).toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-200">Brand</p>
              <p className="font-semibold">
                {product.brand ?? 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-200">
                Category
              </p>
              <p className="font-semibold">
                {product.category ?? 'Unknown'}
              </p>
            </div>
          </div>

          {product.images?.[0] && (
            <div className="mt-6 flex justify-center rounded-xl bg-slate-800 p-4">
              <img
                src={product.images[0]}
                alt={product.title ?? 'Imported product'}
                className="max-h-64 max-w-full rounded-lg object-contain"
              />
            </div>
          )}

          <button
            type="button"
            onClick={generateListing}
            disabled={generating}
            className="mt-8 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating
              ? 'Generating...'
              : 'Generate AI Listing'}
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
              <p className="text-sm text-slate-200">
                Suggested price
              </p>
              <p className="font-semibold">
                {listing.price ?? '$0.00'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-200">
                Category
              </p>
              <p className="font-semibold">
                {listing.category ?? 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-200">
                Condition
              </p>
              <p className="font-semibold">
                {listing.condition ?? 'New'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-200">
                Shipping weight
              </p>
              <p className="font-semibold">
                {listing.shippingWeight ?? 'Not provided'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-200">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap">
              {listing.description ??
                'No description generated.'}
            </p>
          </div>

          {listing.itemSpecifics &&
            Object.keys(listing.itemSpecifics).length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-slate-200">
                  Item specifics
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {Object.entries(listing.itemSpecifics).map(
                    ([name, value]) => (
                      <div
                        key={name}
                        className="rounded-lg bg-slate-800 p-3"
                      >
                        <p className="text-xs text-slate-300">
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
                <p className="text-sm text-slate-200">
                  SEO keywords
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.seoKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-slate-800 px-3 py-1 text-sm text-white"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {publishStep && (
            <div className="mt-6 rounded-xl border border-blue-500/40 bg-blue-500/10 p-4">
              <p className="font-semibold text-white">
                {publishStep}
              </p>
            </div>
          )}

          {publishResult && (
            <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <p className="font-semibold text-emerald-200">
                Listing published successfully.
              </p>

              {publishResult.listingId && (
                <p className="mt-2 text-white">
                  Listing ID: {publishResult.listingId}
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handlePublishClick}
            disabled={publishing}
            className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {publishing ? 'Publishing...' : 'Publish to eBay'}
          </button>
        </section>
      )}
    </main>
  );
}