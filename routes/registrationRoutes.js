const express = require('express');
const router = express.Router();
const { registerForEvent } = require('../controllers/registrationController');
const auth = require('../middleware/auth');

// Protected route: only logged in users can register
router.post('/', auth, registerForEvent);

module.exports = router;
