import { PlanSchema } from '../schema.js';

test('PlanSchema accepts valid 4-week plan', () => {
  const plan = {
    weeks: [1,2,3,4].map(week => ({
      week,
      topics: ['Topic A', 'Topic B'],
      practice: ['Practice A'],
      assessment: 'Quiz',
      project: 'Mini project'
    }))
  };
  const result = PlanSchema.safeParse(plan);
  expect(result.success).toBe(true);
});

test('PlanSchema rejects non-4-week plan', () => {
  const badPlan = {
    weeks: [{ week: 1, topics: ['A'], practice: ['P'], assessment: 'A', project: 'P' }]
  };
  const result = PlanSchema.safeParse(badPlan);
  expect(result.success).toBe(false);
});


