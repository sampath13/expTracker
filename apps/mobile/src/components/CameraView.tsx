import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useCameraPermission } from '@hooks/useCameraPermission';
import { getCapturePath } from '@utils/imageUtils';

type FlashMode = 'auto' | 'on' | 'off';

export function CameraView() {
  const { status, request } = useCameraPermission();
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [capturedPath, setCapturedPath] = useState<string | null>(null);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  }, []);

  const handleCapture = useCallback(async () => {
    const path = getCapturePath();
    setCapturedPath(path);
  }, []);

  if (status !== 'granted') {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={request}>
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <Text style={styles.previewText}>Camera Preview</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Text style={styles.controlText}>Flash: {flashMode}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
          <View style={styles.captureInner} />
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
      {capturedPath && (
        <Text style={styles.pathText}>Captured: {capturedPath}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
  previewText: { color: '#fff', fontSize: 16 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#000',
  },
  flashButton: { padding: 12 },
  controlText: { color: '#fff', fontSize: 14 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  spacer: { width: 50 },
  text: { color: '#fff', fontSize: 16, marginBottom: 20 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pathText: { color: '#0f0', fontSize: 12, padding: 8, textAlign: 'center' },
});
