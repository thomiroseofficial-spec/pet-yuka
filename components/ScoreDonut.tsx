import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getScoreColor, getScoreLabel } from '@/lib/types';
import { colors, spacing, radius } from '@/lib/theme';

interface ScoreDonutProps {
  score: number;
  frameworkName: string;
  size?: number;
}

export function ScoreDonut({ score, frameworkName, size = 140 }: ScoreDonutProps) {
  const scoreColor = getScoreColor(score);
  const label = getScoreLabel(score);
  const borderWidth = 6;

  return (
    <View style={styles.container} accessible accessibilityLabel={`${frameworkName} 기준 ${score}점, ${label}`}>
      <View
        style={[
          styles.donut,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: scoreColor,
          },
        ]}
      >
        <Text style={[styles.scoreNumber, { color: colors.textPrimary }]}>{score}</Text>
        <Text style={[styles.scoreTotal, { color: colors.textMuted }]}>/100</Text>
      </View>
      <Text style={[styles.frameworkName, { color: colors.textSecondary }]}>{frameworkName}</Text>
      <View style={[styles.badge, { backgroundColor: scoreColor + '1A' }]}>
        <Text style={[styles.badgeText, { color: scoreColor }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  donut: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    lineHeight: 46,
  },
  scoreTotal: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  frameworkName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
