'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { FlowgladProvider, useBilling } from '@flowglad/nextjs';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AppBillingValue = {
  loaded: boolean;
  checkFeatureAccess?: (featureSlug: string) => boolean;
  createCheckoutSession?: (opts: {
    priceSlug: string;
    successUrl: string;
    cancelUrl: string;
    autoRedirect?: boolean;
  }) => Promise<unknown>;
  customer?: { name?: string; email?: string };
  subscriptions?: Array<{ id: string; status: string; currentPeriodEnd?: number }>;
  invoices?: Array<{ id: string; status?: string; total?: number; invoiceDate?: number }>;
  billingPortalUrl?: string;
  reload?: () => void;
  errors?: unknown[];
};

const DEMO_BILLING: AppBillingValue = {
  loaded: true,
  checkFeatureAccess: () => true,
  createCheckoutSession: async () => {},
  customer: { name: 'Demo user', email: 'demo@example.com' },
  subscriptions: [],
  invoices: [],
  billingPortalUrl: undefined,
  reload: () => {},
  errors: undefined,
};

const AppBillingContext = createContext<AppBillingValue>({
  loaded: false,
});

function FlowgladBillingBridge({ children }: { children: ReactNode }) {
  const billing = useBilling();
  const value: AppBillingValue = {
    loaded: billing.loaded,
    checkFeatureAccess: billing.checkFeatureAccess,
    createCheckoutSession: billing.createCheckoutSession,
    customer: billing.customer,
    subscriptions: billing.subscriptions,
    invoices: billing.invoices,
    billingPortalUrl: billing.billingPortalUrl,
    reload: billing.reload,
    errors: billing.errors,
  };
  return (
    <AppBillingContext.Provider value={value}>
      {children}
    </AppBillingContext.Provider>
  );
}

export function useAppBilling(): AppBillingValue {
  return useContext(AppBillingContext);
}

export function AppBillingRoot({ children }: { children: ReactNode }) {
  if (DEMO_MODE) {
    return (
      <AppBillingContext.Provider value={DEMO_BILLING}>
        {children}
      </AppBillingContext.Provider>
    );
  }
  return (
    <FlowgladProvider
      requestConfig={{
        baseURL: apiBase,
        headers: {
          'X-User-Id': 'demo-user-1',
        },
      }}
    >
      <FlowgladBillingBridge>{children}</FlowgladBillingBridge>
    </FlowgladProvider>
  );
}
