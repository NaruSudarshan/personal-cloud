const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireRoot, generateToken } = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.canAccess()) {
      return res.status(403).json({ error: 'Account expired or inactive' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        expiryTime: user.expiryTime,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.role,
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
    const rootOwnerId = req.user.rootOwner || req.user._id;
    const users = await User.find({
      role: { $ne: 'root' },
      rootOwner: rootOwnerId
    }) // Exclude root users
      .select('username password role expiryTime isActive createdAt')
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
    const { username, expiryTime } = req.body;

    if (!username || !expiryTime) {
      return res.status(400).json({ error: 'Username and expiry time are required' });
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

    const newUser = new User({
      username: username.toLowerCase(),
      password,
      role: 'user',
      expiryTime: new Date(expiryTime),
      isActive: true,
      createdBy: req.user._id,
      rootOwner: req.user.rootOwner || req.user._id
    });

    await newUser.save();

    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      password: password,
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

  const rootOwnerId = req.user.rootOwner || req.user._id;
  const user = await User.findOne({ _id: userId, rootOwner: rootOwnerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'root') {
      return res.status(403).json({ error: 'Cannot delete root user' });
    }

  await User.deleteOne({ _id: userId, rootOwner: rootOwnerId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (root only)
router.put('/users/:userId', authenticateToken, requireRoot, async (req, res) => {
  try {
    const { userId } = req.params;
    const { expiryTime, isActive } = req.body;

  const rootOwnerId = req.user.rootOwner || req.user._id;
  const user = await User.findOne({ _id: userId, rootOwner: rootOwnerId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'root') {
      return res.status(403).json({ error: 'Cannot modify root user' });
    }

    const updateData = {};
    if (expiryTime) updateData.expiryTime = new Date(expiryTime);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, rootOwner: rootOwnerId },
      updateData,
      { new: true }
    );

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