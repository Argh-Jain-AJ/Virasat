const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // Graceful handling of the manual frontend demo token bypass
  if (token === 'demo-token') {
    req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'demo@demo.com' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = {
  verifyToken
};
