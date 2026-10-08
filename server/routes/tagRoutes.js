const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { requireAuth } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/', tagController.getTags);

module.exports = router;
