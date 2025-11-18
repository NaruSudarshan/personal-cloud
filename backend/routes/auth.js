const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireRoot, 
  generateAccessToken, 
  generateRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  verifyRefreshToken
} = require('../middleware/auth');

const router = express.Router();

// Signup route - creates root user
router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, name } = req.body;

    if (!email || !username || !password || !name) {
      return res.status(400).json({ error: 'Email, username, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Set expiry time (1 year from now for root users)
    const expiryTime = new Date();
    expiryTime.setFullYear(expiryTime.getFullYear() + 1);

    // Create root user
    const user = new User({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password,
      name,
      role: 'root',
      expiryTime,
      isActive: true
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        expiryTime: user.expiryTime
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.canAccess()) {
      return res.status(403).json({ error: 'Account expired or inactive' });
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        rootOwner: user.rootOwner,
        expiryTime: user.expiryTime,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Refresh token route
router.post('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    const newAccessToken = generateAccessToken(req.user);
    const newRefreshToken = generateRefreshToken(req.user);

    // Update refresh token in database
    req.user.refreshToken = newRefreshToken;
    await req.user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);
    res.json({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    clearTokenCookies(res);
    res.status(500).json({ error: 'Internal server error during token refresh' });
  }
});

// Logout route
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token from database
    req.user.refreshToken = null;
    await req.user.save();

    // Clear cookies
    clearTokenCookies(res);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        rootOwner: req.user.rootOwner,
        expiryTime: req.user.expiryTime,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (root only)
router.get('/users', authenticateToken, requireRoot, async (req, res) => {
  try {
    const users = await User.findByRootOwner(req.user.rootOwner)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (root only)
router.post('/users', authenticateToken, requireRoot, async (req, res) => {
  try {
    // Accept either an explicit expiryTime (ISO string) or an expiryDays number
    const { username, name, expiryDays = 30, expiryTime } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const generatePassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const password = generatePassword();

    // Calculate expiry time: prefer explicit expiryTime (ISO) from client, else use expiryDays
    let computedExpiry;
    if (expiryTime) {
      const parsed = new Date(expiryTime);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid expiryTime format' });
      }
      computedExpiry = parsed;
    } else {
      computedExpiry = new Date();
      computedExpiry.setDate(computedExpiry.getDate() + parseInt(expiryDays));
    }

    const newUser = new User({
      username: username.toLowerCase(),
      password,
      name: name && name.trim() ? name : username,
      email: `${username}@temp.local`, // Temporary email
      role: 'user',
      rootOwner: req.user.rootOwner,
      expiryTime: computedExpiry,
      isActive: true
    });

    await newUser.save();

    // Return user with password (only this time for root to see)
    const userResponse = {
      id: newUser._id,
      _id: newUser._id,
      username: newUser.username,
      password: password, // Only returned once
      name: newUser.name,
      role: newUser.role,
      expiryTime: newUser.expiryTime,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (root only)
router.delete('/users/:userId', authenticateToken, requireRoot, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findOne({ 
      _id: userId, 
      rootOwner: req.user.rootOwner 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'root') {
      return res.status(403).json({ error: 'Cannot delete root user' });
    }

    await User.deleteOne({ 
      _id: userId, 
      rootOwner: req.user.rootOwner 
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (root only)
router.put('/users/:userId', authenticateToken, requireRoot, async (req, res) => {
  try {
    const { userId } = req.params;
    const { expiryTime, isActive, name } = req.body;

    const user = await User.findOne({ 
      _id: userId, 
      rootOwner: req.user.rootOwner 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'root') {
      return res.status(403).json({ error: 'Cannot modify root user' });
    }

    const updateData = {};
    if (expiryTime) updateData.expiryTime = new Date(expiryTime);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (name) updateData.name = name;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, rootOwner: req.user.rootOwner },
      updateData,
      { new: true }
    ).select('-password -refreshToken');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;