/**
 * ============================================================
 * FILE: src/routes/notification.routes.js
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const notificationController = require('../controllers/notification.controller');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.put('/read', notificationController.markAsRead);
router.get('/unread-count', notificationController.getUnreadCount);

router.get('/preferences', notificationController.getPreferences);
router.put('/preferences', notificationController.updatePreferences);

module.exports = router;
