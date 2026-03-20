require('dotenv').config();
const express = require('express');
const cors = require('cors');
const yaml = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');


// Import database pool
const pool = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Initialize Cron Jobs
require('./cron/reminderCron');
const errorHandler = require('./middleware/errorHandler');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/gedcom', gedcomRoutes);
app.use('/api/family-tree', familyTreeRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Family Tree API running');
});

// Error Handling Middleware (must be registered after all routes)
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5001;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
