const jwt = require('jsonwebtoken');
const User = require('../models/User');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

// Middleware to verify JWT access token from cookies
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from cookie instead of Authorization header
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify access token
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.canAccess()) {
      return res.status(403).json({ error: 'User account expired or inactive' });
    }

    // Update last login on successful authentication
    user.lastLogin = new Date();
    await user.save();

    // Set user and rootOwnerId in request
    req.user = user;
    req.rootOwnerId = user.rootOwner;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is root
const requireRoot = (req, res, next) => {
  if (!req.user || !req.user.isRootOwner()) {
    return res.status(403).json({ error: 'Root access required' });
  }
  next();
};

// Middleware to verify refresh token from cookies
const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    if (!user.canAccess()) {
      return res.status(403).json({ error: 'User account expired or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
};

// Generate JWT access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
      rootOwner: user.rootOwner
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

// Generate JWT refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

// Set tokens as HTTP-only cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  // Set access token cookie (15 minutes)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true, // Always true for SameSite=None
    sameSite: 'none', // Required for cross-site (Vercel -> Render)
    maxAge: 15 * 60 * 1000
  });

  // Set refresh token cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true, // Always true for SameSite=None
    sameSite: 'none', // Required for cross-site (Vercel -> Render)
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// Clear token cookies
const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

// Optional authentication middleware (continues even if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.canAccess()) {
        req.user = user;
        req.rootOwnerId = user.rootOwner;
      }
    }
    next();
  } catch (error) {
    next(); // Continue without user for optional auth
  }
};

module.exports = {
  authenticateToken,
  requireRoot,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  optionalAuth
};