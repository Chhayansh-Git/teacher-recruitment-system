/**
 * ============================================================
 * FILE: src/services/school.service.js — School Business Logic
 * ============================================================
 *
 * WHAT: All operations related to school profiles and requirements.
 *
 * KEY CONCEPTS:
 *       - Schools can only see/edit THEIR OWN data
 *       - Requirements can only be edited if no shortlists exist
 *       - Matched candidates are returned with privacy filtering
 * ============================================================
 */

const { prisma } = require('../config/database');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * getProfile — Get the logged-in school's profile.
 *
 * @param {string} schoolId — From req.user.schoolId (set by authenticate middleware)
 */
async function getProfile(schoolId) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      user: {
        select: { email: true, phone: true, status: true, createdAt: true },
      },
    },
  });

  if (!school) {
    throw ApiError.notFound('School profile not found.');
  }

  return school;
}

/**
 * updateProfile — Update the logged-in school's profile.
 *
 * Only allows updating fields that the school owns.
 * The schoolId from the JWT ensures a school can only update THEIR profile.
 */
async function updateProfile(schoolId, data) {
  const school = await prisma.school.update({
    where: { id: schoolId },
    data, // Prisma only updates the fields that are provided
    // If data = { principalName: 'New Name' }, only principalName changes
  });

  logger.info(`School profile updated: ${school.schoolName}`);
  return school;
}

/**
 * createRequirement — Post a new job requirement.
 *
 * A requirement is a job posting: "We need 2 PGT Mathematics teachers
 * with 3+ years experience, CBSE board, Male preferred."
 *
 * After creation, the matching engine can find suitable candidates.
 */
async function createRequirement(schoolId, data) {
  const requirement = await prisma.requirement.create({
    data: {
      schoolId,
      ...data, // Spread operator: copies all fields from data into this object
    },
  });

  logger.info(`New requirement created by school ${schoolId}: ${data.postDesignation}`);
  return requirement;
}

/**
 * getRequirements — List all requirements for the logged-in school.
 *
 * Returns paginated results. The meta object tells the frontend
 * how to render pagination controls (page numbers, next/prev buttons).
 */
async function getRequirements(schoolId, page = 1, limit = 20) {
  // Calculate how many records to skip
  // Page 1: skip 0, Page 2: skip 20, Page 3: skip 40, etc.
  const skip = (page - 1) * limit;

  // Prisma $transaction ensures both queries use the same snapshot of data
  // (the count doesn't change between the two queries)
  const [requirements, total] = await prisma.$transaction([
    prisma.requirement.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' }, // Newest first
      skip, // Skip this many results
      take: limit, // Return this many results
      include: {
        _count: { select: { shortlists: true } },
        // _count gives us the number of shortlists for each requirement
        // without fetching all the shortlist records
      },
    }),
    prisma.requirement.count({ where: { schoolId } }),
  ]);

  return { requirements, total, page, limit };
}

/**
 * getRequirementById — Get a single requirement with details.
 */
async function getRequirementById(schoolId, requirementId) {
  const requirement = await prisma.requirement.findFirst({
    where: {
      id: requirementId,
      schoolId, // Ensures the school can only see THEIR requirements
    },
    include: {
      shortlists: {
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              primaryRole: true,
              qualifications: true,
              experience: true,
              expectedSalary: true,
              gender: true,
              // Note: contactNo, email, address are NOT included here
              // This is "select" level privacy — only request what's needed
            },
          },
        },
      },
    },
  });

  if (!requirement) {
    throw ApiError.notFound('Requirement not found.');
  }

  return requirement;
}

/**
 * getDashboard — Get school dashboard data.
 *
 * Returns summary stats: active requirements, active pipelines,
 * pending shortlists, etc. Used by the school dashboard page.
 */
async function getDashboard(schoolId) {
  // Run all queries in parallel using Promise.all
  // This is much faster than running them one by one
  const [
    activeRequirements,
    totalRequirements,
    pendingShortlists,
    activePipelines,
    selectedCandidates,
  ] = await Promise.all([
    prisma.requirement.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.requirement.count({ where: { schoolId } }),
    prisma.shortlist.count({
      where: { requirement: { schoolId }, status: 'PENDING' },
    }),
    prisma.pipeline.count({ where: { schoolId, status: 'ACTIVE' } }),
    prisma.pipeline.count({ where: { schoolId, status: 'SELECTED' } }),
  ]);

  // Get active pipelines with candidate details
  const pipelines = await prisma.pipeline.findMany({
    where: { schoolId, status: 'ACTIVE' },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          primaryRole: true,
          qualifications: true,
        },
      },
      shortlist: {
        include: {
          requirement: {
            select: { postDesignation: true, subjects: true },
          },
        },
      },
    },
    orderBy: { pushedAt: 'desc' },
  });

  return {
    stats: {
      activeRequirements,
      totalRequirements,
      pendingShortlists,
      activePipelines,
      selectedCandidates,
    },
    activePipelines: pipelines,
  };
}

module.exports = {
  getProfile,
  updateProfile,
  createRequirement,
  getRequirements,
  getRequirementById,
  getDashboard,
};
