import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { uploadReceiptImage } from '@/lib/storage';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Upload to Supabase Storage
      const uploadResult = await uploadReceiptImage(photo.uri);
      if (uploadResult.error) {
        Alert.alert(
          'Upload failed',
          String(uploadResult.error.message || uploadResult.error)
        );
        setIsLoading(false);
        return;
      }

      // Optionally call OCR edge function to process the image
      // We expect an edge function at `${SUPABASE_EDGE_FUNCTIONS_BASE_URL}/process-receipt`
      // The upload helper may already call the function; if not, we could call it here.

      Alert.alert(
        'Success',
        'Receipt uploaded. OCR processing will run shortly.'
      );
      router.push('/');
    } catch (err) {
      console.error('Error taking picture:', err);
      Alert.alert('Error', 'Failed to capture or upload image.');
    } finally {
      setIsLoading(false);
    }
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
      <Camera style={styles.camera} ref={cameraRef} ratio="16:9" />
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
          disabled={isLoading}
        >
          <Text style={styles.captureText}>
            {isLoading ? 'Uploading...' : 'Capture & Upload'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
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
});
