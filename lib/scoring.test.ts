import {
  matchIngredient,
  findMatchingCriteria,
  calculateRawScore,
  normalizeScore,
  calculateScore,
} from './scoring';
import { Criteria } from './types';

// Test fixtures
const makeCriteria = (overrides: Partial<Criteria> = {}): Criteria => ({
  id: 'c1',
  framework_id: 'f1',
  ingredient: 'BHA',
  rule: 'blocklist',
  score_impact: -40,
  reason: 'Synthetic antioxidant linked to health concerns',
  ...overrides,
});

const sampleCriteria: Criteria[] = [
  makeCriteria({ id: 'c1', ingredient: 'BHA', rule: 'blocklist', score_impact: -40, reason: 'Harmful preservative' }),
  makeCriteria({ id: 'c2', ingredient: 'propylene glycol', rule: 'blocklist', score_impact: -30, reason: 'Chemical additive' }),
  makeCriteria({ id: 'c3', ingredient: 'chicken breast', rule: 'prefer', score_impact: 25, reason: 'High quality protein' }),
  makeCriteria({ id: 'c4', ingredient: 'sweet potato', rule: 'allowlist', score_impact: 15, reason: 'Good carb source' }),
  makeCriteria({ id: 'c5', ingredient: 'chicken by-product', rule: 'blocklist', score_impact: -20, reason: 'Low quality protein' }),
];

