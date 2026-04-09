const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/chat', chatController.processMessage);
router.post('/system/exec', chatController.executeSystemCommand);
router.get('/session/clear', chatController.clearSession);

module.exports = router;

