import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { colors, spacing, radius } from '@/lib/theme';
import { mockFrameworks } from '@/lib/mock-data';

export default function FrameworksScreen() {
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={mockFrameworks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.author}>{item.author}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.followers}>
            {item.follower_count.toLocaleString()} followers
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  author: { fontSize: 13, color: colors.primary, marginTop: 2 },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  followers: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
});
