import { Router } from 'express';
import { BLOCK_DEFINITIONS } from 'shared';
import { flowglad } from '../lib/flowglad.js';
import { getCustomerExternalId } from '../lib/auth.js';

export const productsRouter = Router();

productsRouter.get('/', async (req, res) => {
  let getPrice: ((priceSlug: string) => unknown) | null = null;

  try {
    const userId = await getCustomerExternalId(req);
    const billing = await flowglad(userId).getBilling();
    if ('getPrice' in billing && typeof billing.getPrice === 'function') {
      getPrice = (slug: string) => billing.getPrice(slug);
    }
  } catch (error) {
    console.warn('[Products] Unable to resolve pricing model for request:', error);
  }

  res.json({
    products: BLOCK_DEFINITIONS.map((b) => ({
      ...(function resolvePricing() {
        const price = getPrice?.(b.priceSlug);
        if (!price || typeof price !== 'object') return {};
        const unit = 'unitPrice' in price ? (price as { unitPrice?: unknown }).unitPrice : undefined;
        const currency = 'currency' in price ? (price as { currency?: unknown }).currency : undefined;
        const name = 'name' in price ? (price as { name?: unknown }).name : undefined;
        const type = 'type' in price ? (price as { type?: unknown }).type : undefined;

        return {
          priceUnitAmount: typeof unit === 'number' ? unit : undefined,
          priceCurrency: typeof currency === 'string' ? currency : undefined,
          priceName: typeof name === 'string' ? name : null,
          priceType:
            type === 'single_payment' || type === 'subscription' || type === 'usage'
              ? type
              : undefined,
        };
      })(),
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      featureSlug: b.featureSlug,
      priceSlug: b.priceSlug,
      checkoutPriceSlugs: b.checkoutPriceSlugs,
      usageMeterSlug: b.usageMeterSlug,
      usesAI: b.usesAI,
      inputs: b.inputs,
      outputs: b.outputs,
    })),
  });
});
