/**
 * ============================================================
 * FILE: src/app.js — Main Application Entry Point
 * ============================================================
 *
 * WHAT: This is the "main" file — the starting point of the entire
 *       backend server. When you run "npm run dev", THIS file runs.
 *
 * WHAT IT DOES:
 *       1. Creates an Express application (the web server)
 *       2. Attaches middleware (security, parsing, logging)
 *       3. Connects routes (which URLs go to which code)
 *       4. Connects to the database
 *       5. Starts listening for HTTP requests
 *
 * WHAT IS EXPRESS?
 *       Express is a "web framework" for Node.js. Node.js can handle
 *       HTTP requests by itself, but Express makes it 10x easier:
 *       - Routing (GET /users, POST /login)
 *       - Middleware (run code BEFORE route handlers)
 *       - Error handling (centralized error management)
 *       - Request parsing (reading JSON from request bodies)
 *
 * WHAT IS MIDDLEWARE?
 *       Middleware is a function that runs BETWEEN receiving a request
 *       and sending a response. Think of it like airport security:
 *
 *       Request arrives
 *         → Security check (helmet)
 *         → Passport check (authenticate)
 *         → Board correct flight (router)
 *         → Response sent back
 *
 *       Each middleware can:
 *       - Modify the request (add data to req object)
 *       - End the request early (send a 403 response)
 *       - Pass to the next middleware (call next())
 *
 * ORDER MATTERS!
 *       Middleware runs in the ORDER you add it:
 *       1. helmet → 2. cors → 3. bodyParser → 4. routes → 5. errorHandler
 *       If you put the errorHandler first, it would never catch route errors
 *       because routes haven't run yet!
 * ============================================================
 */

// --- Step 1: Import Dependencies ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Our own files:
const config = require('./config');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Route files:
const authRoutes = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const candidateRoutes = require('./routes/candidate.routes');
const adminRoutes = require('./routes/admin.routes');
const messageRoutes = require('./routes/message.routes');
const paymentRoutes = require('./routes/payment.routes');
const notificationRoutes = require('./routes/notification.routes');
const interviewRoutes = require('./routes/interview.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const fileRoutes = require('./routes/file.routes');

// Socket.io real-time server:
const { initializeSocket } = require('./socket');
const http = require('http');

// --- Step 2: Create the Express Application ---
const app = express();
// "app" is now our web server. We'll configure it below.

// --- Step 3: Apply Global Middleware ---
// These run on EVERY request, in this order.

/**
 * HELMET — Sets various HTTP security headers.
 *
 * WHY: Browsers have security features that are OFF by default.
 * Helmet turns them ON by setting headers like:
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - X-Content-Type-Options: nosniff (prevents MIME sniffing)
 * - Strict-Transport-Security (forces HTTPS)
 *
 * Think of it as putting a helmet on your server — basic protection.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.s3.amazonaws.com"],
      mediaSrc: ["'self'"],
      connectSrc: ["'self'", "wss://*", "https://api.razorpay.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));

/**
 * CORS — Cross-Origin Resource Sharing.
 *
 * WHY: By default, browsers BLOCK requests from one domain to another.
 * Your frontend runs on localhost:3000 (Next.js) but the backend runs
 * on localhost:5000 (Express). Without CORS, the browser would block
 * all requests from the frontend to the backend.
 *
 * "origin: config.frontendUrl" = only allow requests from OUR frontend.
 * "credentials: true" = allow cookies to be sent (needed for auth).
 */
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

/**
 * MORGAN — HTTP request logger.
 *
 * Logs every incoming request to the console:
 * "GET /api/v1/schools/profile 200 12ms"
 *
 * "dev" format shows: method, URL, status code, response time.
 * Useful for debugging — you can see every request hitting your server.
 */
app.use(morgan('dev'));

/**
 * BODY PARSERS — Read data from request bodies.
 *
 * When the frontend sends data (like login credentials), it comes in
 * the request body as JSON: { "email": "test@test.com", "password": "abc" }
 *
 * express.json() parses this JSON and puts it in req.body.
 * Without it, req.body would be undefined.
 *
 * "limit: '10mb'" = reject requests larger than 10MB (prevents abuse).
 */
app.use(express.json({ limit: '10mb' }));

/**
 * URL-ENCODED PARSER — For form submissions.
 *
 * Some requests send data as URL-encoded strings (like HTML forms):
 * "email=test%40test.com&password=abc"
 *
 * This parser converts those into a JavaScript object.
 * "extended: true" allows nested objects.
 */
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * COOKIE PARSER — Read cookies from requests.
 *
 * JWT tokens are stored in httpOnly cookies (safer than localStorage).
 * This middleware reads those cookies and puts them in req.cookies.
 *
 * Example: req.cookies.accessToken → "eyJhbGciOiJIUzI1NiIs..."
 */
app.use(cookieParser());

/**
 * CSRF PROTECTION
 * Prevents Cross-Site Request Forgery using Double Submit Cookie pattern.
 */
const { csrfProtection } = require('./middleware/csrf');
app.use(csrfProtection);

// --- Step 4: Health Check Endpoints ---
// These are simple endpoints that monitoring tools use to check
// if the server is alive and its dependencies are working.

/**
 * GET /health — Basic health check.
 * Returns 200 if the server process is running.
 * Used by load balancers to know "this server is alive."
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Step 5: API Routes ---
// Each route file handles a group of related endpoints.
// The first argument is the URL prefix. So if authRoutes defines
// a POST /register, the full URL becomes POST /api/v1/auth/register.

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/files', fileRoutes);

// --- Step 6: 404 Handler ---
// If no route matched the request, we end up here.
// This MUST be after all route definitions.
const ApiError = require('./utils/ApiError');
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
});

// --- Step 7: Global Error Handler ---
// This catches ALL errors (thrown from routes, middleware, etc.)
// and sends a clean JSON response. MUST be the LAST middleware.
app.use(errorHandler);

// --- Step 8: Start the Server ---
/**
 * The "main" function — connects to the database, then starts listening.
 *
 * WHY async? connectDatabase() is async (it takes time to connect).
 * We use await to wait for it to finish before starting the server.
 * If the database is down, we want to know BEFORE accepting requests.
 */
async function startServer() {
  try {
    // Connect to PostgreSQL via Prisma
    await connectDatabase();

    // Create HTTP server (needed for Socket.io — it attaches to http, not express)
    const server = http.createServer(app);

    // Initialize Socket.io real-time server
    const io = initializeSocket(server);
    // Make io accessible from route handlers (for emitting events)
    app.set('io', io);

    // Start listening for HTTP + WebSocket requests
    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
      logger.info(`🔌 Socket.io server ready`);
      logger.info(`❤️  Health check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// --- Step 9: Graceful Shutdown ---
/**
 * When the server is stopped (Ctrl+C, deploy, crash), we want to:
 * 1. Stop accepting new requests
 * 2. Finish processing current requests
 * 3. Close database connections
 * 4. Close Redis connections
 *
 * Without this, connections can "leak" — the database thinks they're
 * still active and might refuse new connections.
 *
 * SIGTERM = "please stop" signal (from process managers like PM2)
 * SIGINT  = "interrupt" signal (from pressing Ctrl+C)
 */
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Shutting down gracefully...`);
  await disconnectDatabase();
  process.exit(0); // Exit with success code
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections (async errors that weren't caught)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // In production, you might want to crash and restart:
  // process.exit(1);
});

// Handle uncaught exceptions (synchronous errors that weren't caught)
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1); // Always crash — the app state might be corrupted
});

// Start the server!
if (require.main === module) {
  startServer();
}

// Export app for testing purposes
module.exports = app;
