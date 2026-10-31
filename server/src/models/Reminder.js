const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remindAt: { type: Date, required: true },
    note: { type: String, default: '', trim: true },
    // The scheduler sets sent=true once it fires so each reminder fires exactly once.
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

reminderSchema.index({ remindAt: 1, sent: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
