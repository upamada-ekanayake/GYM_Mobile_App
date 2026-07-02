import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '../components/HamburgerMenu';
import { Session } from '../constants/Session';
import { useLocalSearchParams } from 'expo-router';

/* ── Colour Tokens (AuraFit Premium Dark/Neon Theme) ── */
const ACCENT_VIOLET = '#8A2BE2'; // Aura Violet
const ACCENT_EMERALD = '#00FF87'; // Neon Emerald
const BG = '#08080C'; // Deep Obsidian
const CARD = '#12121A'; // Deep Charcoal
const BORDER = '#241C35'; // Deep Violet Border
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#B3AEC6';
const TEXT_MUTED = '#5C5570';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';

export default function FoodScannerScreen() {
  const { role } = useLocalSearchParams();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ detected_food: string; calories_predicted: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  /* ── Custom Popup State ── */
  const [popup, setPopup] = useState<{ visible: boolean; title: string; message: string; type: 'error' | 'success' | 'info' }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showPopup = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setPopup({ visible: true, title, message, type });
  };

  const dismissPopup = () => {
    setPopup({ visible: false, title: '', message: '', type: 'info' });
  };

  // Request permissions on component load
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          showPopup('Permissions Required', 'AuraFit needs camera and photo library access to scan meals.', 'info');
        }
      }
    })();
  }, []);

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
        setScanResult(null);
        setIsAdded(false);
      }
    } catch (err) {
      showPopup('Image Error', 'Failed to pick image from gallery.', 'error');
    }
  };

  // Snap photo with camera
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
        setScanResult(null);
        setIsAdded(false);
      }
    } catch (err) {
      showPopup('Camera Error', 'Failed to capture photo with camera.', 'error');
    }
  };

  // Upload and analyze image
  const startScan = async () => {
    if (!imageBase64) {
      showPopup('Error', 'Please select or capture an image first.', 'error');
      return;
    }

    setIsScanning(true);
    setStatusMessage('Analyzing food texture and shapes...');
    
    try {
      const token = Session.getToken();
      const response = await fetch(`${BACKEND_URL}/api/ai-Model/predict-food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ imageBase64 })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setScanResult({
          detected_food: data.detected_food,
          calories_predicted: data.calories_predicted
        });
      } else {
        showPopup('Scanner Error', data.message || 'AI model prediction failed.', 'error');
      }
    } catch (err: any) {
      showPopup('Network Error', err.message || 'Error connecting to backend model proxy.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Add predicted calories to log
  const handleAddToDailyIntake = () => {
    setIsAdded(true);
    showPopup('Logged Successfully', `${scanResult?.calories_predicted} kcal added to daily tracking!`, 'success');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <HamburgerMenu currentRole={(role as any) || 'User'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Glowing Decorative Background Accent */}
        <View style={styles.glowCircle} />

        <Text style={styles.pageTitle}>AuraFit AI Food Scanner</Text>
        <View style={styles.titleUnderline} />

        {/* ── Image Selector Canvas ── */}
        <View style={styles.imageCanvasContainer}>
          {imageUri ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              
              {/* Dynamic Scanning Overlay Animation */}
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <View style={styles.scanLine} />
                  <Text style={styles.scanningOverlayText}>AI Scanning...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholderCanvas}>
              <Ionicons name="camera-outline" size={48} color={TEXT_MUTED} />
              <Text style={styles.placeholderText}>Capture or upload your meal to compute calories instantly</Text>
            </View>
          )}
        </View>

        {/* ── Media Buttons ── */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: ACCENT_VIOLET }]} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Snap Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { borderColor: ACCENT_EMERALD }]} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Upload Image</Text>
          </TouchableOpacity>
        </View>

        {/* ── Trigger Analysis Button ── */}
        {imageUri && !isScanning && !scanResult && (
          <TouchableOpacity style={styles.scanTriggerButton} onPress={startScan}>
            <Text style={styles.scanTriggerButtonText}>Analyze Calories</Text>
            <Ionicons name="sparkles" size={18} color={BG} />
          </TouchableOpacity>
        )}

        {/* ── Loader ── */}
        {isScanning && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={ACCENT_EMERALD} />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        )}

        {/* ── Glowing Scan Results Card ── */}
        {scanResult && !isScanning && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle-outline" size={26} color={ACCENT_EMERALD} />
              <Text style={styles.resultTitle}>Meal Scan Complete</Text>
            </View>

            <View style={styles.nutritionRow}>
              <View style={styles.nutritionCol}>
                <Text style={styles.nutritionLabel}>Detected Food Item</Text>
                <Text style={styles.nutritionValue}>{scanResult.detected_food}</Text>
              </View>

              <View style={styles.nutritionCol}>
                <Text style={styles.nutritionLabel}>Est. Calories</Text>
                <Text style={[styles.nutritionValue, { color: ACCENT_EMERALD }]}>
                  {scanResult.calories_predicted} kcal
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.addButton, isAdded && styles.addButtonDisabled]} 
              onPress={handleAddToDailyIntake}
              disabled={isAdded}
            >
              <Text style={styles.addButtonText}>
                {isAdded ? 'Added to Intake ✅' : 'Add to Daily Intake'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Custom Popup Alert Modal ── */}
      <Modal visible={popup.visible} transparent={true} animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={dismissPopup}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 65,
    paddingBottom: 60,
  },
  glowCircle: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT_VIOLET,
    opacity: 0.08,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '950',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: ACCENT_EMERALD,
    borderRadius: 2,
    marginBottom: 28,
  },
  imageCanvasContainer: {
    width: '100%',
    maxWidth: 500,
    aspectRatio: 1.1,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCanvas: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  placeholderText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 8, 12, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: ACCENT_EMERALD,
    top: '50%',
    shadowColor: ACCENT_EMERALD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  scanningOverlayText: {
    color: ACCENT_EMERALD,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 500,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderRadius: 16,
    height: 52,
    gap: 8,
  },
  actionButtonText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  scanTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_EMERALD,
    width: '100%',
    maxWidth: 500,
    height: 54,
    borderRadius: 16,
    gap: 8,
    shadowColor: ACCENT_EMERALD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 28,
  },
  scanTriggerButtonText: {
    color: BG,
    fontSize: 16,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  loaderContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  statusText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  resultCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: ACCENT_EMERALD,
    padding: 20,
    gap: 18,
    shadowColor: ACCENT_EMERALD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 12,
  },
  resultTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionCol: {
    gap: 4,
  },
  nutritionLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  nutritionValue: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '900',
  },
  addButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: ACCENT_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#1E1E2A',
    opacity: 0.6,
  },
  addButtonText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(18, 18, 26, 0.95)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: ACCENT_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
});
