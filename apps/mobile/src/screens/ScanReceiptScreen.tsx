import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView } from '@components/CameraView';
import { detectBlur, type BlurResult } from '@utils/blurDetection';
import { useScanStore } from '@store';
import RNFS from 'react-native-fs';
import type { HomeStackParamList } from '@navigation/types';

type ScanNav = NativeStackNavigationProp<HomeStackParamList, 'ScanReceipt'>;

export default function ScanReceiptScreen() {
  const navigation = useNavigation<ScanNav>();
  const { uploadImage, uploadProgress, uploadStatus, captureImage, error } = useScanStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [blurResult, setBlurResult] = useState<BlurResult | null>(null);
  const [showScanHint, setShowScanHint] = useState(true);
  const analyzedPath = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowScanHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleProceed = useCallback(async (path: string) => {
    captureImage(path);
    try {
      await uploadImage(path);
      RNFS.unlink(path).catch(() => {});
      navigation.navigate('ConfirmOCR');
    } catch {
      // uploadStatus is 'error' from store; user can retry
    }
  }, [captureImage, uploadImage, navigation]);

  const handleRetake = useCallback(() => {
    analyzedPath.current = null;
    setBlurResult(null);
  }, []);

  const handlePhotoCaptured = useCallback(
    async (path: string) => {
      if (analyzedPath.current === path) {
        handleProceed(path);
        return;
      }

      analyzedPath.current = path;
      setIsAnalyzing(true);
      setBlurResult(null);

      try {
        const result = await detectBlur(path);
        setBlurResult(result);
        if (!result.isBlurry) {
          handleProceed(path);
        }
      } catch (err) {
        handleProceed(path);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [handleProceed],
  );

  return (
    <View style={styles.root}>
      <CameraView
        onPhotoCaptured={handlePhotoCaptured}
        isActive={true}
      />

      {showScanHint && !blurResult && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>Hold steady for a clear scan</Text>
        </View>
      )}

      {isAnalyzing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Analyzing image...</Text>
        </View>
      )}

      {uploadStatus === 'uploading' && (
        <View style={styles.overlay}>
          <View style={styles.progressCircle}>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
          <Text style={styles.overlayText}>Uploading...</Text>
        </View>
      )}

      {uploadStatus === 'error' && analyzedPath.current && (
        <View style={styles.overlay}>
          <Text style={styles.blurTitle}>Upload failed</Text>
          <Text style={styles.blurSubtext}>{error || 'Something went wrong'}</Text>
          <View style={styles.blurActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.useAnywayButton}
              onPress={() => handleProceed(analyzedPath.current!)}
            >
              <Text style={styles.useAnywayText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {blurResult?.isBlurry && (
        <View style={styles.overlay}>
          <Text style={styles.blurTitle}>Image is blurry — retake?</Text>
          <Text style={styles.blurSubtext}>
            Variance: {blurResult.variance.toFixed(1)}
          </Text>
          <View style={styles.blurActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.useAnywayButton}
              onPress={() => analyzedPath.current && handleProceed(analyzedPath.current)}
            >
              <Text style={styles.useAnywayText}>Use Anyway</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  toast: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  blurTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  blurSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 32,
  },
  blurActions: {
    flexDirection: 'row',
    gap: 16,
  },
  retakeButton: {
    backgroundColor: '#555',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retakeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  useAnywayButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  useAnywayText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  progressCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: '#007AFF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  progressText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
