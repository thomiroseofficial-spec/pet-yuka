import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radius } from '@/lib/theme';
import { searchProducts } from '@/lib/api';
import { Product } from '@/lib/types';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const products = await searchProducts(text.trim());
    setResults(products);
    setSearched(true);
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={handleSearch}
        placeholder="Search products by name or barcode..."
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
      />

      {results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.resultCard}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultBrand}>{item.brand}</Text>
            </Pressable>
          )}
        />
      ) : searched ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>Try a different search or add a new product</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/add-product')}
          >
            <Text style={styles.addButtonText}>Add Product Manually</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Search for a product</Text>
          <Text style={styles.emptyText}>
            Enter a product name or barcode number to find ratings
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.md },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: 12, fontSize: 14, color: colors.textPrimary,
  },
  list: { paddingTop: spacing.sm, gap: spacing.sm },
  resultCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md,
  },
  resultName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  resultBrand: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: spacing.xl },
  addButton: {
    marginTop: spacing.lg, paddingVertical: 12, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary,
  },
  addButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
