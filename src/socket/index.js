/**
 * ============================================================
 * FILE: src/socket/index.js — Socket.io Real-Time Server
 * ============================================================
 *
 * This is a SEPARATE WebSocket server from the REST API.
 * It handles:
 *   - Real-time chat message delivery
 *   - Typing indicators
 *   - Online presence
 *   - Push notifications
 *
 * WHY SEPARATE?
 *   WebSocket connections are long-lived (minutes to hours).
 *   REST connections are short-lived (milliseconds).
 *   Mixing them means a message spike could slow down API responses.
 *   Separating them ensures each can scale independently.
 *
 * HOW IT CONNECTS:
 *   The Socket.io server attaches to the same HTTP server as Express.
 *   Frontend connects via: io('http://localhost:5000', { auth: { token } })
 * ============================================================
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

// In-memory map: userId → Set of socketIds (one user can have multiple tabs)
const onlineUsers = new Map();

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.cors?.origin || 'http://localhost:3000',
      credentials: true,
    },
    // Reduce overhead for Indian networks (often high latency)
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  /**
   * MIDDLEWARE: Authenticate every WebSocket connection.
   * The client sends the JWT in io({ auth: { token } }).
   * We verify it before allowing the connection.
   */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  /**
   * CONNECTION: Fires when a client connects.
   */
  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.debug(`Socket connected: ${userId} (${socket.id})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast that this user is online
    io.emit('user:online', { userId });

    // ---- CHAT EVENTS ----

    /**
     * join:thread — Client joins a chat room (thread).
     * This lets us send messages only to users in that thread.
     */
    socket.on('join:thread', (threadId) => {
      socket.join(`thread:${threadId}`);
      logger.debug(`User ${userId} joined thread:${threadId}`);
    });

    /**
     * leave:thread — Client leaves a chat room.
     */
    socket.on('leave:thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
    });

    /**
     * message:send — When a message is sent via REST API,
     * the controller calls emitToThread() to push it here.
     * This event is for client-side notifications, not delivery.
     */
    socket.on('typing:start', ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit('typing:start', { userId, threadId });
    });

    socket.on('typing:stop', ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit('typing:stop', { userId, threadId });
    });

    // ---- DISCONNECT ----

    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user:offline', { userId });
        }
      }
      logger.debug(`Socket disconnected: ${userId} (${socket.id})`);
    });
  });

  return io;
}

/**
 * emitToThread — Send a message to all users in a thread room.
 * Called by the message controller after saving to DB.
 */
function emitToThread(io, threadId, event, data) {
  io.to(`thread:${threadId}`).emit(event, data);
}

/**
 * emitToUser — Send a notification to a specific user.
 * Looks up all their socket connections (multiple tabs).
 */
function emitToUser(io, userId, event, data) {
  const userSockets = onlineUsers.get(userId);
  if (userSockets) {
    for (const socketId of userSockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

/**
 * isUserOnline — Check if a user has any active connections.
 */
function isUserOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
}

module.exports = {
  initializeSocket,
  emitToThread,
  emitToUser,
  isUserOnline,
};
