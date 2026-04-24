/**
 * ============================================================
 * FILE: src/routes/message.routes.js — Messaging Route Definitions
 * ============================================================
 */

const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/authenticate');
const { messageLimiter } = require('../middleware/rateLimiter');
const messageController = require('../controllers/message.controller');

// All message routes require authentication (any role)
router.use(authenticate);

// --- Threads ---
router.get('/threads', messageController.getThreads);
router.get('/threads/:id', messageController.getMessages);

// --- Messages ---
router.post('/threads/:id/send', messageLimiter, messageController.sendMessage);
router.put('/threads/:id/read', messageController.markAsRead);

// --- Available Actions (template buttons for frontend) ---
router.get('/actions', messageController.getActions);

module.exports = router;
