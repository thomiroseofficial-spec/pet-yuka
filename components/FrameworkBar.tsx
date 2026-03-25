import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { getScoreColor } from '@/lib/types';
import { colors, spacing, radius } from '@/lib/theme';

interface FrameworkBarProps {
  name: string;
  score: number;
  onPress?: () => void;
}

export function FrameworkBar({ name, score, onPress }: FrameworkBarProps) {
  const scoreColor = getScoreColor(score);

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessible
      accessibilityLabel={`${name} 기준 ${score}점`}
      accessibilityRole="button"
    >
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: scoreColor }]} />
      </View>
      <Text style={styles.score}>{score}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    minHeight: 44, // touch target
  },
  name: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 120,
    flexShrink: 0,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  score: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    color: colors.textPrimary,
    width: 28,
    textAlign: 'right',
  },
});
