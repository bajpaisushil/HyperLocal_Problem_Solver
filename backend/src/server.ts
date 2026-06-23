import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { connectDB, usingMemoryDB } from './config/db.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import Society from './models/Society.js';
import { seedData } from './utils/seed.js';

import authRoutes from './routes/auth.js';
import societyRoutes from './routes/society.js';
import complaintRoutes from './routes/complaints.js';
import vendorRoutes from './routes/vendors.js';
import financeRoutes from './routes/finance.js';
import communityRoutes from './routes/community.js';
import visitorRoutes from './routes/visitors.js';
import { assistantRouter, reportRouter, dashboardRouter } from './routes/misc.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/society', societyRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/assistant', assistantRouter);
app.use('/api/report', reportRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((req, res) => res.status(404).json({ message: `Not found: ${req.method} ${req.path}` }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error & { status?: number; name?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (!err.status || err.status >= 500) console.error(err);
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  await connectDB();

  // Auto-seed the ephemeral in-memory DB (or when SEED_ON_START=true) so the
  // demo has data without a manual seed step.
  const shouldSeed = process.env.SEED_ON_START === 'true' || usingMemoryDB;
  if (shouldSeed && (await Society.countDocuments()) === 0) {
    console.log('🌱 Seeding demo data…');
    const summary = await seedData();
    console.log('   Seeded:', summary, '— login committee@demo.com / asha@demo.com (password123)');
  }

  app.listen(PORT, () => console.log(`🚀 NagarFix API on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
