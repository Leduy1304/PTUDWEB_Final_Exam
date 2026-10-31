const cron = require('node-cron');
const Reminder = require('../models/Reminder');

/**
 * Reminder engine. Every minute it finds due reminders
 * (remindAt <= now, not yet sent), marks them sent, and logs them.
 *
 * NOTE: no external notification provider is wired by default — reminders are
 * logged to the console here. To send real notifications (email via nodemailer/
 * SendGrid, push via Firebase Cloud Messaging, Slack webhook, ...), replace
 * the console.log below with your provider call. Keep the `sent = true` update
 * so each reminder fires exactly once.
 */
function startReminderJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const due = await Reminder.find({ sent: false, remindAt: { $lte: now } })
        .populate('task', 'title dueDate')
        .populate('owner', 'name email');

      for (const r of due) {
        console.log(
          `⏰ REMINDER for ${r.owner ? r.owner.email : 'unknown user'}: ` +
          `"${r.task ? r.task.title : '(deleted task)'}"` +
          (r.note ? ` — ${r.note}` : '') +
          ` (remindAt=${r.remindAt.toISOString()})`
        );
        r.sent = true;
        r.sentAt = now;
        await r.save();
      }
      if (due.length > 0) console.log(`✔ Processed ${due.length} reminder(s).`);
    } catch (err) {
      console.error('Reminder job failed:', err.message);
    }
  });
  console.log('⏱️  Reminder scheduler started (checks every minute).');
}

module.exports = startReminderJob;
