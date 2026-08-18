'use client';

import { useEffect, useState } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Store = {
  id: string;
  platform?: string;
  name?: string;
  connected?: boolean;
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStores() {
      try {
        const response = await fetch(`${API_URL}/stores`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Unable to load stores (${response.status})`);
        }

        const data = await response.json();

        setStores(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load connected stores',
        );
      } finally {
        setLoading(false);
      }
    }

    loadStores();
  }, []);
async function handleDeleteStore(storeId: string, storeName: string) {
  const confirmed = window.confirm(
    `Delete "${storeName}"?\n\nThis cannot be undone.`,
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/stores/${storeId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);

      throw new Error(
        data?.message || `Unable to delete store (${response.status})`,
      );
    }

    setStores((currentStores) =>
      currentStores.filter((store) => store.id !== storeId),
    );
  } catch (err) {
    alert(
      err instanceof Error
        ? err.message
        : 'Unable to delete store',
    );
  }
}
  return (
    <main
      style={{
        padding: '32px',
        minHeight: '100vh',
        background: '#020617',
        color: 'white',
      }}
    >
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
        Stores
      </h1>

      <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
        Manage your connected sales channels.
      </p>

      {loading && <p>Loading stores...</p>}

      {error && (
        <p style={{ color: '#f87171' }}>
          {error}
        </p>
      )}

      {!loading && !error && stores.length === 0 && (
        <p style={{ color: '#94a3b8' }}>
          No connected stores found.
        </p>
      )}

      {stores.map((store) => {
  const isActiveSandbox =
    store.id === 'cmr15cccm000173wqjiv5kfmj';

  const hasEbayAccount = Boolean((store as any).ebayAccount);

  return (
    <div
      key={store.id}
      style={{
        maxWidth: '700px',
        padding: '24px',
        marginBottom: '16px',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        background: '#0f172a',
      }}
    >
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '12px',
        }}
      >
        {store.name || store.platform || 'eBay Store'}
      </h2>

      <p
        style={{
          color: isActiveSandbox ? '#22c55e' : '#f59e0b',
          marginBottom: '8px',
          fontWeight: 600,
        }}
      >
        {isActiveSandbox
          ? 'Active eBay Sandbox'
          : hasEbayAccount
            ? 'Connected'
            : 'Incomplete / Old Store Record'}
      </p>

      <p style={{ color: '#94a3b8', marginBottom: '6px' }}>
        Store ID: {store.id}
      </p>

      {'marketplace' in store && (
  <p style={{ color: '#94a3b8' }}>
    Marketplace: {(store as any).marketplace || 'Not set'}
  </p>
)}

{!isActiveSandbox && !hasEbayAccount && (
  <button
    type="button"
    onClick={() =>
      handleDeleteStore(
        store.id,
        store.name || store.platform || 'eBay Store',
      )
    }
    style={{
      marginTop: '18px',
      padding: '10px 16px',
      border: 'none',
      borderRadius: '8px',
      background: '#dc2626',
      color: 'white',
      fontWeight: 700,
      cursor: 'pointer',
    }}
  >
    Delete Store
  </button>
)}

</div>
    );
  })}

    </main>
  );
}