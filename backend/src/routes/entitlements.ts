import { Router } from 'express';
import { flowglad } from '../lib/flowglad.js';
import { getCustomerExternalId } from '../lib/auth.js';
import { BLOCK_DEFINITIONS } from 'shared';

export const entitlementsRouter = Router();

entitlementsRouter.get('/', async (req, res) => {
  try {
    const userId = await getCustomerExternalId(req);
    const billing = await flowglad(userId).getBilling();
    const access: Record<string, boolean> = {};
    for (const block of BLOCK_DEFINITIONS) {
      const byFeature = billing.checkFeatureAccess(block.featureSlug);
      const byProduct =
        'hasPurchased' in billing && typeof billing.hasPurchased === 'function'
          ? billing.hasPurchased(block.featureSlug)
          : false;
      access[block.featureSlug] = byFeature || byProduct;
    }
    res.json({ entitlements: access, billing: { subscriptions: billing.subscriptions } });
  } catch (e) {
    console.error('entitlements error', e);
    res.status(500).json({ error: 'Failed to load entitlements' });
  }
});
