import { Router } from 'express';
import { flowglad } from '../lib/flowglad.js';
import { getCustomerExternalId, requireAuth } from '../lib/auth.js';
import { BLOCK_DEFINITIONS } from 'shared';
import { getDemoEntitlements } from './checkout.js';

export const entitlementsRouter = Router();

const DEMO_MODE = process.env.DEMO_MODE === 'true';

entitlementsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const userId = await getCustomerExternalId(req);
    const access: Record<string, boolean> = {};

    if (DEMO_MODE) {
      // In demo mode, check our in-memory demo entitlements store.
      // Free blocks (featureSlug === 'free') are always accessible.
      const userEntitlements = getDemoEntitlements(userId);
      for (const block of BLOCK_DEFINITIONS) {
        access[block.featureSlug] = block.featureSlug === 'free' || userEntitlements.has(block.featureSlug);
      }
      console.log(
        `[Entitlements/Demo] User ${userId} has access to:`,
        Object.entries(access)
          .filter(([, v]) => v)
          .map(([k]) => k)
      );
      return res.json({ entitlements: access, billing: { subscriptions: [] } });
    }

    // Real Flowglad billing check
    const billing = await flowglad(userId).getBilling();
    for (const block of BLOCK_DEFINITIONS) {
      access[block.featureSlug] = billing.checkFeatureAccess(block.featureSlug);
    }
    res.json({ entitlements: access, billing: { subscriptions: billing.subscriptions } });
  } catch (e) {
    console.error('entitlements error', e);
    res.status(500).json({ error: 'Failed to load entitlements' });
  }
});
