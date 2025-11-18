const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: { 
    type: String,
    required: false,
    trim: true
  },
  role: {
    type: String,
    enum: ['root', 'user'],
    default: 'user',
    required: true
  },
  rootOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure rootOwner & display name are set before validation
userSchema.pre('validate', function(next) {
  if (!this.name && this.username) {
    this.name = this.username;
  }

  if (this.role === 'root' && !this.rootOwner) {
    this.rootOwner = this._id;
  }
  next();
});

// Auto-set rootOwner for root users and hash password
userSchema.pre('save', async function(next) {
  if (this.role === 'root') {
    this.rootOwner = this._id;
  }

  // Hash password if it's modified or new
  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err);
    }
  }

  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is expired
userSchema.methods.isExpired = function() {
  return new Date() > this.expiryTime;
};

// Method to check if user can access (not expired and active)
userSchema.methods.canAccess = function() {
  return this.isActive && !this.isExpired();
};

// Check if user is root owner
userSchema.methods.isRootOwner = function() {
  return this.role === 'root' && this._id.equals(this.rootOwner);
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  });
};

// Static method to find users by root owner (for admin user management)
userSchema.statics.findByRootOwner = function(rootOwnerId) {
  return this.find({ rootOwner: rootOwnerId });
};

module.exports = mongoose.model('User', userSchema);