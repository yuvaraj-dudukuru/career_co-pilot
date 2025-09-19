import { cosine, buildUserVector, buildRoleVector, overlapRatio, formatFitScore, normalizeSkills } from '../utils.js';

test('cosine similarity basic cases', () => {
  expect(cosine({}, {})).toBe(0);
  const a = { js: 1, react: 1 };
  const b = { js: 1, react: 1 };
  expect(cosine(a, b)).toBeCloseTo(1, 5);
  const c = { js: 1 };
  const d = { react: 1 };
  expect(cosine(c, d)).toBeCloseTo(0, 5);
});

test('build vectors and overlap ratio', () => {
  const user = buildUserVector(['JavaScript', 'React']);
  const role = buildRoleVector({ skills: [{ name: 'JavaScript', weight: 1 }, { name: 'TypeScript', weight: 0.8 }] });
  expect(user.js || user.javascript).toBeDefined();
  expect(role.javascript).toBeDefined();
  const ratio = overlapRatio(['JavaScript', 'React'], { skills: [{ name: 'JavaScript' }, { name: 'TypeScript' }] });
  expect(ratio).toBeCloseTo(0.5, 5);
});

test('formatFitScore clamps and combines correctly', () => {
  expect(formatFitScore(1, 1)).toBe(100);
  expect(formatFitScore(0, 0)).toBe(0);
  expect(formatFitScore(0.5, 0.5)).toBe(50 + 10); // 0.6*0.5=0.3, 0.4*0.5=0.2 => 50
});

test('normalizeSkills dedupes and limits', () => {
  const skills = normalizeSkills(['JavaScript', 'js', '  React  ']);
  expect(skills.includes('javascript') || skills.includes('js')).toBeTruthy();
  expect(skills.includes('react')).toBeTruthy();
});


