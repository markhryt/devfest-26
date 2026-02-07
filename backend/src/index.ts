import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { expressRouter } from '@flowglad/server/express';
import { flowglad } from './lib/flowglad.js';
import { getCustomerExternalId } from './lib/auth.js';
import { runBlockRouter } from './routes/run-block.js';
import { productsRouter } from './routes/products.js';
import { entitlementsRouter } from './routes/entitlements.js';
import { checkoutRouter } from './routes/checkout.js';
import { webhookRouter } from './routes/webhook.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Flowglad: mount at /api/flowglad so frontend useBilling() can talk to it
app.use(
  '/api/flowglad',
  expressRouter({
    flowglad,
    getCustomerExternalId,
  })
);

app.use('/api/run-block', runBlockRouter);
app.use('/api/products', productsRouter);
app.use('/api/entitlements', entitlementsRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/webhook', webhookRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
