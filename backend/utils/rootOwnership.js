const mongoose = require('mongoose');
const User = require('../models/User');
const File = require('../models/File');

function normalizeToObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (err) {
    return null;
  }
}

async function ensureRootOwnerForGroup(rootOwnerId) {
  const ownerObjectId = normalizeToObjectId(rootOwnerId);
  if (!ownerObjectId) return;

  const usersInGroup = await User.find({
    $or: [{ _id: ownerObjectId }, { rootOwner: ownerObjectId }]
  }).select('username');

  const usernames = usersInGroup.map(u => u.username);
  if (!usernames.length) return;

  await File.updateMany(
    { $and: [
      { uploadedBy: { $in: usernames } },
      { $or: [
        { rootOwner: { $exists: false } },
        { rootOwner: null }
      ] }
    ] },
    { $set: { rootOwner: ownerObjectId } }
  );
}

function getRootOwnerObjectId(req) {
  if (req?.rootOwnerId) {
    const normalized = normalizeToObjectId(req.rootOwnerId);
    if (normalized) return normalized;
  }
  const user = req.user;
  if (!user) return null;
  if (user.role === 'root') {
    return normalizeToObjectId(user._id);
  }
  return normalizeToObjectId(user.rootOwner || user.createdBy);
}

module.exports = {
  ensureRootOwnerForGroup,
  getRootOwnerObjectId,
  normalizeToObjectId
};
