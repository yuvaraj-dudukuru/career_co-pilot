/**
 * Simple test script for validation module
 * Run with: node test-validation.js
 */

import { 
  validatePlan, 
  validateProfile
} from './validation.js';

console.log('🧪 Testing Validation Module...\n');

// Test 1: Valid plan
console.log('Test 1: Valid plan');
const validPlan = {
  recommendations: [{
    title: "Data Analyst",
    fitScore: 85,
    why: "You have strong analytical skills",
    overlapSkills: ["Python", "SQL"],
    gapSkills: ["Tableau", "Statistics"],
    plan: {
      weeks: [
        { week: 1, topics: ["SQL Basics"], practice: ["Write queries"], assessment: "Quiz", project: "Database project" },
        { week: 2, topics: ["Python"], practice: ["Data analysis"], assessment: "Quiz", project: "Analysis project" },
        { week: 3, topics: ["Visualization"], practice: ["Create charts"], assessment: "Quiz", project: "Dashboard project" },
        { week: 4, topics: ["Statistics"], practice: ["Statistical analysis"], assessment: "Quiz", project: "Final project" }
      ]
    }
  }]
};
const result1 = validatePlan(validPlan);
console.log('✅ Valid plan:', result1.isValid ? 'PASS' : 'FAIL');
if (!result1.isValid) console.log('Error:', result1.error);

// Test 2: Invalid plan (missing weeks)
console.log('\nTest 2: Invalid plan (missing weeks)');
const invalidPlan = {
  recommendations: [{
    title: "Test Role",
    fitScore: 85,
    why: "Test",
    plan: { weeks: [] } // Invalid: empty weeks
  }]
};
const result2 = validatePlan(invalidPlan);
console.log('✅ Invalid plan detected:', !result2.isValid ? 'PASS' : 'FAIL');
if (!result2.isValid) console.log('Error:', result2.error);

// Test 3: Valid profile
console.log('\nTest 3: Valid profile');
const validProfile = {
  name: "John Doe",
  education: "Bachelor's Degree",
  skills: ["JavaScript", "Python"],
  interests: ["web development", "data science"],
  weeklyTime: 10,
  budget: "free",
  language: "en"
};
const result3 = validateProfile(validProfile);
console.log('✅ Valid profile:', result3.isValid ? 'PASS' : 'FAIL');
if (!result3.isValid) console.log('Error:', result3.error);

// Test 4: Invalid profile (missing name)
console.log('\nTest 4: Invalid profile (missing name)');
const invalidProfile = {
  education: "Bachelor's Degree",
  skills: ["JavaScript"],
  interests: ["web development"],
  weeklyTime: 10,
  budget: "free",
  language: "en"
};
const result4 = validateProfile(invalidProfile);
console.log('✅ Invalid profile detected:', !result4.isValid ? 'PASS' : 'FAIL');
if (!result4.isValid) console.log('Error:', result4.error);

console.log('\n🎉 Validation tests completed!');
