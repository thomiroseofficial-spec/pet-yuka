// Pet Yuka — API layer (Supabase queries)
// For MVP: falls back to mock data when Supabase is not configured.

import { supabase } from './supabase';
import { Framework, Criteria, Product, ScoringResult } from './types';
import { calculateScore } from './scoring';
import { mockFrameworks, mockCriteria, mockProduct, mockIngredients, getMockScores } from './mock-data';

const USE_MOCK = !process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co';

// ============================================================
// Frameworks
// ============================================================

export async function getFrameworks(): Promise<Framework[]> {
  if (USE_MOCK) return mockFrameworks;

  try {
    const { data, error } = await supabase
      .from('frameworks')
      .select('*')
      .eq('status', 'active')
      .order('follower_count', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase frameworks query failed, using mock data:', error?.message);
      return mockFrameworks;
    }
    return data;
  } catch {
    return mockFrameworks;
  }
}

export async function getCriteria(frameworkId: string): Promise<Criteria[]> {
  if (USE_MOCK) return mockCriteria[frameworkId] || [];

  try {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('framework_id', frameworkId);

    if (error || !data) return mockCriteria[frameworkId] || [];
    return data;
  } catch {
    return mockCriteria[frameworkId] || [];
  }
}

// ============================================================
// Products
// ============================================================

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  if (USE_MOCK) {
    return barcode === mockProduct.barcode ? mockProduct : null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (error?.code === 'PGRST116') return null; // not found
  if (error) throw error;
  return data;
}

export async function getProductIngredients(productId: string): Promise<string[]> {
  if (USE_MOCK) return mockIngredients;

  const { data, error } = await supabase
    .from('product_ingredients')
    .select('ingredients(name)')
    .eq('product_id', productId)
    .order('position', { ascending: true });

  if (error) throw error;
  return (data || []).map((row: any) => row.ingredients?.name).filter(Boolean);
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (USE_MOCK) {
    const q = query.toLowerCase();
    return [mockProduct].filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.barcode === query
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,barcode.eq.${query}`)
    .limit(20);

  if (error) throw error;
  return data || [];
}

// ============================================================
// Scoring
// ============================================================

export async function scoreProduct(
  ingredientNames: string[],
  frameworks?: Framework[]
): Promise<ScoringResult[]> {
  if (USE_MOCK) return getMockScores();

  const fws = frameworks || (await getFrameworks());
  const results: ScoringResult[] = [];

  for (const fw of fws) {
    const criteria = await getCriteria(fw.id);
    results.push(calculateScore(ingredientNames, criteria, fw.id, fw.name));
  }

  return results;
}

// ============================================================
// Product creation (user-contributed via OCR/manual)
// ============================================================

export async function createProduct(
  name: string,
  brand: string,
  barcode: string | null,
  ingredientNames: string[],
  source: 'ocr' | 'manual'
): Promise<Product> {
  if (USE_MOCK) {
    return { ...mockProduct, id: 'new-' + Date.now(), name, brand, barcode, source };
  }

  // 1. Insert product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({ name, brand, barcode, source })
    .select()
    .single();

  if (productError) throw productError;

  // 2. Upsert ingredients and link to product
  for (let i = 0; i < ingredientNames.length; i++) {
    const ingredientName = ingredientNames[i].trim().toLowerCase();
    if (!ingredientName) continue;

    // Get or create ingredient
    let { data: ingredient } = await supabase
      .from('ingredients')
      .select('id')
      .eq('name', ingredientName)
      .single();

    if (!ingredient) {
      const { data: newIngredient, error } = await supabase
        .from('ingredients')
        .insert({ name: ingredientName })
        .select('id')
        .single();
      if (error) throw error;
      ingredient = newIngredient;
    }

    // Link to product
    await supabase
      .from('product_ingredients')
      .insert({ product_id: product.id, ingredient_id: ingredient!.id, position: i + 1 });
  }

  return product;
}

// ============================================================
// User frameworks
// ============================================================

export async function getUserFrameworks(): Promise<string[]> {
  if (USE_MOCK) return [mockFrameworks[0].id];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_frameworks')
    .select('framework_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return (data || []).map((row) => row.framework_id);
}

export async function followFramework(frameworkId: string, isPrimary = false): Promise<void> {
  if (USE_MOCK) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_frameworks')
    .upsert({ user_id: user.id, framework_id: frameworkId, is_primary: isPrimary });

  // Increment follower count
  await supabase.rpc('increment_follower_count', { fw_id: frameworkId });
}

export async function recordScan(productId: string): Promise<void> {
  if (USE_MOCK) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('scan_history')
    .insert({ user_id: user.id, product_id: productId });
}
