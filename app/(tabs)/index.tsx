import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { colors, spacing, radius } from '@/lib/theme';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isWeb = Platform.OS === 'web';

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    router.push(`/product/${encodeURIComponent(result.data)}`);
    // Reset after navigation
    setTimeout(() => setScanned(false), 2000);
  };

  // Web fallback — no camera
  if (isWeb) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.placeholderText}>Camera Preview</Text>
          <Text style={styles.placeholderSub}>Barcode scanner requires a mobile device</Text>
        </View>
        <View style={styles.bottomSheet}>
          <Pressable style={styles.scanButton} onPress={() => router.push('/product/demo')}>
            <Text style={styles.scanButtonText}>View Demo Result</Text>
          </Pressable>
          <Pressable style={[styles.scanButton, styles.secondaryButton]} onPress={() => router.push('/add-product')}>
            <Text style={[styles.scanButtonText, styles.secondaryText]}>Enter Ingredients Manually</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Permission not granted
  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan product barcodes. No photos are stored.
        </Text>
        <Pressable style={styles.scanButton} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Scan overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </CameraView>

      <View style={styles.bottomSheet}>
        <Text style={styles.hint}>
          {scanned ? 'Barcode detected!' : 'Point camera at a product barcode'}
        </Text>
        <Pressable style={[styles.scanButton, styles.secondaryButton]} onPress={() => router.push('/add-product')}>
          <Text style={[styles.scanButtonText, styles.secondaryText]}>Enter Ingredients Manually</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.textPrimary },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.surfaceElevated, fontSize: 18, fontWeight: '600' },
  placeholderSub: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 250, height: 250,
    borderWidth: 2, borderColor: colors.primary,
    borderRadius: radius.lg,
    backgroundColor: 'transparent',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.textSecondary },
  hint: { color: colors.textMuted, fontSize: 13 },
  permissionTitle: { color: colors.surfaceElevated, fontSize: 20, fontWeight: '700', marginBottom: spacing.sm },
  permissionText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: spacing.lg },
});
