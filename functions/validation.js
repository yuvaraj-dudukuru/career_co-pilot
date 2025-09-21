/**
 * Validation Module for Career Co-Pilot
 * Provides comprehensive validation for plan JSON and other data structures
 */

/**
 * Validate a complete plan JSON structure
 */
function validatePlan(plan) {
  if (!plan || typeof plan !== 'object') {
    return { isValid: false, error: 'Plan must be an object' };
  }

  if (!plan.recommendations || !Array.isArray(plan.recommendations)) {
    return { isValid: false, error: 'Plan must have recommendations array' };
  }

  if (plan.recommendations.length === 0) {
    return { isValid: false, error: 'Plan must have at least one recommendation' };
  }

  if (plan.recommendations.length > 5) {
    return { isValid: false, error: 'Plan cannot have more than 5 recommendations' };
  }

  // Validate each recommendation
  for (let i = 0; i < plan.recommendations.length; i++) {
    const rec = plan.recommendations[i];
    const recValidation = validateRecommendation(rec, i);
    if (!recValidation.isValid) {
      return recValidation;
    }
  }

  return { isValid: true };
}

/**
 * Validate a single recommendation
 */
function validateRecommendation(rec, index = 0) {
  if (!rec || typeof rec !== 'object') {
    return { isValid: false, error: `Recommendation ${index} must be an object` };
  }

  // Required fields
  const requiredFields = ['title', 'fitScore', 'why', 'plan'];
  for (const field of requiredFields) {
    if (!rec[field]) {
      return { isValid: false, error: `Recommendation ${index} missing required field: ${field}` };
    }
  }

  // Validate fitScore
  if (typeof rec.fitScore !== 'number' || rec.fitScore < 0 || rec.fitScore > 100) {
    return { isValid: false, error: `Recommendation ${index} fitScore must be a number between 0-100` };
  }

  // Validate title
  if (typeof rec.title !== 'string' || rec.title.trim().length === 0) {
    return { isValid: false, error: `Recommendation ${index} title must be a non-empty string` };
  }

  // Validate why
  if (typeof rec.why !== 'string' || rec.why.trim().length === 0) {
    return { isValid: false, error: `Recommendation ${index} why must be a non-empty string` };
  }

  // Validate plan
  const planValidation = validateLearningPlan(rec.plan, index);
  if (!planValidation.isValid) {
    return planValidation;
  }

  // Validate optional fields
  if (rec.overlapSkills && !Array.isArray(rec.overlapSkills)) {
    return { isValid: false, error: `Recommendation ${index} overlapSkills must be an array` };
  }

  if (rec.gapSkills && !Array.isArray(rec.gapSkills)) {
    return { isValid: false, error: `Recommendation ${index} gapSkills must be an array` };
  }

  if (rec.roleId && typeof rec.roleId !== 'string') {
    return { isValid: false, error: `Recommendation ${index} roleId must be a string` };
  }

  return { isValid: true };
}

/**
 * Validate a learning plan structure
 */
function validateLearningPlan(plan, recIndex = 0) {
  if (!plan || typeof plan !== 'object') {
    return { isValid: false, error: `Recommendation ${recIndex} plan must be an object` };
  }

  if (!plan.weeks || !Array.isArray(plan.weeks)) {
    return { isValid: false, error: `Recommendation ${recIndex} plan must have weeks array` };
  }

  if (plan.weeks.length !== 4) {
    return { isValid: false, error: `Recommendation ${recIndex} plan must have exactly 4 weeks` };
  }

  // Validate each week
  for (let i = 0; i < plan.weeks.length; i++) {
    const week = plan.weeks[i];
    const weekValidation = validateWeek(week, recIndex, i);
    if (!weekValidation.isValid) {
      return weekValidation;
    }
  }

  return { isValid: true };
}

/**
 * Validate a single week structure
 */
function validateWeek(week, recIndex = 0, weekIndex = 0) {
  if (!week || typeof week !== 'object') {
    return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} must be an object` };
  }

  // Required fields
  const requiredFields = ['week', 'topics', 'practice', 'assessment', 'project'];
  for (const field of requiredFields) {
    if (week[field] === undefined || week[field] === null) {
      return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} missing required field: ${field}` };
    }
  }

  // Validate week number
  if (typeof week.week !== 'number' || week.week < 1 || week.week > 4) {
    return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} week number must be 1-4` };
  }

  // Validate topics
  if (!Array.isArray(week.topics) || week.topics.length === 0) {
    return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} topics must be a non-empty array` };
  }

  for (let i = 0; i < week.topics.length; i++) {
    if (typeof week.topics[i] !== 'string' || week.topics[i].trim().length === 0) {
      return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} topic ${i} must be a non-empty string` };
    }
  }

  // Validate practice
  if (!Array.isArray(week.practice) || week.practice.length === 0) {
    return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} practice must be a non-empty array` };
  }

  for (let i = 0; i < week.practice.length; i++) {
    if (typeof week.practice[i] !== 'string' || week.practice[i].trim().length === 0) {
      return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} practice ${i} must be a non-empty string` };
    }
  }

  // Validate assessment
  if (typeof week.assessment !== 'string' || week.assessment.trim().length === 0) {
    return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} assessment must be a non-empty string` };
  }

  // Validate project
  if (typeof week.project !== 'string' || week.project.trim().length === 0) {
    return { isValid: false, error: `Recommendation ${recIndex} week ${weekIndex} project must be a non-empty string` };
  }

  return { isValid: true };
}

