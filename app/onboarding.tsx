import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { router, Stack } from 'expo-router';
import { colors, spacing, radius } from '@/lib/theme';
import { Framework } from '@/lib/types';
import { getFrameworks } from '@/lib/api';

export default function OnboardingScreen() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFrameworks().then(setFrameworks);
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    // TODO: save selected frameworks to Supabase
    router.replace('/(tabs)');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose your evaluation{'\n'}frameworks</Text>
          <Text style={styles.subtitle}>
            Pick the experts whose standards you trust. You can change this anytime.
          </Text>
        </View>

        <FlatList
          data={frameworks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
            return (
              <Pressable
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => toggle(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>{'✓'}</Text>}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.frameworkName}>{item.name}</Text>
                    <Text style={styles.author}>{item.author}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                    <Text style={styles.followers}>
                      {item.follower_count.toLocaleString()} followers
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />

        <View style={styles.footer}>
          <Pressable
            style={[styles.continueBtn, selected.size === 0 && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={selected.size === 0}
          >
            <Text style={styles.continueBtnText}>
              {selected.size > 0 ? `Continue with ${selected.size} framework${selected.size > 1 ? 's' : ''}` : 'Select at least one'}
            </Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing['3xl'], paddingBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, lineHeight: 32 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.md },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '33',
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  checkbox: {
    width: 24, height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cardContent: { flex: 1 },
  frameworkName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  author: { fontSize: 13, color: colors.primary, marginTop: 2 },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  followers: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingTop: spacing.sm },
  skipText: { fontSize: 14, color: colors.textMuted },
});
