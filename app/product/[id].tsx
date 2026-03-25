import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ScoreDonut } from '@/components/ScoreDonut';
import { FrameworkBar } from '@/components/FrameworkBar';
import { IngredientList } from '@/components/IngredientList';
import { colors, spacing } from '@/lib/theme';
import { ScoringResult, Product } from '@/lib/types';
import { getProductByBarcode, getProductIngredients, scoreProduct } from '@/lib/api';
import { mockProduct, getMockScores } from '@/lib/mock-data';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [scores, setScores] = useState<ScoringResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    setLoading(true);

    // Demo mode
    if (id === 'demo') {
      setProduct(mockProduct);
      setScores(getMockScores());
      setLoading(false);
      return;
    }

    // Try barcode lookup
    const found = await getProductByBarcode(id || '');
    if (!found) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProduct(found);
    const ingredients = await getProductIngredients(found.id);
    const results = await scoreProduct(ingredients);
    setScores(results);
    setLoading(false);
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: colors.surfaceElevated }, headerTintColor: colors.primary }} />
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Evaluating product...</Text>
        </View>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Stack.Screen options={{ title: 'Not Found', headerStyle: { backgroundColor: colors.surfaceElevated }, headerTintColor: colors.primary }} />
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.notFoundTitle}>Product not in database yet</Text>
          <Text style={styles.notFoundText}>
            This product hasn't been added yet. Help the community by adding it!
          </Text>
          <Pressable style={styles.addBtn} onPress={() => router.replace('/add-product')}>
            <Text style={styles.addBtnText}>Add Ingredients Manually</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const primary = scores[0];
  const others = scores.slice(1);

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.surfaceElevated },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product?.name}</Text>
          <Text style={styles.brandName}>{product?.brand}</Text>
        </View>

        {primary && <ScoreDonut score={primary.score} frameworkName={primary.framework_name} />}

        {others.length > 0 && (
          <View style={styles.othersSection}>
            <Text style={styles.sectionLabel}>Other Frameworks</Text>
            {others.map((s) => (
              <FrameworkBar key={s.framework_id} name={s.framework_name} score={s.score} />
            ))}
          </View>
        )}

        {primary && primary.ingredients.length > 0 && (
          <IngredientList ingredients={primary.ingredients} />
        )}

        <Text style={styles.disclaimer}>
          This rating is based on {primary?.framework_name}'s criteria and does not represent Pet Yuka's official opinion.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  content: { paddingBottom: spacing['3xl'] },
  loadingText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  notFoundTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  notFoundText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  addBtn: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: spacing.xl, borderRadius: 8 },
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  productHeader: {
    paddingHorizontal: spacing.lg - 4, paddingTop: spacing.md, paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.surfaceElevated,
  },
  productName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  brandName: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  othersSection: { paddingHorizontal: spacing.lg - 4, paddingVertical: spacing.md },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm },
  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
});
