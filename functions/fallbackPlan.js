/**
 * Deterministic Fallback Plan Generator
 * Provides reliable 4-week learning plans when LLM is unavailable
 */

function deterministicPlanForRole(roleTitle, gapSkills, profile) {
  // Return EXACTLY 4 weeks with topics/practice/assessment/project
  const baseTopics = {
    "frontend_developer": [
      ["React Fundamentals", "Build a simple todo app"],
      ["State Management & Hooks", "Create a shopping cart component"],
      ["Routing & API Integration", "Build a weather app with API"],
      ["Testing & Deployment", "Deploy your app to Vercel"]
    ],
    "data_analyst": [
      ["SQL basics & Joins", "Analyze sample dataset"],
      ["Excel & Pivot tables", "Data cleaning exercise"],
      ["Data visualization basics", "Create charts and dashboard"],
      ["Capstone: Complete analysis", "Present findings report"]
    ],
    "uiux_designer": [
      ["Design basics & Figma intro", "Redesign a simple page"],
      ["Wireframes & user flows", "Create 2 wireframes"],
      ["Prototyping & usability testing", "Run quick usability test"],
      ["Capstone: Prototype an app page", "Usability report"]
    ],
    "backend_developer": [
      ["Node.js & Express basics", "Build a simple API"],
      ["Database integration", "Connect to MongoDB"],
      ["Authentication & Security", "Add JWT authentication"],
      ["Deployment & Testing", "Deploy to cloud platform"]
    ],
    "mobile_developer": [
      ["React Native basics", "Build a simple mobile app"],
      ["Navigation & State", "Add navigation between screens"],
      ["API Integration", "Connect to backend services"],
      ["Testing & Publishing", "Test on device and publish"]
    ],
    "product_manager": [
      ["Product Strategy & Market Research", "Create user personas"],
      ["User Research & Interviews", "Conduct user interviews"],
      ["Agile Methodology", "Create product backlog"],
      ["Metrics & Analytics", "Design product metrics"]
    ],
    "cybersecurity_analyst": [
      ["Security Fundamentals", "Analyze security vulnerabilities"],
      ["Network Security", "Configure firewall rules"],
      ["Incident Response", "Simulate security incident"],
      ["Compliance & Reporting", "Create security report"]
    ],
    "cloud_engineer": [
      ["AWS/Cloud basics", "Deploy a simple application"],
      ["Infrastructure as Code", "Create Terraform templates"],
      ["Monitoring & Logging", "Set up monitoring dashboard"],
      ["DevOps & CI/CD", "Create deployment pipeline"]
    ],
    "machine_learning_engineer": [
      ["Python & Data Science", "Clean and analyze dataset"],
      ["ML Algorithms", "Build a simple ML model"],
      ["Model Training & Evaluation", "Train and test model"],
      ["Deployment & Production", "Deploy model to production"]
    ],
    "devops_engineer": [
      ["Docker & Containers", "Containerize an application"],
      ["Kubernetes & Orchestration", "Deploy to Kubernetes"],
      ["CI/CD Pipelines", "Create automated pipeline"],
      ["Monitoring & Alerting", "Set up monitoring system"]
    ]
  };

  // Normalize role title for lookup
  const normalizedRole = roleTitle.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');

  // Find matching role or use defaultTopics
  let roleKey = Object.keys(baseTopics).find(key => 
    normalizedRole.includes(key) || key.includes(normalizedRole)
  );

  if (!roleKey) {
    // Try partial matching
    if (normalizedRole.includes('frontend') || normalizedRole.includes('react')) {
      roleKey = 'frontend_developer';
    } else if (normalizedRole.includes('data') || normalizedRole.includes('analyst')) {
      roleKey = 'data_analyst';
    } else if (normalizedRole.includes('ui') || normalizedRole.includes('ux') || normalizedRole.includes('design')) {
      roleKey = 'uiux_designer';
    } else if (normalizedRole.includes('backend') || normalizedRole.includes('api')) {
      roleKey = 'backend_developer';
    } else if (normalizedRole.includes('mobile') || normalizedRole.includes('app')) {
      roleKey = 'mobile_developer';
    } else if (normalizedRole.includes('product') || normalizedRole.includes('manager')) {
      roleKey = 'product_manager';
    } else if (normalizedRole.includes('security') || normalizedRole.includes('cyber')) {
      roleKey = 'cybersecurity_analyst';
    } else if (normalizedRole.includes('cloud') || normalizedRole.includes('aws')) {
      roleKey = 'cloud_engineer';
    } else if (normalizedRole.includes('machine') || normalizedRole.includes('ml') || normalizedRole.includes('ai')) {
      roleKey = 'machine_learning_engineer';
    } else if (normalizedRole.includes('devops') || normalizedRole.includes('deployment')) {
      roleKey = 'devops_engineer';
    }
  }

  const defaultTopics = baseTopics[roleKey] || [
    ["Core concept 1", "Hands-on practice 1"],
    ["Core concept 2", "Hands-on practice 2"],
    ["Core concept 3", "Hands-on practice 3"],
    ["Capstone project", "Final deliverable"]
  ];

  const weeks = defaultTopics.map((w, idx) => ({
    week: idx + 1,
    topics: [w[0]],
    practice: [w[1]],
    assessment: `Short checklist and 5 quick quiz questions for week ${idx + 1}`,
    project: idx === 3 ? `Capstone project for ${roleTitle}` : `Mini project for week ${idx + 1}`
  }));

  return { weeks };
}

