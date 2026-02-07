'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Brain,
  Mail,
  PenLine,
  TestTube,
  FileStack,
  Play,
  Layers,
  Type,
  GitBranch,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useAppBilling } from '@/contexts/AppBillingContext';
import { BlockCard } from '@/components/BlockCard';
import { DEMO_MODE, createCheckoutSession, getProducts } from '@/lib/api';
import type { BlockDefinition } from 'shared';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Mail,
  PenLine,
  TestTube,
  FileStack,
  Play,
  Layers,
  Type,
  GitBranch,
};

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get('checkout');
  const { hasFeatureAccess, entitlementsLoading, refreshEntitlements, entitlementsError } = useAppBilling();

  const [products, setProducts] = useState<BlockDefinition[]>([]);
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    setPageError(null);

    getProducts()
      .then((result) => {
        if (!active) return;
        setProducts(result);
      })
      .catch((error) => {
        if (!active) return;
        setPageError(error instanceof Error ? error.message : 'Failed to fetch products');
      })
      .finally(() => {
        if (!active) return;
        setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (checkoutStatus === 'success') {
      void refreshEntitlements();
    }
  }, [checkoutStatus, refreshEntitlements]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.priceSlug.toLowerCase().includes(q)
      );
    });
  }, [search, products]);

  const handleUnlock = async (priceSlug: string) => {
    const baseUrl = window.location.origin;
    const checkoutSession = await createCheckoutSession({
      priceSlug,
      successUrl: `${baseUrl}/library?checkout=success`,
      cancelUrl: `${baseUrl}/library?checkout=cancelled`,
    });

    if (!checkoutSession?.url) {
      throw new Error('Checkout URL missing from backend response');
    }

    window.location.href = checkoutSession.url;
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-fg">Library</h1>
          <p className="mt-1 text-sm text-app-soft">
            Discover AI blocks, run unlocked tools, and purchase locked tools through Flowglad checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshEntitlements()}
          className="inline-flex items-center gap-2 rounded-lg border border-app px-3 py-2 text-sm text-app-soft transition hover:bg-app-surface hover:text-app-fg"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh access
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {DEMO_MODE ? (
          <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            Demo mode: all blocks unlocked
          </span>
        ) : entitlementsLoading ? (
          <span className="rounded-full border border-app px-3 py-1 text-app-soft">Loading entitlements…</span>
        ) : entitlementsError ? (
          <span className="rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-rose-300">
            Entitlements unavailable: {entitlementsError}
          </span>
        ) : (
          <span className="rounded-full border border-blue-500/35 bg-blue-500/10 px-3 py-1 text-blue-300">
            Entitlements synced
          </span>
        )}
        {checkoutStatus === 'success' && (
          <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-emerald-300">
            Checkout complete. Access updated.
          </span>
        )}
        {checkoutStatus === 'cancelled' && (
          <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-amber-300">
            Checkout cancelled.
          </span>
        )}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-soft" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, capability, or price slug"
          className="w-full rounded-xl border border-app bg-app-surface pl-9 pr-3 py-2.5 text-sm text-app-fg placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {loadingProducts ? (
        <div className="rounded-xl border border-app bg-app-surface p-6 text-sm text-app-soft">Loading products…</div>
      ) : pageError ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-6 text-sm text-rose-300">{pageError}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-app bg-app-surface p-6 text-sm text-app-soft">No blocks match your search.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((block) => {
            const hasAccess = DEMO_MODE || hasFeatureAccess(block.featureSlug);
            const Icon = ICON_MAP[block.icon] ?? Brain;

            return (
              <BlockCard
                key={block.id}
                block={block}
                icon={<Icon className="h-5 w-5" />}
                hasAccess={hasAccess}
                onUnlock={() => handleUnlock(block.priceSlug)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
