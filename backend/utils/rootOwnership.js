const mongoose = require('mongoose');

function normalizeToObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (err) {
    return null;
  }
}

function getRootOwnerObjectId(req) {
  if (req?.rootOwnerId) {
    const normalized = normalizeToObjectId(req.rootOwnerId);
    if (normalized) return normalized;
  }
  
  const user = req.user;
  if (!user) return null;
  
  return normalizeToObjectId(user.rootOwner);
}

module.exports = {
  getRootOwnerObjectId,
  normalizeToObjectId
};