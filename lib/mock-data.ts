// Mock data for development — replace with Supabase queries
import { Framework, Criteria, Product, ScoringResult } from './types';
import { calculateScore } from './scoring';

export const mockFrameworks: Framework[] = [
  {
    id: 'f1',
    name: "Dr. Kim's Vet Standard",
    author: 'Dr. Kim, DVM',
    description: 'Evidence-based pet nutrition',
    version: '1.0.0',
    status: 'active',
    follower_count: 12400,
    created_at: '2026-01-01',
  },
  {
    id: 'f2',
    name: 'BARF Diet Community',
    author: 'BARF Community',
    description: 'Raw feeding philosophy',
    version: '1.0.0',
    status: 'active',
    follower_count: 8200,
    created_at: '2026-01-01',
  },
  {
    id: 'f3',
    name: 'PetNutrition (YT)',
    author: 'PetNutrition Channel',
    description: 'Popular pet food reviewer',
    version: '1.0.0',
    status: 'active',
    follower_count: 5100,
    created_at: '2026-01-01',
  },
];

export const mockCriteria: Record<string, Criteria[]> = {
  f1: [
    { id: 'c1', framework_id: 'f1', ingredient: 'chicken breast', rule: 'prefer', score_impact: 25, reason: 'High quality animal protein' },
    { id: 'c2', framework_id: 'f1', ingredient: 'sweet potato', rule: 'allowlist', score_impact: 15, reason: 'Good carbohydrate source' },
    { id: 'c3', framework_id: 'f1', ingredient: 'BHA', rule: 'blocklist', score_impact: -40, reason: 'Synthetic preservative with health concerns' },
    { id: 'c4', framework_id: 'f1', ingredient: 'propylene glycol', rule: 'blocklist', score_impact: -30, reason: 'Chemical additive unsafe for pets' },
    { id: 'c5', framework_id: 'f1', ingredient: 'salmon oil', rule: 'prefer', score_impact: 20, reason: 'Excellent omega-3 source' },
    { id: 'c6', framework_id: 'f1', ingredient: 'corn', rule: 'blocklist', score_impact: -15, reason: 'Common allergen, low nutritional value' },
    { id: 'c7', framework_id: 'f1', ingredient: 'chicken by-product', rule: 'blocklist', score_impact: -20, reason: 'Low quality protein source' },
  ],
  f2: [
    { id: 'c8', framework_id: 'f2', ingredient: 'chicken breast', rule: 'prefer', score_impact: 30, reason: 'Real meat protein' },
    { id: 'c9', framework_id: 'f2', ingredient: 'sweet potato', rule: 'blocklist', score_impact: -10, reason: 'Starch not ideal for raw diet' },
    { id: 'c10', framework_id: 'f2', ingredient: 'BHA', rule: 'blocklist', score_impact: -50, reason: 'Synthetic — completely unacceptable' },
    { id: 'c11', framework_id: 'f2', ingredient: 'bone meal', rule: 'prefer', score_impact: 25, reason: 'Essential for raw diet calcium' },
    { id: 'c12', framework_id: 'f2', ingredient: 'grain', rule: 'blocklist', score_impact: -30, reason: 'No grains in raw diet' },
  ],
  f3: [
    { id: 'c13', framework_id: 'f3', ingredient: 'chicken breast', rule: 'prefer', score_impact: 20, reason: 'Good protein source' },
    { id: 'c14', framework_id: 'f3', ingredient: 'BHA', rule: 'blocklist', score_impact: -35, reason: 'Avoid synthetic preservatives' },
    { id: 'c15', framework_id: 'f3', ingredient: 'sweet potato', rule: 'prefer', score_impact: 10, reason: 'Decent filler ingredient' },
    { id: 'c16', framework_id: 'f3', ingredient: 'salmon oil', rule: 'prefer', score_impact: 15, reason: 'Great for coat health' },
  ],
};

export const mockProduct: Product = {
  id: 'p1',
  barcode: '012345678901',
  name: 'Zesty Paws Chicken Bites',
  brand: 'Zesty Paws',
  image_url: null,
  source: 'barcode',
  verified: true,
  created_at: '2026-01-15',
};

export const mockIngredients = [
  'chicken breast',
  'sweet potato',
  'salmon oil',
  'BHA',
  'tapioca starch',
  'flaxseed',
];

export function getMockScores(): ScoringResult[] {
  return mockFrameworks.map((fw) =>
    calculateScore(mockIngredients, mockCriteria[fw.id] || [], fw.id, fw.name)
  );
}
