const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Organization / company the user belongs to (team/enterprise feature).
    organization: { type: String, default: '', trim: true },
    // Access level: "user" (default) or "admin" (system administrator).
    // Only settable server-side: via startup auto-promotion, the ADMIN_EMAIL
    // env var at registration, or by another admin through /api/admin.
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

module.exports = mongoose.model('User', userSchema);
