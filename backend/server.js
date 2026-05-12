import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/categories.js';
import transactionRoutes from './routes/transactions.js';
import budgetRoutes from './routes/budgets.js';
import reportRoutes from './routes/reports.js';
import currencyRoutes from './routes/currency.js';
import oauthRoutes from './routes/oauth.js';
import passwordResetRoutes from './routes/password-reset.js';
import recurringRoutes from './routes/recurring.js';
import goalsRoutes from './routes/goals.js';
import strategyRoutes from './routes/strategy.js';
import debtsRoutes from './routes/debts.js';
import businessRoutes from './routes/business.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import insightsRoutes from './routes/insights.js';
import setupRoutes from './routes/setup.js';
import forecastRoutes from './routes/forecast.js';
import trendsRoutes from './routes/trends.js';
import familiesRoutes from './routes/families.js';
import familySharedRoutes from './routes/family-shared.js';
import { processRecurringTransactions } from './utils/recurring-processor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, Capacitor, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://aurora-ledger.vercel.app',
      'https://boyaka.app',
      'http://localhost:5173',  // Vite dev
      'http://localhost:4173',  // Vite preview
      'http://localhost:3000',  // CRA
      'http://localhost:8100',  // Capacitor
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 10,
  message: { error: 'Juda ko\'p urinish. 15 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 200,
  message: { error: 'So\'rovlar chegarasi oshdi. Keyinroq urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/password-reset', authLimiter);
app.use('/api/', apiLimiter);

// Initialize Passport
app.use(passport.initialize());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/family', familySharedRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/business', businessRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});


// Setup recurring transactions cron job
// Run every day at 00:05 (5 minutes after midnight)
cron.schedule('5 0 * * *', async () => {
  console.log('⏰ Running scheduled recurring transactions processor...');
  try {
    await processRecurringTransactions();
  } catch (error) {
    console.error('❌ Scheduled recurring processing failed:', error);
  }
});

// Also run on server startup (optional, for immediate processing)
if (process.env.PROCESS_RECURRING_ON_STARTUP === 'true') {
  console.log('🔄 Processing recurring transactions on startup...');
  processRecurringTransactions().catch(err => {
    console.error('❌ Startup recurring processing failed:', err);
  });
}

// Start server with port conflict handling
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || '*'}`);
  console.log(`⏰ Recurring transactions cron job scheduled (daily at 00:05)`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = parseInt(PORT) + 1;
    console.error(`❌ Port ${PORT} is already in use!`);
    console.log(`🔄 Trying port ${nextPort}...`);
    server.close();
    app.listen(nextPort, () => {
      console.log(`🚀 Server running on fallback port ${nextPort}`);
      console.log(`💡 Tip: Kill old process with: Get-Process -Name node | Stop-Process -Force`);
    });
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;


