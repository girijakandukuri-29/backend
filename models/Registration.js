const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'checked-in'],
    default: 'confirmed'
  },
  pdfUrl: {
    type: String, // will hold link to ticket PDF file
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Registration', RegistrationSchema);
