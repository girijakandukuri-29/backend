const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

const auth = require('../middleware/auth');

// Public: list events & view details
router.get('/', getEvents);
router.get('/:id', getEventById);

// Admin only: create, update, delete event
router.post('/', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
  next();
}, createEvent);

router.put('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
  next();
}, updateEvent);

router.delete('/:id', auth, (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Forbidden' });
  next();
}, deleteEvent);

module.exports = router;
