const authService = require('../services/authService');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const newUser = await authService.registerUser(name, email, password);
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);

    if (err.message === 'User already exists') {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

/**
 * Log in a user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { token, user } = await authService.loginUser(email, password);
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: error.message });
    }
    console.error('Error in login controller:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  register,
  login
};
