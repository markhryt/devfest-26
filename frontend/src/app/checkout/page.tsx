'use client';

import Link from 'next/link';
import { useAppBilling } from '@/contexts/AppBillingContext';
import { BLOCK_DEFINITIONS } from 'shared';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function CheckoutPage() {
  const { createCheckoutSession, loaded, checkFeatureAccess } = useAppBilling();

  if (!DEMO_MODE && !loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="max-w-2xl mx-auto w-full p-6 flex-1">
        <h1 className="text-xl font-semibold text-zinc-100 mb-1">Checkout</h1>
        <p className="text-zinc-400 mb-2">
          Unlock blocks below. You will be redirected to Flowglad to complete payment.
        </p>
        <p className="text-zinc-500 text-sm mb-6">
          <Link href="/profile" className="text-emerald-400 hover:text-emerald-300">
            Manage billing & invoices
          </Link>
          {' '}in Profile.
        </p>
        <ul className="space-y-3">
          {BLOCK_DEFINITIONS.map((block) => {
            const hasAccess = DEMO_MODE || (checkFeatureAccess?.(block.featureSlug) ?? false);
            return (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3"
              >
                <span className="font-medium text-zinc-100">{block.name}</span>
                {hasAccess ? (
                  <span className="text-sm text-emerald-400">Unlocked</span>
                ) : (
                  <button
                    onClick={() =>
                      createCheckoutSession?.({
                        priceSlug: block.priceSlug,
                        successUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/block-library`,
                        cancelUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/checkout`,
                        autoRedirect: true,
                      })
                    }
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    Purchase
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
