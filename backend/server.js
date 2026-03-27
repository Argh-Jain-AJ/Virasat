require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yaml = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');


// Import database pool
const pool = require('./config/db');

const app = express();

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin images
app.use(mongoSanitize()); // Prevent NoSQL injection patterns if applicable

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 auth requests per window
  message: { message: 'Too many authentication attempts, please try again later' }
});

// Middleware
app.use(cors());
app.use(express.json());
// Serve uploaded files (photos etc.) publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Setup
const swaggerDocument = yaml.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
