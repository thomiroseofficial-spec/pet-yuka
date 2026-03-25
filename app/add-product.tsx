import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { colors, spacing, radius } from '@/lib/theme';
import { scoreProduct } from '@/lib/api';
import { ScoringResult } from '@/lib/types';
import { ScoreDonut } from '@/components/ScoreDonut';
import { FrameworkBar } from '@/components/FrameworkBar';
import { IngredientList } from '@/components/IngredientList';

type Step = 'input' | 'scoring' | 'result';

export default function AddProductScreen() {
  const [step, setStep] = useState<Step>('input');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [scores, setScores] = useState<ScoringResult[]>([]);

  const parseIngredients = (text: string): string[] =>
    text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleEvaluate = async () => {
    const ingredients = parseIngredients(ingredientsText);
    if (ingredients.length === 0) {
      Alert.alert('No ingredients', 'Please enter at least one ingredient.');
      return;
    }

    setStep('scoring');
    try {
      const results = await scoreProduct(ingredients);
      setScores(results);
      setStep('result');
    } catch {
      Alert.alert('Error', 'Failed to evaluate. Please try again.');
      setStep('input');
    }
  };

  const primary = scores[0];
  const others = scores.slice(1);

  return (
    <>
      <Stack.Screen
        options={{
          title: step === 'result' ? productName || 'Results' : 'Add Product',
          headerStyle: { backgroundColor: colors.surfaceElevated },
          headerTintColor: colors.primary,
        }}
      />

      {step === 'input' && (
        <ScrollView style={styles.container} contentContainerStyle={styles.form}>
          <Text style={styles.sectionTitle}>Product Info</Text>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Zesty Paws Chicken Bites"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Zesty Paws"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Ingredients</Text>
          <Text style={styles.helpText}>
            Enter ingredients from the label, separated by commas or one per line.
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={ingredientsText}
            onChangeText={setIngredientsText}
            placeholder={'chicken breast, sweet potato, salmon oil, BHA...'}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.preview}>
            <Text style={styles.previewLabel}>
              {parseIngredients(ingredientsText).length} ingredients detected
            </Text>
          </View>

          <Pressable
            style={[styles.evalButton, !ingredientsText.trim() && styles.evalButtonDisabled]}
            onPress={handleEvaluate}
            disabled={!ingredientsText.trim()}
          >
            <Text style={styles.evalButtonText}>Evaluate Now</Text>
          </Pressable>
        </ScrollView>
      )}

      {step === 'scoring' && (
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.loadingText}>Evaluating ingredients...</Text>
          <Text style={styles.loadingSubtext}>Checking against all frameworks</Text>
        </View>
      )}

      {step === 'result' && primary && (
        <ScrollView style={styles.container} contentContainerStyle={styles.resultContent}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{productName || 'Untitled Product'}</Text>
            <Text style={styles.brandName}>{brand}</Text>
          </View>

          <ScoreDonut score={primary.score} frameworkName={primary.framework_name} />

          {others.length > 0 && (
            <View style={styles.othersSection}>
              <Text style={styles.otherLabel}>Other Frameworks</Text>
              {others.map((s) => (
                <FrameworkBar key={s.framework_id} name={s.framework_name} score={s.score} />
              ))}
            </View>
          )}

          {primary.ingredients.length > 0 && (
            <IngredientList ingredients={primary.ingredients} collapsed={false} />
          )}

          <Pressable style={styles.newScanBtn} onPress={() => router.back()}>
            <Text style={styles.newScanText}>Scan Another Product</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            Ratings are based on each framework's criteria and do not represent Pet Yuka's official opinion.
          </Text>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { alignItems: 'center', justifyContent: 'center' },
  form: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12, fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: { height: 120, paddingTop: 12 },
  helpText: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  preview: { marginTop: spacing.sm, marginBottom: spacing.lg },
  previewLabel: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  evalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14, borderRadius: radius.md,
    alignItems: 'center',
  },
  evalButtonDisabled: { opacity: 0.4 },
  evalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadingText: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  loadingSubtext: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  resultContent: { paddingBottom: spacing['3xl'] },
  productHeader: {
    paddingHorizontal: spacing.lg - 4, paddingTop: spacing.md, paddingBottom: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
  },
  productName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  brandName: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  othersSection: { paddingHorizontal: spacing.lg - 4, paddingVertical: spacing.md },
  otherLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm },
  newScanBtn: {
    marginHorizontal: spacing.lg, marginTop: spacing.lg,
    paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center',
  },
  newScanText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  disclaimer: {
    fontSize: 11, color: colors.textMuted, textAlign: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg,
  },
});
