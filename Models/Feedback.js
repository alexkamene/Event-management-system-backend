const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Events', required: true },
  feedback: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
