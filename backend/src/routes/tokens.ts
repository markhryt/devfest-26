import { Router } from 'express';
import { getCustomerExternalId } from '../lib/auth.js';
import { getTokenBalance, getUserTokenData, creditTokens } from '../store/tokenStore.js';
import { getTokenProductByPriceSlug, TOKEN_PACKS, TOKEN_SUBSCRIPTIONS } from 'shared';
import { flowglad } from '../lib/flowglad.js';

export const tokensRouter = Router();

const DEMO_MODE = process.env.DEMO_MODE === 'true';

// GET /api/tokens - Get user's token balance
tokensRouter.get('/', async (req, res) => {
    try {
        const userId = await getCustomerExternalId(req);
        const data = getUserTokenData(userId);

        res.json({
            balance: data.balance,
            subscription: data.subscriptionId ? {
                interval: data.subscriptionInterval,
                lastRefresh: data.lastRefresh,
            } : null,
        });
    } catch (e) {
        console.error('tokens error', e);
        res.status(500).json({ error: 'Failed to get token balance' });
    }
});

// GET /api/tokens/products - Get available token packs and subscriptions
tokensRouter.get('/products', async (_req, res) => {
    res.json({
        packs: TOKEN_PACKS,
        subscriptions: TOKEN_SUBSCRIPTIONS,
    });
});

// POST /api/tokens/purchase - Create checkout for token pack or subscription
tokensRouter.post('/purchase', async (req, res) => {
    try {
        const userId = await getCustomerExternalId(req);
        const { priceSlug, successUrl, cancelUrl } = req.body as {
            priceSlug: string;
            successUrl: string;
            cancelUrl: string;
        };

        if (!priceSlug || !successUrl || !cancelUrl) {
            return res.status(400).json({ error: 'priceSlug, successUrl, cancelUrl required' });
        }

        // Verify this is a valid token product
        const product = getTokenProductByPriceSlug(priceSlug);
        if (!product) {
            return res.status(400).json({ error: 'Invalid token product' });
        }

        if (DEMO_MODE) {
            // In demo mode, credit tokens directly without checkout
            const tokens = product.type === 'one_time' ? product.tokens : product.tokensPerPeriod;
            creditTokens(userId, tokens, `demo purchase: ${priceSlug}`);
            return res.json({
                demoMode: true,
                tokensAdded: tokens,
                newBalance: getUserTokenData(userId).balance,
            });
        }

        // Create Flowglad checkout
        const fgClient = flowglad(userId);
        await fgClient.findOrCreateCustomer();
        const result = await fgClient.createCheckoutSession({
            priceSlug,
            successUrl,
            cancelUrl,
        });

        res.json(result);
    } catch (e) {
        console.error('token purchase error', e);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// POST /api/tokens/credit - Manually credit tokens (for testing/admin)
tokensRouter.post('/credit', async (req, res) => {
    try {
        const userId = await getCustomerExternalId(req);
        const { amount, reason } = req.body as { amount: number; reason?: string };

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'amount must be a positive number' });
        }

        const result = creditTokens(userId, amount, reason ?? 'manual');
        res.json({ success: true, newBalance: result.newBalance });
    } catch (e) {
        console.error('token credit error', e);
        res.status(500).json({ error: 'Failed to credit tokens' });
    }
});
