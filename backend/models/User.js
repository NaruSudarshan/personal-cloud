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
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['root', 'user'],
    default: 'user'
  },
  rootOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  }
}, {
  timestamps: true
});

userSchema.pre('save', function(next) {
  if (this.role === 'root') {
    if (!this.rootOwner) {
      this.rootOwner = this._id;
    }
    if (!this.createdBy) {
      this.createdBy = this._id;
    }
  } else if (!this.rootOwner && this.createdBy) {
    this.rootOwner = this.createdBy;
  }
  next();
});

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
  
//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Method to compare password
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };

// Change to simple string comparison:
userSchema.methods.comparePassword = function(candidatePassword) {
  return this.password === candidatePassword;
};

// Method to check if user is expired
userSchema.methods.isExpired = function() {
  return new Date() > this.expiryTime;
};

// Method to check if user can access (not expired and active)
userSchema.methods.canAccess = function() {
  return this.isActive && !this.isExpired();
};

module.exports = mongoose.model('User', userSchema);

