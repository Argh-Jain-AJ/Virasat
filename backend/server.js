require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const xssClean = require('xss-clean');

// Import database pool
const pool = require('./config/db');

const app = express();

// ── 1. Security headers via Helmet ────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'blob:', '*'],
      connectSrc: ["'self'"],
      frameSrc:   ["'none'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,           // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true,
}));

// Trust proxy (Vercel, Railway, nginx) so rate-limiter sees real IPs
app.set('trust proxy', 1);

// ── 2. CORS — whitelist only the frontend origin ──────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
).split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── 3. Body size limit + input sanitization ───────────────────
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());   // Strip $ and . from keys (NoSQL-injection pattern)
app.use(xssClean());        // Strip HTML/script tags from req.body/query/params

// ── 4. Serve uploaded files ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 5. Rate limiters ─────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again in 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,  // ← tightened from 25
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later' }
});

// ── 6. Swagger UI (dev only) ──────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const yaml = require('yamljs');
  const swaggerUi = require('swagger-ui-express');
  const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// Import Routes
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const personRoutes = require('./routes/personRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const aiRoutes = require('./routes/aiRoutes');
const gedcomRoutes = require('./routes/gedcomRoutes');
const familyTreeRoutes = require('./routes/familyTreeRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

const legacyRoutes = require('./routes/legacyRoutes');

// Initialize Cron Jobs
require('./cron/reminderCron');
const errorHandler = require('./middleware/errorHandler');

// Mount Routes
app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gedcom', gedcomRoutes);
app.use('/api/family-tree', familyTreeRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/legacy', legacyRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Family Tree API running');
});

// Error Handling Middleware (must be registered after all routes)
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5001;

// Start server defaults to local, exported for serverless
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
