const Event = require('../models/Event');

// Create new event (Admin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, startAt, endAt, capacity, organizer } = req.body;

    if (!title || !startAt || !endAt || capacity == null) {
      return res.status(400).json({ msg: 'Missing required fields: title, startAt, endAt, capacity' });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ msg: 'Invalid dates provided' });
    }
    if (end <= start) {
      return res.status(400).json({ msg: 'endAt must be after startAt' });
    }
    const capacityNum = Number(capacity);
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      return res.status(400).json({ msg: 'capacity must be a positive number' });
    }

    const event = await Event.create({
      title,
      description,
      location,
      startAt: start,
      endAt: end,
      capacity: capacityNum,
      organizer
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ startAt: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Get single event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Update event (Admin only)
exports.updateEvent = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.startAt) {
      const d = new Date(update.startAt);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ msg: 'Invalid startAt' });
      update.startAt = d;
    }
    if (update.endAt) {
      const d = new Date(update.endAt);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ msg: 'Invalid endAt' });
      update.endAt = d;
    }
    if (update.capacity != null) {
      const c = Number(update.capacity);
      if (!Number.isFinite(c) || c <= 0) return res.status(400).json({ msg: 'capacity must be positive' });
      update.capacity = c;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Delete event (Admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ msg: 'Event not found' });
    res.json({ msg: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
