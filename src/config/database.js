/**
 * ============================================================
 * FILE: src/config/database.js — Prisma Database Client
 * ============================================================
 *
 * WHAT: Creates and exports a single Prisma Client instance.
 *       Prisma Client is the tool that lets us talk to the database
 *       using JavaScript instead of writing raw SQL queries.
 *
 * WHY A SINGLE INSTANCE?
 *       Every Prisma Client opens a "connection pool" — a set of
 *       persistent connections to the database. If we created a new
 *       client in every file, we'd have hundreds of connections,
 *       which would overload the database.
 *
 *       By creating ONE client here and exporting it, every file
 *       shares the same pool of connections. This is called the
 *       "Singleton Pattern" — one instance, shared everywhere.
 *
 * HOW:  Other files import this:
 *       const { prisma } = require('../config/database');
 *       const users = await prisma.user.findMany();
 *
 * WHAT IS PRISMA?
 *       Prisma is an ORM (Object-Relational Mapper). It translates
 *       between JavaScript objects and database tables:
 *
 *       JavaScript:  prisma.user.findMany({ where: { role: 'SCHOOL' } })
 *       Becomes SQL: SELECT * FROM users WHERE role = 'SCHOOL';
 *
 *       This is safer (prevents SQL injection) and easier to write.
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');
const config = require('./index');

/**
 * Create the Prisma Client with logging configuration.
 *
 * In development, we log all queries so you can see the SQL
 * that Prisma generates. This helps you learn SQL by seeing
 * what your JavaScript code becomes.
 *
 * In production, we only log warnings and errors to keep
 * the logs clean and performant.
 */
const prisma = new PrismaClient({
  log:
    config.nodeEnv === 'development'
      ? [
          { level: 'query', emit: 'event' }, // Log SQL queries
          { level: 'warn', emit: 'stdout' }, // Log warnings
          { level: 'error', emit: 'stdout' }, // Log errors
        ]
      : [
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ],
});

/**
 * In development mode, log every SQL query to the console.
 *
 * This is INCREDIBLY useful for learning:
 * - You write: prisma.user.findUnique({ where: { email: 'test@test.com' } })
 * - Console shows: SELECT * FROM "users" WHERE "email" = 'test@test.com'
 *
 * You'll see exactly what's happening in the database!
 */
if (config.nodeEnv === 'development') {
  prisma.$on('query', (event) => {
    console.log(`\n📊 SQL Query: ${event.query}`);
    console.log(`   Duration: ${event.duration}ms`);
  });
}

/**
 * connectDatabase() — Tests the database connection.
 *
 * Called once when the server starts. If the database is unreachable,
 * the server won't start (fail-fast principle).
 *
 * $connect() is a Prisma method that explicitly opens the connection.
 * Normally Prisma connects lazily (on first query), but we want to
 * know immediately if the database is down.
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Exit with code 1 = error. The process manager (like PM2) will
    // detect this and can restart the app or alert the team.
    process.exit(1);
  }
}

/**
 * disconnectDatabase() — Cleanly closes the database connection.
 *
 * Called when the server shuts down (Ctrl+C, deploy, crash).
 * If we don't disconnect, the database might think the connections
 * are still active and refuse new ones (connection leak).
 */
async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('📦 Database disconnected');
}

module.exports = { prisma, connectDatabase, disconnectDatabase };
