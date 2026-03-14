require('dotenv').config();
const express = require('express');
const cors = require('cors');


// Import database pool
const pool = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const personRoutes = require('./routes/personRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const memoryRoutes = require('./routes/memoryRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/memories', memoryRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('Family Tree API running');
});

// Port configuration
const PORT = process.env.PORT || 5001;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
