// Pet Yuka — Scoring Engine
// Server-side in production (Edge Function), but logic is pure functions for testability.
//
// SCORING FLOW:
//   product.ingredients → match against framework.criteria
//   → base_score (50) + Σ(matched score_impacts)
//   → normalize to 0-100
//   → clamp(0, 100)
//
// RULE PRECEDENCE: blocklist > cap_by_percentage > allowlist > prefer
// Same ingredient with multiple rules → highest priority rule wins.

import { Criteria, CriteriaRule, IngredientScore, ScoringResult, getScoreLabel } from './types';

const RULE_PRIORITY: Record<CriteriaRule, number> = {
  blocklist: 4,
  cap_by_percentage: 3,
  allowlist: 2,
  prefer: 1,
};

const BASE_SCORE = 50;

/**
 * Match a product ingredient name against a criteria ingredient name.
 * Case-insensitive, trims whitespace. Also checks aliases.
 */
export function matchIngredient(
  productIngredient: string,
  criteriaIngredient: string,
  aliases?: string[]
): boolean {
  const normalize = (s: string) => s.toLowerCase().trim();
  const normalized = normalize(productIngredient);
  const target = normalize(criteriaIngredient);

  if (normalized === target) return true;
  if (aliases?.some((alias) => normalize(alias) === normalized)) return true;

  return false;
}

/**
 * For a single ingredient, find the highest-priority matching criteria.
 * If multiple criteria match the same ingredient, only the one with the
 * highest rule priority is applied.
 */
export function findMatchingCriteria(
  ingredientName: string,
  criteria: Criteria[]
): Criteria | null {
  const matches = criteria.filter((c) =>
    matchIngredient(ingredientName, c.ingredient)
  );

  if (matches.length === 0) return null;

  // Sort by rule priority descending, take highest
  matches.sort((a, b) => RULE_PRIORITY[b.rule] - RULE_PRIORITY[a.rule]);
  return matches[0];
}

/**
 * Calculate raw score for a product against a framework's criteria.
 * Returns the raw (unnormalized) score and per-ingredient breakdown.
 */
export function calculateRawScore(
  ingredientNames: string[],
  criteria: Criteria[]
): { rawScore: number; ingredientScores: IngredientScore[] } {
  const ingredientScores: IngredientScore[] = [];
  let totalImpact = 0;

  for (const name of ingredientNames) {
    const match = findMatchingCriteria(name, criteria);
    if (match) {
      ingredientScores.push({
        ingredient: name,
        rule: match.rule,
        score_impact: match.score_impact,
        reason: match.reason,
      });
      totalImpact += match.score_impact;
    }
  }

  const rawScore = BASE_SCORE + totalImpact;
  return { rawScore, ingredientScores };
}

/**
 * Normalize a raw score to 0-100 range.
 * Uses the framework's theoretical min/max to ensure scores are
 * comparable across frameworks.
 *
 * Theoretical range: base_score + sum(all negative impacts) to base_score + sum(all positive impacts)
 * Normalized: map this range to 0-100.
 */
export function normalizeScore(
  rawScore: number,
  criteria: Criteria[]
): number {
  const negativeSum = criteria
    .filter((c) => c.score_impact < 0)
    .reduce((sum, c) => sum + c.score_impact, 0);
  const positiveSum = criteria
    .filter((c) => c.score_impact > 0)
    .reduce((sum, c) => sum + c.score_impact, 0);

  const theoreticalMin = BASE_SCORE + negativeSum;
  const theoreticalMax = BASE_SCORE + positiveSum;

  // Edge case: all criteria have zero impact, or no criteria
  if (theoreticalMax === theoreticalMin) {
    return Math.max(0, Math.min(100, rawScore));
  }

  const normalized = ((rawScore - theoreticalMin) / (theoreticalMax - theoreticalMin)) * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/**
 * Calculate the full scoring result for a product against a framework.
 * This is the main entry point.
 */
export function calculateScore(
  ingredientNames: string[],
  criteria: Criteria[],
  frameworkId: string,
  frameworkName: string
): ScoringResult {
  // Handle empty criteria
  if (criteria.length === 0) {
    return {
      framework_id: frameworkId,
      framework_name: frameworkName,
      score: BASE_SCORE,
      label: getScoreLabel(BASE_SCORE),
      ingredients: [],
    };
  }

  const { rawScore, ingredientScores } = calculateRawScore(ingredientNames, criteria);
  const normalizedScore = normalizeScore(rawScore, criteria);

  // Sort ingredients: negative impacts first (most impactful), then positive
  ingredientScores.sort((a, b) => a.score_impact - b.score_impact);

  return {
    framework_id: frameworkId,
    framework_name: frameworkName,
    score: normalizedScore,
    label: getScoreLabel(normalizedScore),
    ingredients: ingredientScores,
  };
}
