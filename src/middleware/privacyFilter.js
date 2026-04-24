/**
 * ============================================================
 * FILE: src/middleware/privacyFilter.js — The Most Critical Middleware
 * ============================================================
 *
 * WHAT: Strips sensitive fields from API responses based on who's asking
 *       and what stage the recruitment pipeline is in.
 *
 * WHY THIS IS THE MOST IMPORTANT MIDDLEWARE:
 *       The ENTIRE business model depends on schools and candidates
 *       NOT having each other's contact information. If a school gets
 *       a candidate's phone number, they can contact them directly
 *       and bypass the platform entirely.
 *
 *       If every controller manually stripped fields, a single developer
 *       oversight would expose contact info. This centralized filter
 *       makes it IMPOSSIBLE to forget.
 *
 * THE RULES (from PRD/TDD):
 *       ┌──────────────┬──────────────────────────────────────────┐
 *       │ Requester    │ What they CAN'T see on a candidate       │
 *       ├──────────────┼──────────────────────────────────────────┤
 *       │ ADMIN        │ Everything visible (no filtering)         │
 *       ├──────────────┼──────────────────────────────────────────┤
 *       │ SCHOOL       │ NEVER: contactNo, email, whatsapp, addr  │
 *       │ (before push)│ ALSO: name, dob, gender hidden            │
 *       │ (after push) │ Name, dob, gender become visible          │
 *       ├──────────────┼──────────────────────────────────────────┤
 *       │ CANDIDATE    │ Can only see their OWN profile             │
 *       │ (before push)│ Doesn't even know they've been matched    │
 *       └──────────────┴──────────────────────────────────────────┘
 *
 * HOW IT WORKS:
 *       This middleware wraps res.json(). Instead of the original json()
 *       sending data directly, our wrapper intercepts the data, applies
 *       filtering rules, and then sends the filtered version.
 *
 *       This is called the "Decorator Pattern" — we enhance an existing
 *       function without changing its interface.
 * ============================================================
 */

/**
 * privacyFilter — Middleware that filters response data based on user role.
 *
 * It works by replacing res.json() with a wrapped version that
 * filters the data before sending it.
 */
const privacyFilter = (req, res, next) => {
  // Store the original res.json function
  const originalJson = res.json.bind(res);

  // Replace res.json with our filtered version
  res.json = (data) => {
    // If there's no user (public endpoint) or no data, send as-is
    if (!req.user || !data) {
      return originalJson(data);
    }

    // If the response is an error, don't filter it
    if (data.success === false) {
      return originalJson(data);
    }

    // Apply filtering based on user role
    const filtered = filterResponse(data, req.user);
    return originalJson(filtered);
  };

  next();
};

/**
 * filterResponse — Recursively filters sensitive fields from response data.
 *
 * @param {Object} data — The response data object
 * @param {Object} user — The authenticated user (from req.user)
 * @returns {Object} — Filtered data
 */
function filterResponse(data, user) {
  // Admin sees everything — no filtering needed
  if (user.role === 'ADMIN') {
    return data;
  }

  // Deep clone the data so we don't modify the original
  // JSON.parse(JSON.stringify(x)) is a simple way to deep clone
  // (it has limitations with Dates, but works for JSON-serializable data)
  const clone = JSON.parse(JSON.stringify(data));

  if (user.role === 'SCHOOL') {
    filterForSchool(clone);
  }

  if (user.role === 'CANDIDATE') {
    filterForCandidate(clone, user);
  }

  return clone;
}

/**
 * Fields that schools should NEVER see on candidates.
 * These are marked with 🔒 in the database schema.
 */
const ALWAYS_HIDDEN_FROM_SCHOOLS = [
  'contactNo',
  'email',
  'whatsappNo',
  'address',
  'contact_no',   // snake_case versions too (Prisma might use either)
  'whatsapp_no',
];

/**
 * Fields hidden BEFORE a candidate is pushed (matched but not yet introduced).
 * Schools see qualifications and experience, but not personal identity.
 */
const HIDDEN_BEFORE_PUSH = [
  'name',
  'dob',
  'gender',
];

/**
 * filterForSchool — Remove sensitive candidate fields from school responses.
 *
 * This recursively walks through the data structure and removes
 * forbidden fields from any "candidate" objects it finds.
 */
function filterForSchool(data) {
  // If the data is an array, filter each item
  if (Array.isArray(data)) {
    data.forEach((item) => filterForSchool(item));
    return;
  }

  // If it's not an object, nothing to filter
  if (!data || typeof data !== 'object') {
    return;
  }

  // Check if this object has candidate data
  // It could be nested at various levels: data.data.candidate, data.data[0].candidate, etc.
  const candidateData = data.candidate || data.data?.candidate;
  if (candidateData) {
    // ALWAYS remove contact info
    ALWAYS_HIDDEN_FROM_SCHOOLS.forEach((field) => {
      delete candidateData[field];
    });

    // If the candidate hasn't been pushed yet, also hide identity
    // We check if there's pipeline info and if the pipeline status is ACTIVE or beyond
    const pipelineStatus = data.pipeline?.status || data.pipelineStatus;
    if (!pipelineStatus || pipelineStatus === 'MATCHED') {
      HIDDEN_BEFORE_PUSH.forEach((field) => {
        delete candidateData[field];
      });
    }
  }

  // Recursively check nested objects
  if (data.data) {
    filterForSchool(data.data);
  }

  // Handle paginated arrays
  if (Array.isArray(data.data)) {
    data.data.forEach((item) => filterForSchool(item));
  }
}

/**
 * filterForCandidate — Ensure candidates only see their own data.
 *
 * Candidates should NOT see:
 * - Other candidates' information
 * - Match results before they've been pushed
 * - School's internal shortlisting/requirement details
 */
function filterForCandidate(data, user) {
  // For now, the route-level authorization handles most of this
  // (candidates can only access /candidates/profile which returns their own data).
  // This is an additional safety layer.

  // If there's candidate data that doesn't belong to this user, strip it
  if (data.data?.candidate && data.data.candidate.userId !== user.id) {
    data.data.candidate = null;
  }
}

module.exports = privacyFilter;
