/**
 * Utility functions for Career Co-Pilot MVP
 */

/**
 * Compute cosine similarity between two skill vectors
 * @param {Object} a - First vector (skill -> weight)
 * @param {Object} b - Second vector (skill -> weight)
 * @returns {number} Cosine similarity (0-1)
 */
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  
  keys.forEach(k => {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  });
  
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Compute overlap ratio between user skills and role skills
 * Denominator: number of distinct skills in the role definition
 * @param {string[]} userSkills
 * @param {Object} role
 * @returns {number} in [0,1]
 */
export function overlapRatio(userSkills, role) {
  const userSet = new Set((userSkills || []).map(s => s.toLowerCase().trim()));
  const roleSkillNames = (role.skills || []).map(s => s.name.toLowerCase().trim());
  const roleSet = new Set(roleSkillNames);
  if (roleSet.size === 0) return 0;
  let overlapCount = 0;
  roleSet.forEach(s => { if (userSet.has(s)) overlapCount += 1; });
  return overlapCount / roleSet.size;
}

/**
 * Build user skill vector from skills array
 * @param {string[]} skills - Array of skill names
 * @returns {Object} Skill vector (skill -> weight)
 */
export function buildUserVector(skills) {
  const vec = {};
  (skills || []).forEach(s => { 
    vec[s.toLowerCase().trim()] = 1.0; 
  });
  return vec;
}

/**
 * Build role skill vector from role definition
 * @param {Object} role - Role object with skills array
 * @returns {Object} Skill vector (skill -> weight)
 */
export function buildRoleVector(role) {
  const vec = {};
  (role.skills || []).forEach(({name, weight}) => { 
    vec[name.toLowerCase().trim()] = weight || 1.0; 
  });
  return vec;
}

/**
 * Clean up JSON string from LLM output
 * @param {string} s - Raw string from LLM
 * @returns {string} Cleaned JSON string
 */
export function cleanupJsonString(s) {
  if (!s) return '';
  return s
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^[^{]*/, '') // Remove anything before first {
    .replace(/[^}]*$/, '') // Remove anything after last }
    .trim();
}

/**
 * Additional cleaner to strip HTML/markdown artifacts
 * @param {string} s
 * @returns {string}
 */
export function cleanLLMOutput(s) {
  if (!s) return '';
  return cleanupJsonString(
    s
      .replace(/<[^>]*>/g, '') // strip HTML tags
      .replace(/^[\s\S]*?\{/, '{') // keep from first {
      .replace(/\}[\s\S]*$/, '}') // keep until last }
  );
}

/**
 * Normalize skill names (lowercase, trim, basic synonyms)
 * @param {string[]} skills - Raw skills array
 * @returns {string[]} Normalized skills array
 */
export function normalizeSkills(skills) {
  const synonyms = {
    'excel': 'spreadsheets',
    'spreadsheets': 'excel',
    'javascript': 'js',
    'js': 'javascript',
    'python': 'python',
    'react': 'react',
    'node': 'nodejs',
    'nodejs': 'node',
    'aws': 'amazon web services',
    'amazon web services': 'aws',
    'machine learning': 'ml',
    'ml': 'machine learning',
    'artificial intelligence': 'ai',
    'ai': 'artificial intelligence'
  };

  return skills
    .map(s => s.toLowerCase().trim())
    .map(s => synonyms[s] || s)
    .filter((s, i, arr) => arr.indexOf(s) === i) // Remove duplicates
    .slice(0, 50); // Limit to 50 skills
}

/**
 * Calculate overlap and gap skills between user and role
 * @param {string[]} userSkills - User's skills
 * @param {Object} role - Role definition
 * @returns {Object} {overlap: string[], gaps: string[]}
 */
export function calculateSkillOverlap(userSkills, role) {
  const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));
  const roleSkillSet = new Set(role.skills.map(s => s.name.toLowerCase()));
  
  const overlap = [];
  const gaps = [];
  
  role.skills.forEach(skill => {
    const skillName = skill.name.toLowerCase();
    if (userSkillSet.has(skillName)) {
      overlap.push(skill.name);
    } else {
      gaps.push(skill.name);
    }
  });
  
  return {
    overlap: overlap.slice(0, 20),
    gaps: gaps.slice(0, 20)
  };
}

/**
 * Format fit score per methodology: round((0.6*cosine + 0.4*overlapRatio)*100)
 * @param {number} cosineValue in [0,1]
 * @param {number} overlap in [0,1]
 */
export function formatFitScore(cosineValue, overlap) {
  const raw = 0.6 * (Number(cosineValue) || 0) + 0.4 * (Number(overlap) || 0);
  const pct = Math.round(raw * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Sanitize user profile input
 * @param {Object} profile - Raw profile input
 * @returns {Object} Sanitized profile
 */
export function sanitizeProfile(profile) {
  // Intentionally exclude sensitive attributes if present
  const { gender, caste, religion, address, collegeTier, ...rest } = profile || {};
  return {
    name: (profile.name || '').slice(0, 80),
    education: (profile.education || 'Other').slice(0, 40),
    skills: normalizeSkills(profile.skills || []),
    interests: (profile.interests || []).map(s => s.toLowerCase().trim()).slice(0, 20),
    weeklyTime: Math.max(1, Math.min(30, Number(profile.weeklyTime || 6))),
    budget: ['free', 'low', 'any'].includes(profile.budget) ? profile.budget : 'free',
    language: ['en', 'hi'].includes(profile.language) ? profile.language : 'en'
  };
}

/**
 * Log analytics event
 * @param {Object} firestore - Firestore instance
 * @param {string} uid - User ID
 * @param {string} event - Event name
 * @param {Object} data - Additional event data
 */
export async function logAnalytics(firestore, uid, event, data = {}) {
  try {
    await firestore.collection('analytics').add({
      uid,
      event,
      data,
      timestamp: new Date(),
      userAgent: data.userAgent || 'unknown'
    });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
}
