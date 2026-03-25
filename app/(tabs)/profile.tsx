import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/lib/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>Free tier</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>My Frameworks</Text>
        <Text style={styles.value}>Dr. Kim's Vet Standard</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Scans this month</Text>
        <Text style={styles.value}>0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  section: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
});
