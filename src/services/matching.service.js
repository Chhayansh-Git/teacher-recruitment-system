/**
 * ============================================================
 * FILE: src/services/matching.service.js — AI Matching Algorithm
 * ============================================================
 *
 * WHAT: Matches candidates to school requirements based on multiple
 *       criteria. This is a simplified version of what the TDD describes
 *       as a Python ML microservice. For MVP, we implement it directly
 *       in Node.js using a weighted scoring algorithm.
 *
 * HOW THE MATCHING WORKS:
 *       Each candidate is scored against a requirement on multiple criteria:
 *
 *       ┌────────────────────┬────────┬─────────────────────────────────┐
 *       │ Criteria            │ Weight │ How It's Scored                 │
 *       ├────────────────────┼────────┼─────────────────────────────────┤
 *       │ Subject Match       │ 30%    │ How many required subjects      │
 *       │                     │        │ does the candidate teach?       │
 *       ├────────────────────┼────────┼─────────────────────────────────┤
 *       │ Qualification Match │ 25%    │ Does the candidate have the     │
 *       │                     │        │ required qualifications?        │
 *       ├────────────────────┼────────┼─────────────────────────────────┤
 *       │ Experience Match    │ 20%    │ Does the candidate meet the     │
 *       │                     │        │ minimum experience requirement? │
 *       ├────────────────────┼────────┼─────────────────────────────────┤
 *       │ Location Match      │ 15%    │ Is the school's city in the     │
 *       │                     │        │ candidate's interested list?    │
 *       ├────────────────────┼────────┼─────────────────────────────────┤
 *       │ Salary Match        │ 10%    │ Is the offered salary >= the    │
 *       │                     │        │ candidate's expected salary?    │
 *       └────────────────────┴────────┴─────────────────────────────────┘
 *
 *       Final score: 0–100. Higher = better match.
 *       Candidates with score >= 40 are considered "matches."
 * ============================================================
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config');

// --- ML Microservice Integration ---
// The TDD specifies a separate Python FastAPI microservice for ML matching.
// This service tries the ML endpoint first; if the ML service is down, it
// falls back to the local rule-based scoring below.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_API_KEY = process.env.ML_API_KEY || 'dev-ml-api-key-change-me';

/**
 * tryMLService — Attempt to score candidates using the Python ML service.
 * Returns null if the service is unavailable or errors out.
 */
async function tryMLService(requirement, candidates, schoolCity) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: ML_API_KEY,
        requirement: {
          id: requirement.id,
          subjects: requirement.subjects,
          post_designation: requirement.postDesignation,
          qualification: requirement.qualification,
          experience_min: requirement.experienceMin,
          salary_offered: requirement.salaryOffered,
          gender_pref: requirement.genderPref,
          location: schoolCity,
        },
        candidates: candidates.map((c) => ({
          id: c.id,
          primary_role: c.primaryRole,
          qualifications: c.qualifications || [],
          experience: c.experience || [],
          expected_salary: c.expectedSalary,
          location_interested: c.locationInterested || [],
          gender: c.gender,
        })),
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout — don't block if ML is slow
    });

    if (response.ok) {
      const data = await response.json();
      logger.info(`ML service scored ${data.matches?.length || 0} candidates (model: ${data.model_version})`);
      return data.matches;
    }
    return null;
  } catch (err) {
    logger.debug(`ML service unavailable (${err.message}), using local scoring`);
    return null;
  }
}

// Scoring weights (must sum to 1.0 = 100%)
const WEIGHTS = {
  subject: 0.30,
  qualification: 0.25,
  experience: 0.20,
  location: 0.15,
  salary: 0.10,
};

// Minimum score to be considered a "match"
const MIN_MATCH_SCORE = 40;

/**
 * findMatches — Find candidates that match a specific requirement.
 *
 * @param {string} requirementId — The requirement to match against
 * @param {string} schoolId — The school that owns the requirement
 * @returns {Array} — Sorted list of candidates with match scores
 */
async function findMatches(requirementId, schoolId) {
  // --- Step 1: Get the requirement details ---
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: {
      school: { select: { city: true } },
    },
  });

  if (!requirement) {
    return [];
  }

  // --- Step 2: Get all ACTIVE candidates ---
  const candidates = await prisma.candidate.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      user: { select: { status: true } },
    },
  });

  const verifiedCandidates = candidates.filter((c) => c.user.status === 'VERIFIED');

  // --- Step 3: Try ML Microservice first ---
  const mlResults = await tryMLService(requirement, verifiedCandidates, requirement.school?.city || '');

  let scoredCandidates;

  if (mlResults) {
    // ML service returned results — map them back to candidate objects
    const candidateMap = new Map(verifiedCandidates.map((c) => [c.id, c]));
    scoredCandidates = mlResults
      .filter((m) => m.match_score >= MIN_MATCH_SCORE)
      .map((m) => ({
        candidate: candidateMap.get(m.candidate_id),
        matchScore: m.match_score,
        breakdown: m.breakdown || m.features || {},
        source: 'ml-service',
      }))
      .filter((m) => m.candidate); // Remove any candidates that weren't found
  } else {
    // --- Fallback: Local rule-based scoring ---
    scoredCandidates = verifiedCandidates
      .map((candidate) => ({
        candidate,
        matchScore: calculateMatchScore(candidate, requirement),
        breakdown: calculateBreakdown(candidate, requirement),
        source: 'local-rules',
      }))
      .filter((match) => match.matchScore >= MIN_MATCH_SCORE)
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  logger.info(
    `Matching for requirement ${requirementId}: ${scoredCandidates.length} matches out of ${verifiedCandidates.length} candidates (source: ${scoredCandidates[0]?.source || 'none'})`
  );

  return scoredCandidates;
}