function buildDeterministicWhy(roleTitle, overlapSkills, gapSkills) {
  const overlap = overlapSkills.length ? overlapSkills.slice(0, 4).join(', ') : 'foundational skills';
  const gaps = gapSkills.length ? gapSkills.slice(0, 3).join(', ') : 'no critical gaps';
  return `You match ${roleTitle} thanks to ${overlap}. To improve fit, work on ${gaps}.`;
}

function buildUserVector(skills) {
  const vec = {};
  skills.forEach(s => { 
    vec[s.toLowerCase().trim()] = 1.0; 
  });
  return vec;
}

function buildRoleVector(role) {
  const vec = {};
  if (role.skills && Array.isArray(role.skills)) {
    role.skills.forEach(s => { 
      const skillName = typeof s === 'string' ? s : s.name;
      const weight = typeof s === 'object' ? (s.weight || 1.0) : 1.0;
      vec[skillName.toLowerCase()] = weight; 
    });
  }
  return vec;
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function calculateFitScore(userSkills, roleSkills) {
  const userVector = buildUserVector(userSkills);
  const roleVector = buildRoleVector({ skills: roleSkills });
  
  const cosine = cosineSimilarity(userVector, roleVector);
  
  // Calculate overlap ratio
  const userSkillSet = new Set(userSkills.map(s => s.toLowerCase().trim()));
  const roleSkillSet = new Set(roleSkills.map(s => 
    typeof s === 'string' ? s.toLowerCase().trim() : s.name.toLowerCase().trim()
  ));
  
  const intersection = new Set([...userSkillSet].filter(x => roleSkillSet.has(x)));
  const overlapRatio = roleSkillSet.size > 0 ? intersection.size / roleSkillSet.size : 0;
  
  // Weighted score: 60% cosine similarity, 40% overlap ratio
  const fitScore = Math.round((0.6 * cosine + 0.4 * overlapRatio) * 100);
  
  return Math.max(0, Math.min(100, fitScore));
}

function getOverlapAndGapSkills(userSkills, roleSkills) {
  const userSkillSet = new Set(userSkills.map(s => s.toLowerCase().trim()));
  const roleSkillSet = new Set(roleSkills.map(s => 
    typeof s === 'string' ? s.toLowerCase().trim() : s.name.toLowerCase().trim()
  ));
  
  const overlapSkills = [...userSkillSet].filter(skill => roleSkillSet.has(skill));
  const gapSkills = [...roleSkillSet].filter(skill => !userSkillSet.has(skill));
  
  return {
    overlapSkills: overlapSkills.slice(0, 6), // Limit to 6 skills
    gapSkills: gapSkills.slice(0, 6)
  };
}

module.exports = { 
  deterministicPlanForRole,
  buildDeterministicWhy,
  buildUserVector,
  buildRoleVector,
  cosineSimilarity,
  calculateFitScore,
  getOverlapAndGapSkills
};
