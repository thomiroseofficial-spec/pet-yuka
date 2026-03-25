import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { IngredientScore } from '@/lib/types';
import { colors, spacing } from '@/lib/theme';

interface IngredientListProps {
  ingredients: IngredientScore[];
  collapsed?: boolean;
}

export function IngredientList({ ingredients, collapsed = true }: IngredientListProps) {
  const [expanded, setExpanded] = useState(!collapsed);

  // Show top 4 when collapsed, all when expanded
  const visible = expanded ? ingredients : ingredients.slice(0, 4);
  const hasMore = ingredients.length > 4;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Key Ingredients</Text>
      {visible.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={[styles.icon, item.score_impact >= 0 ? styles.good : styles.bad]}>
            {item.score_impact >= 0 ? '+' : '\u2212'}
          </Text>
          <Text style={styles.name} numberOfLines={1}>{item.ingredient}</Text>
          <Text
            style={[styles.impact, item.score_impact >= 0 ? styles.good : styles.bad]}
          >
            {item.score_impact >= 0 ? '+' : ''}{item.score_impact}
          </Text>
        </View>
      ))}
      {hasMore && !expanded && (
        <Pressable onPress={() => setExpanded(true)} style={styles.showMore}>
          <Text style={styles.showMoreText}>
            Show all {ingredients.length} ingredients
          </Text>
        </Pressable>
      )}
      {hasMore && expanded && (
        <Pressable onPress={() => setExpanded(false)} style={styles.showMore}>
          <Text style={styles.showMoreText}>Show less</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  impact: {
    fontSize: 12,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  good: { color: colors.score.good },
  bad: { color: colors.score.bad },
  showMore: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