/**
 * Validate user profile data
 */
function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return { isValid: false, error: 'Profile must be an object' };
  }

  const requiredFields = ['name', 'education', 'skills', 'interests', 'weeklyTime', 'budget', 'language'];
  for (const field of requiredFields) {
    if (profile[field] === undefined || profile[field] === null) {
      return { isValid: false, error: `Profile missing required field: ${field}` };
    }
  }

  // Validate name
  if (typeof profile.name !== 'string' || profile.name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  // Validate education
  if (typeof profile.education !== 'string' || profile.education.trim().length === 0) {
    return { isValid: false, error: 'Education must be a non-empty string' };
  }

  // Validate skills
  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    return { isValid: false, error: 'Skills must be a non-empty array' };
  }

  for (let i = 0; i < profile.skills.length; i++) {
    if (typeof profile.skills[i] !== 'string' || profile.skills[i].trim().length === 0) {
      return { isValid: false, error: `Skill ${i} must be a non-empty string` };
    }
  }

  // Validate interests
  if (!Array.isArray(profile.interests) || profile.interests.length === 0) {
    return { isValid: false, error: 'Interests must be a non-empty array' };
  }

  for (let i = 0; i < profile.interests.length; i++) {
    if (typeof profile.interests[i] !== 'string' || profile.interests[i].trim().length === 0) {
      return { isValid: false, error: `Interest ${i} must be a non-empty string` };
    }
  }

  // Validate weeklyTime
  if (typeof profile.weeklyTime !== 'number' || profile.weeklyTime < 1 || profile.weeklyTime > 40) {
    return { isValid: false, error: 'Weekly time must be a number between 1-40 hours' };
  }

  // Validate budget
  if (!['free', 'low', 'any'].includes(profile.budget)) {
    return { isValid: false, error: 'Budget must be one of: free, low, any' };
  }

  // Validate language
  if (!['en', 'hi'].includes(profile.language)) {
    return { isValid: false, error: 'Language must be one of: en, hi' };
  }

  return { isValid: true };
}

/**
 * Sanitize and clean profile data
 */
function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  return {
    name: profile.name?.trim() || '',
    education: profile.education?.trim() || '',
    skills: (profile.skills || [])
      .map(skill => skill?.trim())
      .filter(skill => skill && skill.length > 0),
    interests: (profile.interests || [])
      .map(interest => interest?.trim())
      .filter(interest => interest && interest.length > 0),
    weeklyTime: parseInt(profile.weeklyTime) || 0,
    budget: profile.budget || 'free',
    language: profile.language || 'en'
  };
}

/**
 * Create a test plan for validation testing
 */
function createTestPlan() {
  return {
    recommendations: [
      {
        roleId: "test_role",
        title: "Test Role",
        fitScore: 85,
        why: "This is a test recommendation",
        overlapSkills: ["JavaScript", "HTML"],
        gapSkills: ["React", "TypeScript"],
        plan: {
          weeks: [
            {
              week: 1,
              topics: ["Topic 1", "Topic 2"],
              practice: ["Practice 1", "Practice 2"],
              assessment: "Assessment 1",
              project: "Project 1"
            },
            {
              week: 2,
              topics: ["Topic 3", "Topic 4"],
              practice: ["Practice 3", "Practice 4"],
              assessment: "Assessment 2",
              project: "Project 2"
            },
            {
              week: 3,
              topics: ["Topic 5", "Topic 6"],
              practice: ["Practice 5", "Practice 6"],
              assessment: "Assessment 3",
              project: "Project 3"
            },
            {
              week: 4,
              topics: ["Topic 7", "Topic 8"],
              practice: ["Practice 7", "Practice 8"],
              assessment: "Assessment 4",
              project: "Capstone Project"
            }
          ]
        }
      }
    ]
  };
}

export {
  validatePlan,
  validateRecommendation,
  validateLearningPlan,
  validateWeek,
  validateProfile,
  sanitizeProfile,
  createTestPlan
};
