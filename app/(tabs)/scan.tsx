import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { uploadReceiptImage, deleteReceiptImage } from '../../lib/storage';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Use numeric runtime values for camera constants to avoid mixing value/type
  const FLASH_OFF = 0 as number;
  const FLASH_TORCH = 3 as number;
  const CAMERA_BACK = 1 as number;
  const CAMERA_FRONT = 2 as number;

  // Camera has problematic JSX typings in some environments; cast to any for rendering
  const CameraAny: any = Camera;

  const [flashMode, setFlashMode] = useState<number>(FLASH_OFF);
  const [cameraType, setCameraType] = useState<number>(CAMERA_BACK);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cameraRef = useRef<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      setIsLoading(true);
      setUploadError(null);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // show preview
      setLastPhotoUri(photo.uri);

      // Start upload (no native progress available via Supabase SDK in this flow)
      setIsUploading(true);
      const uploadResult = await uploadReceiptImage(photo.uri);
      setIsUploading(false);

      if (uploadResult.error) {
        const msg = String(
          (uploadResult.error as any)?.message || uploadResult.error
        );
        setUploadError(msg);
        Alert.alert('Upload failed', msg);
        return;
      }

      // store uploaded path so we can remove it if user retries
      const uploadedPath = (uploadResult.data as any)?.path;
      if (uploadedPath) setLastUploadedPath(uploadedPath);

      Alert.alert(
        'Success',
        'Receipt uploaded. OCR processing will run shortly.'
      );
      router.push('/' as any);
    } catch (err) {
      console.error('Error taking picture:', err);
      Alert.alert('Error', 'Failed to capture or upload image.');
    } finally {
      setIsLoading(false);
    }
  };

  const retryUpload = async () => {
    if (!lastPhotoUri) return;
    try {
      setUploadError(null);
      // If there's a previous uploaded file (from a partial/failed flow), delete it first
      if (lastUploadedPath) {
        try {
          await deleteReceiptImage(lastUploadedPath);
          setLastUploadedPath(null);
        } catch (e) {
          // non-fatal
          console.debug('Failed to delete previous upload:', e);
        }
      }

      setIsUploading(true);
      const uploadResult = await uploadReceiptImage(lastPhotoUri);
      setIsUploading(false);

      if (uploadResult.error) {
        const msg = String(
          (uploadResult.error as any)?.message || uploadResult.error
        );
        setUploadError(msg);
        Alert.alert('Upload failed', msg);
        return;
      }

      const uploadedPath = (uploadResult.data as any)?.path;
      if (uploadedPath) setLastUploadedPath(uploadedPath);

      Alert.alert(
        'Success',
        'Receipt uploaded. OCR processing will run shortly.'
      );
      router.push('/' as any);
    } catch (e) {
      setIsUploading(false);
      setUploadError(String(e));
      Alert.alert('Upload error', String(e));
    }
  };

  const toggleFlash = () => {
    setFlashMode((m: number) => (m === FLASH_OFF ? FLASH_TORCH : FLASH_OFF));
  };

  const flipCamera = () => {
    setCameraType((t: number) =>
      t === CAMERA_BACK ? CAMERA_FRONT : CAMERA_BACK
    );
  };

  if (hasPermission === null)
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  if (hasPermission === false)
    return (
      <View style={styles.container}>
        <Text>
          No access to camera. Please enable camera permissions in settings.
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <CameraAny
        style={styles.camera}
        ref={cameraRef}
        ratio="16:9"
        flashMode={flashMode}
        type={cameraType}
      />

      <View style={styles.topControls}>
        <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
          <Text style={styles.topButtonText}>
            {flashMode === FLASH_TORCH ? 'Flash On' : 'Flash Off'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topButton} onPress={flipCamera}>
          <Text style={styles.topButtonText}>Flip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        {lastPhotoUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: lastPhotoUri }} style={styles.preview} />
            {isUploading ? (
              <View style={styles.uploadingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : uploadError ? (
              <View style={styles.uploadErrorRow}>
                <Text style={styles.uploadErrorText}>Upload failed</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retryUpload}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isLoading || isUploading}
              >
                <Text style={styles.captureText}>
                  {isLoading ? 'Preparing...' : 'Capture & Upload'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isLoading || isUploading}
          >
            <Text style={styles.captureText}>
              {isLoading ? 'Preparing...' : 'Capture & Upload'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  topControls: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  topButtonText: { color: '#fff', fontWeight: '600' },
  controls: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 40,
  },
  captureText: { color: '#fff', fontWeight: '600' },
  previewContainer: { alignItems: 'center' },
  preview: { width: 240, height: 140, borderRadius: 8, marginBottom: 8 },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadingText: { color: '#fff', marginLeft: 8 },
  uploadErrorRow: { alignItems: 'center' },
  uploadErrorText: { color: '#FCA5A5', marginBottom: 6 },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#374151', fontWeight: '600' },
});
