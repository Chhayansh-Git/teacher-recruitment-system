/**
 * ============================================================
 * FILE: src/utils/asyncHandler.js — Async Error Wrapper
 * ============================================================
 *
 * WHAT: A tiny but essential utility that wraps async route handlers
 *       so any errors are automatically caught and passed to Express's
 *       error handler.
 *
 * THE PROBLEM:
 *       Express DOES NOT catch errors in async functions by default.
 *
 *       Without this wrapper:
 *       ```
 *       app.get('/users', async (req, res) => {
 *         const users = await prisma.user.findMany(); // If this fails...
 *         res.json(users);
 *       });
 *       // ...the error is SILENTLY SWALLOWED. The client waits forever.
 *       // The server doesn't crash, but it doesn't respond either.
 *       ```
 *
 *       You'd have to manually add try/catch to EVERY route:
 *       ```
 *       app.get('/users', async (req, res, next) => {
 *         try {
 *           const users = await prisma.user.findMany();
 *           res.json(users);
 *         } catch (error) {
 *           next(error); // Pass to error handler
 *         }
 *       });
 *       ```
 *       That's repetitive and easy to forget.
 *
 * THE SOLUTION:
 *       asyncHandler wraps ANY async function and adds the try/catch
 *       automatically:
 *       ```
 *       app.get('/users', asyncHandler(async (req, res) => {
 *         const users = await prisma.user.findMany();
 *         res.json(users);
 *       }));
 *       // Now if prisma.user.findMany() fails, the error is automatically
 *       // caught and passed to the global error handler.
 *       ```
 *
 * HOW:  asyncHandler takes a function (fn) and returns a NEW function.
 *       The new function calls the original function and catches any errors.
 *       This is a pattern called a "Higher-Order Function" — a function
 *       that takes a function as input and returns a function as output.
 *
 * USED IN: Every controller method is wrapped in asyncHandler.
 * ============================================================
 */

/**
 * @param {Function} fn — An async function that takes (req, res, next)
 * @returns {Function} — A new function that catches errors from fn
 */
const asyncHandler = (fn) => {
  // Return a new function that Express will call with (req, res, next)
  return (req, res, next) => {
    // Promise.resolve(fn(req, res, next))
    //   1. Calls the original function: fn(req, res, next)
    //   2. Wraps it in Promise.resolve() to ensure it's a promise
    //   3. .catch(next) — if the promise rejects (error), pass the error
    //      to Express's next() function, which sends it to the error handler

    Promise.resolve(fn(req, res, next)).catch(next);

    // That one line replaces this entire block:
    // try {
    //   await fn(req, res, next);
    // } catch (error) {
    //   next(error);
    // }
  };
};

module.exports = asyncHandler;
