import { Router } from 'express';
import { flowglad } from '../lib/flowglad.js';
import { getCustomerExternalId, requireAuth } from '../lib/auth.js';
import { getBlockById, type BlockId } from 'shared';
import { runBlock } from '../services/run-block.js';
import { deductTokens, getTokenBalance } from '../store/tokenStore.js';
import { getDemoEntitlements } from './checkout.js';

const DEMO_MODE = process.env.DEMO_MODE === 'true';

export const runBlockRouter = Router();

runBlockRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { blockId, inputs } = req.body as { blockId: BlockId; inputs: Record<string, string | string[]> };

    if (!blockId || inputs === undefined) {
      return res.status(400).json({ error: 'blockId and inputs required' });
    }

    const block = getBlockById(blockId);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const userId = await getCustomerExternalId(req);

    // Check tokens (skip for free blocks with tokenCost 0)
    if (block.tokenCost > 0) {
      const balance = getTokenBalance(userId);
      if (balance < block.tokenCost) {
        return res.status(402).json({
          error: 'Insufficient tokens',
          message: `This block requires ${block.tokenCost} token(s). You have ${balance}.`,
          tokenCost: block.tokenCost,
          currentBalance: balance,
          needsPurchase: true,
        });
      }
    }

    // Feature access check 
    if (block.featureSlug !== 'free') {
      let hasAccess = false;

      if (DEMO_MODE) {
        // In demo mode, check our in-memory demo entitlements
        const userEntitlements = getDemoEntitlements(userId);
        hasAccess = userEntitlements.has(block.featureSlug);
        console.log(`[RunBlock/Demo] User ${userId} access to ${block.featureSlug}: ${hasAccess}`);
      } else {
        // Real Flowglad billing check
        const billing = await flowglad(userId).getBilling();
        hasAccess = billing.checkFeatureAccess(block.featureSlug);
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Block locked',
          message: 'Purchase or subscribe to unlock this block',
          priceSlug: block.priceSlug,
          featureSlug: block.featureSlug,
        });
      }
    }

    // Deduct tokens before running
    if (block.tokenCost > 0) {
      const result = deductTokens(userId, block.tokenCost);
      if (!result.success) {
        return res.status(402).json({
          error: 'Insufficient tokens',
          message: result.error,
          needsPurchase: true,
        });
      }
      console.log(`[Tokens] Deducted ${block.tokenCost} token(s) from ${userId}. New balance: ${result.newBalance}`);
    }

    // Run the block
    const result = await runBlock(blockId, inputs ?? {});

    // Log usage for Flowglad meters (if applicable)
    if (!DEMO_MODE && block.usageMeterSlug) {
      const billing = await flowglad(userId).getBilling();
      const subs = billing.subscriptions?.filter((s) => s.status === 'active') ?? [];
      const subId = subs[0]?.id;
      if (subId) {
        await flowglad(userId).createUsageEvent({
          amount: 1,
          usageMeterSlug: block.usageMeterSlug,
          subscriptionId: subId,
          transactionId: `run-${blockId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        });
      }
    }

    const newBalance = getTokenBalance(userId);
    return res.json({
      success: true,
      outputs: result,
      tokensUsed: block.tokenCost,
      tokensRemaining: newBalance,
    });
  } catch (e) {
    console.error('run-block error', e);
    return res.status(500).json({ error: 'Failed to run block' });
  }
});
