import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import type { CameraRef, FlashMode as CaptureFlashMode } from 'react-native-vision-camera';

type FlashMode = 'auto' | 'on' | 'off';

interface CameraViewProps {
  onPhotoCaptured?: (photoPath: string) => void;
  isActive?: boolean;
}

export function CameraView({ onPhotoCaptured, isActive = true }: CameraViewProps) {
  const { hasPermission, requestPermission, status, canRequestPermission } =
    useCameraPermission();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput();
  const camera = useRef<CameraRef>(null);

  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [lastCapturePath, setLastCapturePath] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [deviceReady, setDeviceReady] = useState(!device);

  useEffect(() => {
    if (device) {
      setDeviceReady(true);
      return;
    }
    const timer = setTimeout(() => setDeviceReady(true), 1500);
    return () => clearTimeout(timer);
  }, [device]);

  useEffect(() => {
    if (status === 'not-determined' && canRequestPermission) {
      requestPermission();
    }
  }, [status, canRequestPermission, requestPermission]);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => {
      if (prev === 'auto') return 'on';
      if (prev === 'on') return 'off';
      return 'auto';
    });
  }, []);

  const handleCapture = useCallback(async () => {
    if (!photoOutput || isCapturing) return;
    setIsCapturing(true);
    try {
      const captureFlashMode: CaptureFlashMode =
        flashMode === 'auto' ? 'auto' : flashMode;
      const photoFile = await photoOutput.capturePhotoToFile(
        { flashMode: captureFlashMode, enableShutterSound: true },
        {},
      );
      setLastCapturePath(photoFile.filePath);
      onPhotoCaptured?.(photoFile.filePath);
    } catch (error) {
      console.error('Capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [photoOutput, flashMode, onPhotoCaptured, isCapturing]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const handleThumbnailPress = useCallback(() => {
    if (lastCapturePath) {
      onPhotoCaptured?.(lastCapturePath);
    }
  }, [lastCapturePath, onPhotoCaptured]);

  const isSimulator = Platform.OS === 'ios' && !device && deviceReady;

  if (!deviceReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Initializing camera...</Text>
      </View>
    );
  }

  if (isSimulator) {
    return (
      <MockCameraView
        flashMode={flashMode}
        onToggleFlash={toggleFlash}
        onCapture={async () => {
          setIsCapturing(true);
          try {
            const destPath = `${RNFS.CachesDirectoryPath}/scan_${Date.now()}.jpg`;
            const assetUri = Image.resolveAssetSource(
              require('../assets/sample-receipt.jpg'),
            ).uri;
            await RNFS.downloadFile({ fromUrl: assetUri, toFile: destPath }).promise;
            setLastCapturePath(destPath);
            onPhotoCaptured?.(destPath);
          } catch (e) {
            console.warn('Mock capture failed, using fallback:', e);
            const fallbackPath = `mock_photo_${Date.now()}.jpg`;
            setLastCapturePath(fallbackPath);
            onPhotoCaptured?.(fallbackPath);
          } finally {
            setIsCapturing(false);
          }
        }}
        lastCapturePath={lastCapturePath}
        onThumbnailPress={handleThumbnailPress}
        isCapturing={isCapturing}
      />
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No camera available</Text>
      </View>
    );
  }

  if (status === 'denied' || status === 'restricted') {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera access denied</Text>
        <Text style={styles.subtext}>
          Enable camera access in Settings to scan receipts
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenSettings}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'not-determined') {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>
        {canRequestPermission && (
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Allow Camera</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        outputs={[photoOutput]}
        isActive={isActive}
        torchMode={flashMode === 'on' ? 'on' : 'off'}
      />

      <View style={styles.controls}>
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <Text style={styles.controlText}>
            {flashMode === 'auto' ? 'Auto' : flashMode === 'on' ? 'On' : 'Off'}
          </Text>
          <Text style={styles.controlLabel}>Flash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>

        {lastCapturePath ? (
          <TouchableOpacity style={styles.thumbnailButton} onPress={handleThumbnailPress}>
            <Image
              source={{ uri: 'file://' + lastCapturePath }}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

function MockCameraView({
  flashMode, onToggleFlash, onCapture, lastCapturePath, onThumbnailPress, isCapturing,
}: {
  flashMode: FlashMode;
  onToggleFlash: () => void;
  onCapture: () => void | Promise<void>;
  lastCapturePath: string | null;
  onThumbnailPress: () => void;
  isCapturing: boolean;
}) {
  return (
    <View style={styles.mockContainer}>
      <View style={styles.mockViewfinder}>
        <Text style={styles.mockIcon}>📷</Text>
        <Text style={styles.mockLabel}>Simulator Mode</Text>
        <Text style={styles.mockHint}>Tap capture to test the scan flow</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.flashButton} onPress={onToggleFlash}>
          <Text style={styles.controlText}>
            {flashMode === 'auto' ? 'Auto' : flashMode === 'on' ? 'On' : 'Off'}
          </Text>
          <Text style={styles.controlLabel}>Flash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
          onPress={onCapture}
          disabled={isCapturing}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>

        {lastCapturePath ? (
          <TouchableOpacity style={styles.thumbnailButton} onPress={onThumbnailPress}>
            <View style={[styles.thumbnail, styles.mockThumbnail]}>
              <Text style={styles.mockThumbnailText}>✓</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  text: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtext: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  flashButton: { alignItems: 'center', width: 50 },
  controlText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  controlLabel: { color: '#aaa', fontSize: 10, marginTop: 2 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  thumbnailButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  thumbnail: { width: 46, height: 46, borderRadius: 6 },
  spacer: { width: 50 },
  mockContainer: { flex: 1, backgroundColor: '#1a1a2e' },
  mockViewfinder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  mockIcon: { fontSize: 64, marginBottom: 16 },
  mockLabel: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  mockHint: { color: '#888', fontSize: 14 },
  mockThumbnail: { backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  mockThumbnailText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
