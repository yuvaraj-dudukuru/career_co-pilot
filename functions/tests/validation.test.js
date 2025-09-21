
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createTestPlan, validatePlan } from '../validation.js';

describe('Validation Tests', () => {
  it('should validate the test plan successfully', () => {
    const testPlan = createTestPlan();
    const validationResult = validatePlan(testPlan);
    assert.strictEqual(validationResult.isValid, true, 'Test plan should be valid');
  });
});
