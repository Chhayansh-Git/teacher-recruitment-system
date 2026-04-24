/**
 * ============================================================
 * FILE: src/controllers/notification.controller.js
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await notificationService.getForUser(req.user.id, parseInt(page), parseInt(limit));
  res.json(ApiResponse.paginated(result.notifications, result.page, result.limit, result.total, { unreadCount: result.unreadCount }));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (ids && ids.length > 0) {
    await notificationService.markAsRead(req.user.id, ids);
  } else {
    await notificationService.markAllAsRead(req.user.id);
  }
  res.json(ApiResponse.success(null, 'Notifications marked as read'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json(ApiResponse.success({ count }));
});

const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.getPreferences(req.user.id);
  res.json(ApiResponse.success(preferences));
});

const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.updatePreferences(req.user.id, req.body);
  res.json(ApiResponse.success(preferences, 'Preferences updated'));
});

module.exports = { 
  getNotifications, 
  markAsRead, 
  getUnreadCount,
  getPreferences,
  updatePreferences
};
