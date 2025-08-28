/**
 * Prompt builders for Career Co-Pilot MVP
 * Focuses on fairness, transparency, and India context
 */

/**
 * Build prompt for explaining why a role fits the user
 * @param {Object} profile - Sanitized user profile
 * @param {Object} role - Role definition
 * @param {string[]} overlapSkills - Skills user already has
 * @param {string[]} gapSkills - Skills user needs to learn
 * @returns {Array} Messages array for Gemini API
 */
export function buildExplainPrompt(profile, role, overlapSkills, gapSkills) {
  return [
    {
      role: "system",
      content: `You are a fair, transparent career advisor for Indian students and professionals. 
      
IMPORTANT RULES:
- NEVER use gender, caste, religion, college rank, or any sensitive personal traits in your reasoning
- Base ALL recommendations ONLY on skills, interests, goals, and learning capacity
- Focus on India-specific career paths and entry opportunities
- Keep explanations under 120 words
- Be encouraging but realistic about skill gaps
- Use simple, clear language without buzzwords`
    },
    {
      role: "user",
      content: `Student Profile (sanitized):
Education: ${profile.education}
Skills: ${profile.skills.join(', ')}
Interests: ${profile.interests.join(', ')}
Weekly Learning Time: ${profile.weeklyTime} hours
Budget: ${profile.budget}
Language: ${profile.language}

Target Role: ${role.title}
Role Description: ${role.description}
Overlapping Skills: ${overlapSkills.length > 0 ? overlapSkills.join(', ') : 'None yet'}
Top Skill Gaps: ${gapSkills.slice(0, 5).join(', ')}

In ≤120 words, explain why this role fits this person. Cite specific skill overlaps and how to address the main gaps. Include India-specific entry paths or opportunities. Be encouraging but realistic.`
    }
  ];
}

/**
 * Build prompt for generating structured learning plan
 * @param {Object} profile - Sanitized user profile
 * @param {string[]} gapSkills - Skills user needs to learn
 * @param {string} roleTitle - Title of the target role
 * @returns {Array} Messages array for Gemini API
 */
export function buildPlanPrompt(profile, gapSkills, roleTitle) {
  return [
    {
      role: "system",
      content: `You are a career planning expert. Return ONLY valid JSON. No commentary, no markdown, no code fences.

REQUIRED JSON SCHEMA:
{
  "weeks": [
    {
      "week": 1,
      "topics": ["topic1", "topic2"],
      "practice": ["practice task 1", "practice task 2"],
      "assessment": "assessment description",
      "project": "project description"
    }
  ]
}

EXACTLY 4 weeks. Each week must have all 4 fields. Keep tasks realistic for ${profile.weeklyTime} hours per week.`
    },
    {
      role: "user",
      content: `Generate a 4-week learning plan for becoming a ${roleTitle}.

Student Constraints:
- Weekly time: ${profile.weeklyTime} hours
- Budget: ${profile.budget}
- Language: ${profile.language}

Skills to Learn: ${gapSkills.slice(0, 8).join(', ')}

Requirements:
- Week 1: Focus on foundational concepts
- Week 2: Build practical skills
- Week 3: Advanced topics and real-world application
- Week 4: Project work and assessment

Prefer free resources when possible. Use generic categories like 'official documentation', 'practice portals', 'online tutorials'. Keep descriptions concise but clear.`
    }
  ];
}

/**
 * Build retry prompt for JSON generation if first attempt fails
 * @param {string} failedJson - The failed JSON string
 * @returns {Array} Messages array for retry
 */
export function buildRetryPrompt(failedJson) {
  return [
    {
      role: "system",
      content: `The previous response was invalid JSON. You MUST return ONLY valid JSON that matches this exact schema:

{
  "weeks": [
    {
      "week": 1,
      "topics": ["topic1", "topic2"],
      "practice": ["practice1", "practice2"],
      "assessment": "assessment description",
      "project": "project description"
    }
  ]
}

No text before or after the JSON. No markdown formatting. Just the raw JSON object.`
    },
    {
      role: "user",
      content: `Fix this invalid JSON and return ONLY the corrected version:

${failedJson}

Return ONLY the valid JSON object.`
    }
  ];
}

/**
 * Build fairness disclaimer for prompts
 * @returns {string} Fairness disclaimer text
 */
export function getFairnessDisclaimer() {
  return `This career recommendation system is designed to be fair and transparent. 
  
We do NOT consider:
- Gender, caste, religion, or ethnicity
- College ranking or tier
- Family background or connections
- Personal appearance or characteristics

All recommendations are based solely on:
- Your technical skills and knowledge
- Your stated interests and goals
- Your learning capacity and time availability
- Current market demand for specific skills

You can edit your profile anytime and regenerate recommendations.`;
}
