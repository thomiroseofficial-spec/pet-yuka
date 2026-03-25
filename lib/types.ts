// Pet Yuka — Core Types

export type FrameworkStatus = 'draft' | 'active' | 'deprecated';
export type CriteriaRule = 'blocklist' | 'allowlist' | 'cap_by_percentage' | 'prefer';
export type ScoreLabel = 'GOOD' | 'OK' | 'POOR' | 'BAD';
export type UserTier = 'free' | 'premium';

export interface Framework {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  status: FrameworkStatus;
  follower_count: number;
  created_at: string;
}

export interface Criteria {
  id: string;
  framework_id: string;
  ingredient: string;
  rule: CriteriaRule;
  score_impact: number; // -100 to +100
  reason: string;
}

export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  brand: string;
  image_url: string | null;
  source: 'barcode' | 'ocr' | 'manual';
  verified: boolean;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  category: string | null;
}

export interface ProductIngredient {
  product_id: string;
  ingredient_id: string;
  position: number; // weight order
}

export interface Score {
  product_id: string;
  framework_id: string;
  score: number; // 0-100
  computed_at: string;
  framework_version: string;
}

export interface IngredientScore {
  ingredient: string;
  rule: CriteriaRule;
  score_impact: number;
  reason: string;
}

export interface ScoringResult {
  framework_id: string;
  framework_name: string;
  score: number; // 0-100, normalized
  label: ScoreLabel;
  ingredients: IngredientScore[];
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 80) return 'GOOD';
  if (score >= 60) return 'OK';
  if (score >= 40) return 'POOR';
  return 'BAD';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#43A047';
  if (score >= 60) return '#7CB342';
  if (score >= 40) return '#FB8C00';
  return '#E53935';
}
