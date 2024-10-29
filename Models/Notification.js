// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to the user
  message: { type: String },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, // Reference to the event
  read: { type: Boolean, default: false }, // Track if the notification is read
  createdAt: { type: Date, default: Date.now }, // Timestamp for the notification
},timestamp = true);



const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
