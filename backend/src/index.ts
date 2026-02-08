import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { expressRouter } from '@flowglad/server/express';
import { flowglad } from './lib/flowglad.js';
import { runBlockRouter } from './routes/run-block.js';
import { productsRouter } from './routes/products.js';
import { entitlementsRouter } from './routes/entitlements.js';
import { checkoutRouter } from './routes/checkout.js';
import { webhookRouter } from './routes/webhook.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { workflowsRouter } from './routes/workflows.js';

const app = express();
const PORT = process.env.PORT ?? 4000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Log configuration on startup
console.log('=== Backend Configuration ===');
console.log('DEMO_MODE:', DEMO_MODE);
console.log('FLOWGLAD_SECRET_KEY set:', !!process.env.FLOWGLAD_SECRET_KEY);
console.log('FLOWGLAD_SECRET_KEY prefix:', process.env.FLOWGLAD_SECRET_KEY?.substring(0, 10) + '...');
console.log('SUPABASE_URL set:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('============================');

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Global request logger
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.path}`);
  next();
});

// Supabase routes (auth, users, workflows)
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/workflows', workflowsRouter);

// Flowglad: mount at /api/flowglad so frontend useBilling() can talk to it
if (!DEMO_MODE) {
  console.log('[Setup] Mounting Flowglad expressRouter at /api/flowglad');
  app.use(
    '/api/flowglad',
    expressRouter({
      flowglad,
      getCustomerExternalId: async (req) => {
        // Use Supabase user ID as customer external ID
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const { supabase } = await import('./lib/supabase.js');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            console.log(`[Flowglad] CustomerExternalId: ${user.id}`);
            return user.id;
          }
        }
        throw new Error('Unauthorized');
      },
    })
  );
} else {
  console.log('[Setup] Using demo mode - Flowglad stub');
  // In demo mode, return mock responses
  app.use('/api/flowglad', (req, res) => {
    console.log(`[Flowglad/Demo] ${req.method} ${req.url}`);
    res.json({
      billing: {
        customer: { name: 'Demo User', email: 'demo@example.com' },
        subscriptions: [],
        invoices: [],
      },
    });
  });
}

app.use('/api/run-block', runBlockRouter);
app.use('/api/products', productsRouter);
app.use('/api/entitlements', entitlementsRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/webhook', webhookRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

// 404 handler
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