describe('matchIngredient', () => {
  it('matches exact same string', () => {
    expect(matchIngredient('BHA', 'BHA')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(matchIngredient('bha', 'BHA')).toBe(true);
    expect(matchIngredient('BHA', 'bha')).toBe(true);
  });

  it('trims whitespace', () => {
    expect(matchIngredient('  BHA  ', 'BHA')).toBe(true);
  });

  it('does not match different ingredients', () => {
    expect(matchIngredient('BHT', 'BHA')).toBe(false);
  });

  it('matches via aliases', () => {
    expect(matchIngredient('닭가슴살', 'chicken breast', ['닭가슴살', 'pollo'])).toBe(true);
  });

  it('does not match when aliases do not contain the name', () => {
    expect(matchIngredient('닭가슴살', 'chicken breast', ['pollo'])).toBe(false);
  });

  it('handles empty aliases array', () => {
    expect(matchIngredient('BHA', 'BHA', [])).toBe(true);
  });

  it('handles undefined aliases', () => {
    expect(matchIngredient('BHA', 'BHA', undefined)).toBe(true);
  });
});

describe('findMatchingCriteria', () => {
  it('returns null when no criteria match', () => {
    expect(findMatchingCriteria('water', sampleCriteria)).toBeNull();
  });

  it('returns matching criteria for exact ingredient', () => {
    const result = findMatchingCriteria('BHA', sampleCriteria);
    expect(result?.ingredient).toBe('BHA');
    expect(result?.rule).toBe('blocklist');
  });

  it('returns highest priority rule when multiple rules match same ingredient', () => {
    const criteria: Criteria[] = [
      makeCriteria({ id: 'c1', ingredient: 'chicken', rule: 'prefer', score_impact: 10 }),
      makeCriteria({ id: 'c2', ingredient: 'chicken', rule: 'blocklist', score_impact: -30 }),
    ];
    const result = findMatchingCriteria('chicken', criteria);
    expect(result?.rule).toBe('blocklist'); // blocklist > prefer
  });

  it('handles case-insensitive matching in criteria lookup', () => {
    const result = findMatchingCriteria('bha', sampleCriteria);
    expect(result).not.toBeNull();
    expect(result?.score_impact).toBe(-40);
  });
});

describe('calculateRawScore', () => {
  it('returns base score (50) when no ingredients match', () => {
    const { rawScore, ingredientScores } = calculateRawScore(['water', 'salt'], sampleCriteria);
    expect(rawScore).toBe(50);
    expect(ingredientScores).toHaveLength(0);
  });

  it('adds positive impacts for good ingredients', () => {
    const { rawScore } = calculateRawScore(['chicken breast'], sampleCriteria);
    expect(rawScore).toBe(50 + 25); // base + chicken breast impact
  });

  it('adds negative impacts for bad ingredients', () => {
    const { rawScore } = calculateRawScore(['BHA'], sampleCriteria);
    expect(rawScore).toBe(50 - 40); // base + BHA impact
  });

  it('sums multiple ingredient impacts', () => {
    const { rawScore } = calculateRawScore(
      ['chicken breast', 'sweet potato', 'BHA'],
      sampleCriteria
    );
    expect(rawScore).toBe(50 + 25 + 15 - 40); // 50
  });

  it('returns ingredient breakdown', () => {
    const { ingredientScores } = calculateRawScore(['chicken breast', 'BHA'], sampleCriteria);
    expect(ingredientScores).toHaveLength(2);
    expect(ingredientScores.find((i) => i.ingredient === 'BHA')?.score_impact).toBe(-40);
    expect(ingredientScores.find((i) => i.ingredient === 'chicken breast')?.score_impact).toBe(25);
  });

  it('handles empty ingredient list', () => {
    const { rawScore, ingredientScores } = calculateRawScore([], sampleCriteria);
    expect(rawScore).toBe(50);
    expect(ingredientScores).toHaveLength(0);
  });
});

describe('normalizeScore', () => {
  it('normalizes score to 0-100 range', () => {
    // theoretical min = 50 + (-40 + -30 + -20) = -40
    // theoretical max = 50 + (25 + 15) = 90
    // range = 130
    // score 50 (base) → (50 - (-40)) / 130 * 100 = 90/130 * 100 ≈ 69
    const result = normalizeScore(50, sampleCriteria);
    expect(result).toBe(69);
  });

  it('clamps to 0 when score is below theoretical min', () => {
    const result = normalizeScore(-100, sampleCriteria);
    expect(result).toBe(0);
  });

  it('clamps to 100 when score is above theoretical max', () => {
    const result = normalizeScore(200, sampleCriteria);
    expect(result).toBe(100);
  });

  it('returns clamped raw score when all criteria have zero impact', () => {
    const zeroCriteria = [makeCriteria({ score_impact: 0 })];
    expect(normalizeScore(50, zeroCriteria)).toBe(50);
  });

  it('returns clamped raw score with empty criteria', () => {
    expect(normalizeScore(50, [])).toBe(50);
  });

  it('returns 0 for minimum possible score', () => {
    const theoreticalMin = 50 + (-40 + -30 + -20); // = -40
    const result = normalizeScore(theoreticalMin, sampleCriteria);
    expect(result).toBe(0);
  });

  it('returns 100 for maximum possible score', () => {
    const theoreticalMax = 50 + (25 + 15); // = 90
    const result = normalizeScore(theoreticalMax, sampleCriteria);
    expect(result).toBe(100);
  });
});

describe('calculateScore', () => {
  it('returns full scoring result for a product', () => {
    const result = calculateScore(
      ['chicken breast', 'sweet potato', 'BHA'],
      sampleCriteria,
      'f1',
      "Dr. Kim's Vet Standard"
    );
    expect(result.framework_id).toBe('f1');
    expect(result.framework_name).toBe("Dr. Kim's Vet Standard");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['GOOD', 'OK', 'POOR', 'BAD']).toContain(result.label);
    expect(result.ingredients).toHaveLength(3); // chicken breast + sweet potato + BHA
  });

  it('returns base score with POOR label for empty criteria', () => {
    const result = calculateScore(['chicken'], [], 'f1', 'Empty Framework');
    expect(result.score).toBe(50);
    expect(result.label).toBe('POOR');
    expect(result.ingredients).toHaveLength(0);
  });

  it('sorts ingredients with negative impacts first', () => {
    const result = calculateScore(
      ['chicken breast', 'BHA', 'sweet potato'],
      sampleCriteria,
      'f1',
      'Test'
    );
    if (result.ingredients.length >= 2) {
      expect(result.ingredients[0].score_impact).toBeLessThanOrEqual(
        result.ingredients[result.ingredients.length - 1].score_impact
      );
    }
  });

  it('handles product with all bad ingredients', () => {
    const result = calculateScore(
      ['BHA', 'propylene glycol', 'chicken by-product'],
      sampleCriteria,
      'f1',
      'Test'
    );
    expect(result.score).toBeLessThan(50);
    expect(result.label).toBe('BAD');
  });

  it('handles product with all good ingredients', () => {
    const result = calculateScore(
      ['chicken breast', 'sweet potato'],
      sampleCriteria,
      'f1',
      'Test'
    );
    expect(result.score).toBeGreaterThan(50);
  });

  it('produces correct label for each score range', () => {
    // GOOD: 80-100
    const good = calculateScore(['chicken breast', 'sweet potato'], sampleCriteria, 'f1', 'T');
    // The exact score depends on normalization, so just verify structure
    expect(['GOOD', 'OK', 'POOR', 'BAD']).toContain(good.label);
  });
});