/**
 * calculateMatchScore — Calculate overall match score (0–100).
 *
 * Each criteria contributes a weighted portion of the total score.
 */
function calculateMatchScore(candidate, requirement) {
  let score = 0;

  // 1. Subject Match (30%)
  score += WEIGHTS.subject * subjectScore(candidate, requirement) * 100;

  // 2. Qualification Match (25%)
  score += WEIGHTS.qualification * qualificationScore(candidate, requirement) * 100;

  // 3. Experience Match (20%)
  score += WEIGHTS.experience * experienceScore(candidate, requirement) * 100;

  // 4. Location Match (15%)
  score += WEIGHTS.location * locationScore(candidate, requirement) * 100;

  // 5. Salary Match (10%)
  score += WEIGHTS.salary * salaryScore(candidate, requirement) * 100;

  // Round to 1 decimal place
  return Math.round(score * 10) / 10;
}

/**
 * subjectScore — How well does the candidate's role match the required subjects?
 *
 * Returns 0 (no match) to 1 (perfect match).
 */
function subjectScore(candidate, requirement) {
  if (!requirement.subjects || requirement.subjects.length === 0) return 1;

  // Check if the candidate's primary role matches any required subject
  // Case-insensitive comparison using .toLowerCase()
  const candidateRole = candidate.primaryRole.toLowerCase();
  const matchingSubjects = requirement.subjects.filter(
    (subject) => candidateRole.includes(subject.toLowerCase())
  );

  // Also check the post designation
  const designationMatch = candidateRole.includes(
    requirement.postDesignation.toLowerCase()
  );

  if (designationMatch) return 1;
  // Partial match: how many of the required subjects the candidate covers
  return matchingSubjects.length / requirement.subjects.length;
}

/**
 * qualificationScore — Does the candidate's qualification match?
 *
 * Simple text matching for MVP. A real ML service would use
 * NLP to understand qualification hierarchy (M.Ed > B.Ed, etc.)
 */
function qualificationScore(candidate, requirement) {
  if (!requirement.qualification) return 1;

  const requiredQual = requirement.qualification.toLowerCase();
  const candidateQuals = candidate.qualifications || [];

  // Check if any of the candidate's degrees contain the required qualification
  // Example: required "B.Ed", candidate has [{ degree: "B.Ed" }, { degree: "M.Sc" }]
  const hasMatch = candidateQuals.some(
    (q) =>
      q.degree && q.degree.toLowerCase().includes(requiredQual) ||
      requiredQual.includes(q.degree?.toLowerCase() || '')
  );

  return hasMatch ? 1 : 0.3; // Partial credit even without exact match
}

/**
 * experienceScore — Does the candidate meet the experience requirement?
 */
function experienceScore(candidate, requirement) {
  if (requirement.experienceMin === 0) return 1; // No experience required

  // Sum up total years of experience
  const candidateExperience = (candidate.experience || []).reduce(
    (total, exp) => total + (exp.years || 0),
    0
  );

  if (candidateExperience >= requirement.experienceMin) return 1; // Meets or exceeds
  if (candidateExperience >= requirement.experienceMin * 0.5) return 0.6; // Has half
  return 0.2; // Has some but not enough
}

/**
 * locationScore — Is the school's city in the candidate's interested list?
 */
function locationScore(candidate, requirement) {
  if (!candidate.locationInterested || candidate.locationInterested.length === 0) {
    return 0.5; // No preference = neutral
  }

  const schoolCity = requirement.school?.city?.toLowerCase() || '';
  const interestedCities = candidate.locationInterested.map((c) => c.toLowerCase());

  return interestedCities.includes(schoolCity) ? 1 : 0.2;
}

/**
 * salaryScore — Can the school afford the candidate?
 */
function salaryScore(candidate, requirement) {
  if (!candidate.expectedSalary || !requirement.salaryOffered) return 0.5; // Unknown

  if (requirement.salaryOffered >= candidate.expectedSalary) return 1; // Can afford
  if (requirement.salaryOffered >= candidate.expectedSalary * 0.8) return 0.7; // Close
  return 0.3; // Significantly below expectations
}

/**
 * calculateBreakdown — Returns individual scores for transparency.
 */
function calculateBreakdown(candidate, requirement) {
  return {
    subject: Math.round(subjectScore(candidate, requirement) * 100),
    qualification: Math.round(qualificationScore(candidate, requirement) * 100),
    experience: Math.round(experienceScore(candidate, requirement) * 100),
    location: Math.round(locationScore(candidate, requirement) * 100),
    salary: Math.round(salaryScore(candidate, requirement) * 100),
  };
}

module.exports = {
  findMatches,
  calculateMatchScore,
};
