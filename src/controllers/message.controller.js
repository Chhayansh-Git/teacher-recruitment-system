/**
 * ============================================================
 * FILE: src/controllers/message.controller.js — Message Route Handlers
 * ============================================================
 *
 * Updated to use template-based messaging instead of free text.
 * The sendMessage handler now expects templateCode + optional metadata
 * instead of arbitrary content.
 * ============================================================
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messageService = require('../services/message.service');

/** GET /api/v1/messages/threads — List all threads for current user */
const getThreads = asyncHandler(async (req, res) => {
  const threads = await messageService.getThreads(req.user.id, req.user.role);
  res.json(ApiResponse.success(threads));
});

/** GET /api/v1/messages/threads/:id — Get messages in a thread */
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const result = await messageService.getMessages(
    req.params.id,
    req.user.id,
    req.user.role,
    parseInt(page, 10),
    parseInt(limit, 10)
  );
  res.json(ApiResponse.paginated(result.messages, result.page, result.limit, result.total));
});

/**
 * POST /api/v1/messages/threads/:id/send — Send a template message.
 *
 * Request body:
 *   { templateCode: "INTERVIEW_SCHEDULED", metadata: { date: "2026-05-01" } }
 *
 * NOT:
 *   { content: "Hey, call me at 9876543210" }  ← This is blocked
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { templateCode, metadata } = req.body;

  if (!templateCode) {
    return res.status(400).json(ApiResponse.error(
      'templateCode is required. Free-text messages are not allowed on this platform.',
      400
    ));
  }

  const message = await messageService.sendTemplateMessage(
    req.params.id,
    req.user.id,
    req.user.role,
    templateCode,
    metadata || {}
  );
  res.status(201).json(ApiResponse.success(message, 'Action sent'));
});

/** PUT /api/v1/messages/threads/:id/read — Mark messages as read */
const markAsRead = asyncHandler(async (req, res) => {
  await messageService.markAsRead(req.params.id, req.user.id);
  res.json(ApiResponse.success(null, 'Messages marked as read'));
});

/**
 * GET /api/v1/messages/actions — Get available template actions for current role.
 * Frontend uses this to render the action buttons.
 */
const getActions = asyncHandler(async (req, res) => {
  const actions = messageService.getAvailableActions(req.user.role);
  res.json(ApiResponse.success(actions));
});

module.exports = { getThreads, getMessages, sendMessage, markAsRead, getActions };
