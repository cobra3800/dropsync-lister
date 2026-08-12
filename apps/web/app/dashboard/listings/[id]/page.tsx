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

export default async function ListingDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const response = await fetch(`${API_URL}/listings/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <div className="mx-auto max-w-6xl">
          <a
            href="/dashboard/listings"
            className="text-blue-400 hover:underline"
          >
            ← Back to Listings
          </a>

          <div className="mt-6 rounded-xl border border-red-800 bg-red-950/50 p-6 text-red-200">
            Unable to load this listing.
          </div>
        </div>
      </main>
    );
  }

  const listing = (await response.json()) as Listing | null;

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <div className="mx-auto max-w-6xl">
          <a
            href="/dashboard/listings"
            className="text-blue-400 hover:underline"
          >
            ← Back to Listings
          </a>

          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-6">
            Listing not found.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <a
              href="/dashboard/listings"
              className="text-blue-400 hover:underline"
            >
              ← Back to Listings
            </a>

            <h1 className="mt-3 text-4xl font-bold">
              Listing Details
            </h1>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              listing.status === "ACTIVE"
                ? "bg-green-600"
                : listing.status === "FAILED"
                  ? "bg-red-600"
                  : "bg-blue-600"
            }`}
          >
            {listing.status}
          </span>
        </div>

        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-800 text-slate-500">
              {listing.imageUrl ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                "No image available"
              )}
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-slate-400">Listing ID</p>
                <p className="mt-1 break-all">{listing.id}</p>
              </div>

              <div>
                <p className="text-slate-400">eBay Item ID</p>
                <p className="mt-1">
                  {listing.externalId ?? "Not available"}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Marketplace</p>
                <p className="mt-1">{listing.marketplace}</p>
              </div>

              <div>
                <p className="text-slate-400">Created</p>
                <p className="mt-1">
                  {new Date(listing.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8">
            <h2 className="text-2xl font-bold">
              {listing.title}
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Price</p>
                <p className="mt-2 text-2xl font-bold">
                  {listing.price === null
                    ? "Not set"
                    : `$${listing.price.toFixed(2)}`}
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Quantity</p>
                <p className="mt-2 text-2xl font-bold">
                  {listing.quantity}
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">SKU</p>
                <p className="mt-2 break-all font-medium">
                  {listing.sku ?? "Not set"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-800 p-5">
                <p className="text-sm text-slate-400">Last updated</p>
                <p className="mt-2 font-medium">
                  {new Date(listing.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
  href={`/dashboard/listings/${listing.id}/edit`}
  className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
>
  Edit Listing
</a>

              <button
                type="button"
                className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-700"
              >
                Optimize with AI
              </button>

              {listing.externalUrl ? (
                <a
                  href={listing.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
                >
                  View on eBay
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}