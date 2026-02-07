'use client';

import { useAppBilling } from '@/contexts/AppBillingContext';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function ProfilePage() {
  const {
    loaded,
    customer,
    subscriptions,
    invoices,
    billingPortalUrl,
    reload,
    errors,
  } = useAppBilling();

  if (!DEMO_MODE && !loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Loading billing…</p>
      </div>
    );
  }

  if (errors?.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">Unable to load billing data.</p>
        <button
          onClick={() => reload?.()}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeSubs = subscriptions?.filter((s) => s.status === 'active') ?? [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="max-w-2xl mx-auto w-full p-6 flex-1 space-y-8">
        <h1 className="text-xl font-semibold text-zinc-100 mb-1">Profile</h1>
        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Account
          </h2>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4">
            <p className="text-zinc-100 font-medium">{customer?.name ?? '—'}</p>
            <p className="text-sm text-zinc-400">{customer?.email ?? '—'}</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Subscriptions
          </h2>
          {activeSubs.length === 0 ? (
            <p className="text-zinc-500 text-sm">No active subscriptions. Unlock blocks from Block Library or Checkout.</p>
          ) : (
            <ul className="space-y-2">
              {activeSubs.map((sub) => (
                <li
                  key={sub.id}
                  className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 flex justify-between items-center"
                >
                  <span className="text-zinc-100">{sub.status}</span>
                  <span className="text-sm text-zinc-400">
                    {sub.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                      : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Invoices
          </h2>
          {!invoices?.length ? (
            <p className="text-zinc-500 text-sm">No invoices yet. Usage and purchases will appear here.</p>
          ) : (
            <ul className="space-y-2">
              {invoices.slice(0, 10).map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-lg border border-zinc-700 bg-zinc-900/80 px-4 py-3 flex justify-between items-center"
                >
                  <div>
                    <span className="text-zinc-100">{inv.status ?? '—'}</span>
                    {'invoiceDate' in inv && typeof inv.invoiceDate === 'number' && (
                      <span className="text-zinc-500 text-xs ml-2">
                        {new Date(inv.invoiceDate * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-zinc-400">
                    {inv.total != null ? `$${(inv.total / 100).toFixed(2)}` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {billingPortalUrl && (
          <a
            href={billingPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-600"
          >
            Open Billing Portal
          </a>
        )}
      </div>
    </div>
  );
}
