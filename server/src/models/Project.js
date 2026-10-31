const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Members besides the owner (owner is always an implicit member).
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    color: { type: String, default: '#4f46e5' },
  },
  { timestamps: true }
);

/**
 * True when the given user id is the owner or a listed member.
 * Works whether owner/members are ObjectIds or populated documents.
 */
projectSchema.methods.isMember = function (userId) {
  const id = userId.toString();
  const ownerId =
    this.owner && this.owner._id ? this.owner._id.toString() : this.owner.toString();
  const memberIds = this.members.map((m) =>
    m && m._id ? m._id.toString() : m.toString()
  );
  return ownerId === id || memberIds.includes(id);
};

module.exports = mongoose.model('Project', projectSchema);
