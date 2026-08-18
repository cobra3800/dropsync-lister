'use client';

import { useEffect, useState } from 'react';

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

type Store = {
  id: string;
  ebayAccount?: unknown;
};

type QueueItem = {
  id?: string;
  supplierUrl?: string;
  title?: string;
  status?: string;
  progress?: number;
  error?: string | null;
};

type PublishResult = {
  queued?: boolean;
  queueId?: string;
  status?: string;
  listingId?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The server returned an invalid response.');
  }
}

function messageFrom(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof (data as { message?: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

export default function ImportPage() {
  const [url, setUrl] = useState('');
  const [storeId, setStoreId] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [publishStep, setPublishStep] = useState('');
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadQueue();
  }, []);

  async function importProduct() {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('Please enter a product URL.');
      return;
    }

    setLoading(true);
    setError('');
    setProduct(null);
    setListing(null);
    setPublishResult(null);
    setPublishStep('');

    try {
      const response = await fetch(`${API_URL}/importer/product`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(messageFrom(data, 'Product import failed'));
      setProduct(data as Product);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Product import failed');
    } finally {
      setLoading(false);
    }
  }

  async function generateListing() {
    if (!product) {
      setError('Import a product first.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/ai/generate-listing`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(messageFrom(data, 'AI generation failed'));
      setListing(data as Listing);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function loadStoreId(): Promise<string> {

const response = await fetch(`${API_URL}/stores`, {
    credentials: 'include',
});
    const data = await readJson(response);
    if (!response.ok) throw new Error(messageFrom(data, 'Unable to load stores'));
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No store was found for this account.');
    }

    const stores = data as Store[];
    const connected = stores.find((store) => Boolean(store.ebayAccount)) ?? stores[0];
    if (!connected?.id) throw new Error('No connected eBay store was found.');

    setStoreId(connected.id);
    return connected.id;
  }

  async function loadQueue() {
    setQueueLoading(true);
    try {
      const response = await fetch(`${API_URL}/importer/queue`, {
  credentials: 'include',
  cache: 'no-store',
});
      const data = await readJson(response);
      if (response.ok && Array.isArray(data)) setQueue(data as QueueItem[]);
    } catch (caught) {
      console.error('Unable to load queue:', caught);
    } finally {
      setQueueLoading(false);
    }
  }

  async function handleAutoListClick() {
    console.log('AUTO LIST CLICKED');
    if (!product) {
      setError('Import a product first.');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishStep('Adding product to import queue...');
    setPublishResult(null);

    try {
      const activeStoreId = storeId || (await loadStoreId());
      const response = await fetch(`${API_URL}/importer/queue`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStoreId, supplierUrl: url.trim() }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(messageFrom(data, 'Unable to add product to queue'));

      const item = data as QueueItem;

setPublishResult({
  queued: true,
  queueId: item.id,
  status: item.status,
});

setPublishStep('');
await loadQueue();
} catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add product to queue');
      setPublishStep('');
    } finally {
      setPublishing(false);
    }
  }
  async function deleteQueueItem(id?: string) {
  if (!id) {
    setError('Queue item ID is missing.');
    return;
  }

  const confirmed = window.confirm('Delete this queue job?');

  if (!confirmed) {
    return;
  }

  try {
    setError('');

    const response = await fetch(
      `${API_URL}/importer/queue/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    );

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        messageFrom(data, 'Unable to delete queue item'),
      );
    }

    setQueue((currentQueue) =>
      currentQueue.filter((job) => job.id !== id),
    );
  } catch (caught) {
    setError(
      caught instanceof Error
        ? caught.message
        : 'Unable to delete queue item',
    );
  }
}

async function clearCompletedQueue() {
  const confirmed = window.confirm(
    'Delete all completed queue jobs?',
  );

  if (!confirmed) {
    return;
  }

  try {
    setError('');

    const response = await fetch(
      `${API_URL}/importer/queue/completed`,
      {
        method: 'DELETE',
        credentials: 'include',
      },
    );

    const data = await readJson(response);

    if (!response.ok) {
      throw new Error(
        messageFrom(data, 'Unable to clear completed jobs'),
      );
    }

    setQueue((currentQueue) =>
      currentQueue.filter((job) => job.status !== 'COMPLETED'),
    );
  } catch (caught) {
    setError(
      caught instanceof Error
        ? caught.message
        : 'Unable to clear completed jobs',
    );
  }
}

  async function handleOptimizeClick() {
    if (!product || !listing) {
      setError('Import a product and generate a listing first.');
      return;
    }

    setGenerating(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/ai/optimize-listing`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, listing }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(messageFrom(data, 'Unable to optimize listing'));
      setListing({ ...listing, ...(data as Listing) });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to optimize listing');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublishClick() {
    if (!product || !listing) {
      setError('Import a product and generate a listing first.');
      return;
    }

    setPublishing(true);
    setError('');
    setPublishResult(null);
    setPublishStep('Publishing listing to eBay...');

    try {
      const activeStoreId = storeId || (await loadStoreId());

setPublishStep('Finding best eBay category...');

const categoryResponse = await fetch(
  `${API_URL}/ebay/category-suggestions?storeId=${encodeURIComponent(
    activeStoreId,
  )}&title=${encodeURIComponent(listing.title || product.title || '')}`,
  {
    credentials: 'include',
  },
);

const categoryData = await readJson(categoryResponse);

if (!categoryResponse.ok) {
  throw new Error(
    messageFrom(categoryData, 'Unable to find eBay category'),
  );
}

const suggestions = Array.isArray(categoryData)
  ? categoryData
  : [categoryData];

const productText = [
  listing.title,
  product.title,
  listing.description,
product.description,
  listing.category,
  product.category,
  ...Object.keys(listing.itemSpecifics ?? {}),
  ...Object.values(listing.itemSpecifics ?? {}).map(String),
]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const scoredSuggestions = [...suggestions]
  .map((suggestion) => {
    const categoryNames = [
      suggestion?.category?.categoryName,
      suggestion?.categoryName,
      ...(suggestion?.categoryTreeNodeAncestors ?? []).map(
        (ancestor: { categoryName?: string }) => ancestor.categoryName,
      ),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const words = categoryNames
      .split(/[^a-z0-9]+/)
      .filter(
        (word) =>
          word.length > 2 &&
          !['other', 'and', 'the', 'for'].includes(word),
      );

    const strongWords = [
      'oxygen',
      'canned oxygen',
      'portable oxygen',
      'supplemental oxygen',
      'respiratory',
      'breathing',
      'altitude',
      'aerobic',
      'recovery',
      'fitness',
      'sports',
      'travel',
    ];

    const categoryMatchScore = words.reduce((total, word) => {
      if (!productText.includes(word)) {
        return total;
      }

      return total + 1;
    }, 0);

    const strongMatchScore = strongWords.reduce((total, phrase) => {
      const productHasPhrase = productText.includes(phrase);
      const categoryHasPhrase = categoryNames.includes(phrase);

      if (productHasPhrase && categoryHasPhrase) {
        return total + 8;
      }

      if (
        productHasPhrase &&
        words.some((word) => phrase.includes(word))
      ) {
        return total + 2;
      }

      return total;
    }, 0);

    const score = categoryMatchScore + strongMatchScore;

    console.log('EBAY CATEGORY SCORE:', {
      categoryId:
        suggestion?.category?.categoryId ??
        suggestion?.categoryId,
      categoryName:
        suggestion?.category?.categoryName ??
        suggestion?.categoryName,
      score,
      matchedWords: words.filter((word) =>
        productText.includes(word),
      ),
    });

    return { suggestion, score };
  })
  .sort((a, b) => b.score - a.score);

let selectedSuggestion = scoredSuggestions[0]?.suggestion ?? suggestions[0];

for (const candidate of scoredSuggestions) {
  const candidateCategoryId = String(
    candidate.suggestion?.category?.categoryId ??
      candidate.suggestion?.categoryId ??
      '',
  ).trim();

  if (!candidateCategoryId) {
    continue;
  }

  try {
    const aspectsResponse = await fetch(
      `${API_URL}/ebay/category-aspects?storeId=${encodeURIComponent(
        activeStoreId,
      )}&categoryId=${encodeURIComponent(candidateCategoryId)}`,
      {
        credentials: 'include',
      },
    );

    if (!aspectsResponse.ok) {
      continue;
    }

    const categoryAspects = await readJson(aspectsResponse);

    if (!Array.isArray(categoryAspects)) {
      continue;
    }

    const hasConflict = categoryAspects.some((aspect) => {
      if (
        !aspect?.required ||
        !Array.isArray(aspect?.values) ||
        aspect.values.length === 0
      ) {
        return false;
      }

      const suppliedEntry = Object.entries(
        listing.itemSpecifics ?? {},
      ).find(
        ([name]) =>
          name.toLowerCase() ===
          String(aspect.name ?? '').toLowerCase(),
      );

      if (!suppliedEntry) {
        return false;
      }

      const rawValue = suppliedEntry[1];

      const suppliedValues = Array.isArray(rawValue)
        ? rawValue.map(String)
        : [String(rawValue)];

      const matchesAllowedValue = suppliedValues.some((suppliedValue) =>
        aspect.values.some(
          (allowedValue: string) =>
            allowedValue.toLowerCase() ===
            suppliedValue.toLowerCase(),
        ),
      );

      if (!matchesAllowedValue) {
        console.log('SKIPPING INCOMPATIBLE EBAY CATEGORY:', {
          categoryId: candidateCategoryId,
          categoryName:
            candidate.suggestion?.category?.categoryName ??
            candidate.suggestion?.categoryName,
          aspectName: aspect.name,
          suppliedValues,
          allowedValues: aspect.values,
        });
      }

      return !matchesAllowedValue;
    });

    if (!hasConflict) {
      selectedSuggestion = candidate.suggestion;
      break;
    }
  } catch (error) {
    console.error(
      'Unable to validate eBay category:',
      candidateCategoryId,
      error,
    );
  }
}

console.log(
  'SELECTED EBAY CATEGORY:',
  JSON.stringify(selectedSuggestion, null, 2),
);

const categoryId = String(
  selectedSuggestion?.categoryId ??
    selectedSuggestion?.category?.categoryId ??
    '',
).trim();

if (!categoryId) {
  throw new Error('eBay did not return a category ID.');
}

const aspects: Record<string, string[]> = {};

for (const [name, value] of Object.entries(
  listing.itemSpecifics ?? {},
)) {
  if (
  name.toLowerCase() !== 'condition' &&
  typeof value === 'string' &&
  value.trim()
) {
    aspects[name] = [value.trim()];
  }
}
if (
  aspects.Type?.[0]
    ?.toLowerCase()
    .includes('spin mop')
) {
  aspects.Type = ['Spin Mop'];
}
if (!aspects.Type?.length) {
  aspects.Type = ['Other'];
}
const price = Number(listing.price ?? product.price ?? 0);

if (!Number.isFinite(price) || price <= 0) {
  throw new Error('A valid selling price is required.');
}

const sku = `DS-${Date.now()}`;

setPublishStep('Creating and publishing eBay listing...');

const response = await fetch(
  `${API_URL}/ebay/publish-ai-listing`,
  {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      storeId: activeStoreId,
      sku,
      title: listing.title || product.title || 'Untitled Product',
      description:
        listing.description ?? product.description ?? '',
      price,
      quantity: 1,
      categoryId,
      condition: listing.condition || 'NEW',
      imageUrls: product.images ?? [],
      brand: product.brand ?? '',
      mpn: '',
      aspects,
    }),
  },
);
      const data = await readJson(response);
      if (!response.ok) throw new Error(messageFrom(data, 'Unable to publish listing'));
      setPublishResult(data as PublishResult);
      setPublishStep('Published successfully!');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to publish listing');
      setPublishStep('');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">AI Product Importer</h1>
        <p className="mt-3 text-slate-300">
          Paste a supplier URL to import a product and create an eBay listing.
        </p>

        <input
  type="text"
  value={url}
  onChange={(event) => setUrl(event.target.value)}
  placeholder="https://www.walmart.com/..."
  autoComplete="off"
  spellCheck={false}
  style={{
    color: "white",
    WebkitTextFillColor: "white",
    caretColor: "white",
  }}
  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-white placeholder:text-slate-400"
/>
          <button
            type="button"
            onClick={importProduct}
            disabled={loading}
            className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            {loading ? 'Importing...' : 'Import Product'}
          </button>
        </div>

        {error && (
          <div className="mt-6 max-w-3xl rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {product ? (
          <section className="mt-8 max-w-3xl rounded-2xl border border-blue-500/30 bg-slate-900 p-6">
            <p className="text-sm font-semibold uppercase text-blue-400">Imported successfully</p>
            <h2 className="mt-3 text-2xl font-bold">{product.title ?? 'Imported Product'}</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info label="Supplier" value={product.source ?? 'Unknown'} />
              <Info label="Price" value={`$${Number(product.price ?? 0).toFixed(2)}`} />
              <Info label="Brand" value={product.brand ?? 'Unknown'} />
              <Info label="Category" value={product.category ?? 'Unknown'} />
            </div>

            {product.images?.[0] ? (
              <div className="mt-6 flex justify-center rounded-xl bg-slate-950 p-4">
                <img
                  src={product.images[0]}
                  alt={product.title ?? 'Imported product'}
                  className="max-h-64 max-w-full rounded-lg object-contain"
                />
              </div>
            ) : null}

            {product.description ? (
              <p className="mt-6 whitespace-pre-wrap">{product.description}</p>
            ) : null}

            <button
              type="button"
              onClick={generateListing}
              disabled={generating}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 font-semibold disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate AI Listing'}
            </button>
          </section>
        ) : null}

        {listing ? (
          <section className="mt-8 max-w-3xl rounded-2xl border border-emerald-500/30 bg-slate-900 p-6">
            <p className="text-sm font-semibold uppercase text-emerald-400">AI listing generated</p>
            <h2 className="mt-3 text-2xl font-bold">{listing.title ?? 'Generated eBay Listing'}</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Info label="Suggested price" value={listing.price ?? '$0.00'} />
              <Info label="Category" value={listing.category ?? 'Unknown'} />
              <Info label="Condition" value={listing.condition ?? 'New'} />
              <Info label="Shipping weight" value={listing.shippingWeight ?? 'Not provided'} />
            </div>

            <p className="mt-6 whitespace-pre-wrap">
              {listing.description ?? 'No description generated.'}
            </p>

            {listing.itemSpecifics && Object.keys(listing.itemSpecifics).length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {Object.entries(listing.itemSpecifics).map(([name, value]) => (
                  <Info key={name} label={name} value={value} />
                ))}
              </div>
            ) : null}

            {listing.seoKeywords?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {listing.seoKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-slate-800 px-3 py-1 text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            ) : null}

            {publishStep ? (
              <div className="mt-6 rounded-xl border border-blue-500/40 bg-blue-500/10 p-4">
                {publishStep}
              </div>
            ) : null}

            {publishResult ? (
              <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                {publishResult.queued ? 'Product added to queue successfully.' : 'Listing published successfully.'}
                {publishResult.listingId ? <p className="mt-2">Listing ID: {publishResult.listingId}</p> : null}
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAutoListClick}
                disabled={publishing || generating || loading}
                className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold disabled:opacity-50"
              >
                🤖 Auto List
              </button>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleOptimizeClick}
                  disabled={generating || publishing || loading}
                  className="flex-1 rounded-lg bg-purple-600 px-4 py-3 font-semibold disabled:opacity-50"
                >
                  ✨ Optimize Listing
                </button>
                <button
                  type="button"
                  onClick={handlePublishClick}
                  disabled={publishing || generating || loading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold disabled:opacity-50"
                >
                  🚀 Publish to eBay
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Import Queue</h2>
            <div className="flex gap-2">
  <button
    type="button"
    onClick={() => void loadQueue()}
    disabled={queueLoading}
    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold disabled:opacity-50"
  >
    {queueLoading ? 'Loading...' : 'Refresh'}
  </button>

  <button
    type="button"
    onClick={() => void clearCompletedQueue()}
    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
  >
    🧹 Clear Completed
  </button>
</div>
          </div>

          {queue.length === 0 ? (
            <p className="mt-4 text-slate-400">No queue jobs yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {queue.map((job, index) => (
                <div key={job.id ?? index} className="rounded-xl bg-slate-800 p-4">
  <p className="font-semibold">
    {job.title ?? job.supplierUrl ?? 'Queued product'}
  </p>

  <p className="mt-1 text-sm text-slate-300">
    {job.status ?? 'UNKNOWN'}
    {typeof job.progress === 'number' ? ` • ${job.progress}%` : ''}
  </p>

  {job.error ? (
    <p className="mt-2 text-sm text-red-300">{job.error}</p>
  ) : null}

  <button
    className="mt-3 rounded bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-700"
    onClick={() => deleteQueueItem(job.id)}
  >
    🗑 Delete
  </button>
</div>
              ))}
            </div>
          )}
        </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800 p-3">
      <p className="text-sm text-slate-300">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}