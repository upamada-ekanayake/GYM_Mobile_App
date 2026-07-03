import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  Keyboard,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import HamburgerMenu from '../components/HamburgerMenu';
import { Session } from '../constants/Session';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Colour Tokens (AuraFit Premium Theme) ── */
const ACCENT = '#8A2BE2'; // Aura Violet
const ACCENT_EMERALD = '#00FF87'; // Neon Emerald
const BG = '#08080C'; // Deep Obsidian
const CARD = '#12121A'; // Deep Charcoal
const BORDER = '#241C35'; // Deep Violet Border
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#B3AEC6';
const TEXT_MUTED = '#5C5570';
const SUCCESS_GREEN = '#22C55E';
const ERROR_RED = '#EF4444';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';

interface CalorieLogEntry {
  timestamp: string;
  foodName: string;
  calories: number;
}

export default function CalorieTrackerScreen() {
  const router = useRouter();
  const userId = Session.getUserId();

  /* ── State Hooks ── */
  const [calorieTarget, setCalorieTarget] = useState<number>(2000); // default
  const [calorieLogs, setCalorieLogs] = useState<CalorieLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  /* ── Scan Modal State ── */
  const [scanModalVisible, setScanModalVisible] = useState<boolean>(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ food_detected?: string; calories_predicted?: number } | null>(null);
  
  /* ── Manual Entry State ── */
  const [manualFood, setManualFood] = useState<string>('');
  const [manualCal, setManualCal] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  /* ── Custom Popup Alert State ── */
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
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

  /* ── Request Camera Permissions ── */
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          showPopup('Permissions Required', 'AuraFit needs camera and photos access to scan meals.', 'info');
        }
      }
    })();
  }, []);

  /* ── Fetch User Details & Logs ── */
  const loadUserDetails = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/user-details/${userId}`);
      const data = await response.json();
      if (response.ok && data.user) {
        if (data.user.CalorieTarget) {
          setCalorieTarget(Number(data.user.CalorieTarget));
        }
        if (data.user.CalorieLog) {
          setCalorieLogs(data.user.CalorieLog);
        }
      }
    } catch (err) {
      console.warn('Error loading calorie logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  /* ── Calculate Today's Intake ── */
  const getTodayCalories = () => {
    const todayStr = new Date().toDateString();
    return calorieLogs
      .filter((log) => new Date(log.timestamp).toDateString() === todayStr)
      .reduce((sum, log) => sum + log.calories, 0);
  };

  const todayCalories = getTodayCalories();
  const remainingCalories = Math.max(calorieTarget - todayCalories, 0);
  const percentage = Math.min(Math.round((todayCalories / calorieTarget) * 100), 100);

  /* ── Log Calorie intake ── */
  const handleAddCalorie = async (foodName: string, calories: number) => {
    if (!userId) {
      showPopup('Session Expired', 'Please login to track your daily intake.', 'error');
      return;
    }
    if (!foodName.trim() || calories < 0 || isNaN(calories)) {
      showPopup('Invalid Entry', 'Please enter valid food details.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/user-log-calorie/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodName: foodName.trim(), calories }),
      });

      const data = await response.json();
      if (response.ok) {
        setCalorieLogs((prev) => [...prev, data.entry]);
        setManualFood('');
        setManualCal('');
        showPopup('Meal Logged', `${foodName} (${calories} kcal) added!`, 'success');
      } else {
        showPopup('Error', data.message || 'Could not log intake.', 'error');
      }
    } catch (err) {
      showPopup('Error', 'Network connection failure.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Snap Photo ── */
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
      }
    } catch (err) {
      showPopup('Camera Error', 'Failed to capture photo.', 'error');
    }
  };

  /* ── Pick Image ── */
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
      }
    } catch (err) {
      showPopup('Image Error', 'Failed to select image.', 'error');
    }
  };

  /* ── Trigger AI Scan ── */
  const handleAIScan = async () => {
    if (!imageBase64) {
      showPopup('Error', 'Please select or capture an image first.', 'error');
      return;
    }

    setIsScanning(true);
    setStatusMessage('Analyzing food composition...');

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
        setScanResult(data);
        // Automatically save to daily calorie logs
        const name = data.food_detected || 'Scanned Meal';
        const cals = data.calories_predicted || 250;
        await handleAddCalorie(name, cals);
        setScanModalVisible(false);
      } else {
        showPopup('Scanner Error', data.message || 'AI prediction model failed.', 'error');
      }
    } catch (err: any) {
      showPopup('Network Error', err.message || 'Error communicating with AI microservice.', 'error');
    } finally {
      setIsScanning(false);
      setImageUri(null);
      setImageBase64(null);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const todayLogs = calorieLogs.filter(
    (log) => new Date(log.timestamp).toDateString() === new Date().toDateString()
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <HamburgerMenu currentRole="User" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Analyzing calorie profile...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Calorie Hub</Text>
            <Text style={styles.subTitle}>Manage and balance daily intake budget</Text>
          </View>

          {/* Calorie Ring Hub */}
          <View style={styles.progressHub}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Ionicons name="flame" size={48} color={remainingCalories === 0 ? ACCENT_EMERALD : ACCENT} />
                <Text style={styles.percentageText}>{remainingCalories} kcal</Text>
                <Text style={styles.progressLabel}>
                  Remaining of {calorieTarget} kcal ({percentage}%)
                </Text>
              </View>
            </View>
          </View>

          {/* AI Scan Trigger Banner */}
          <TouchableOpacity
            style={styles.scanBanner}
            onPress={() => setScanModalVisible(true)}
            activeOpacity={0.85}
          >
            <LinearGradientBackground />
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            <View style={styles.scanBannerTextWrapper}>
              <Text style={styles.scanBannerTitle}>Scan Meal with AI</Text>
              <Text style={styles.scanBannerSub}>Compute and log calories instantly via photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Manual Entry Form */}
          <View style={styles.customIntakeCard}>
            <Text style={styles.cardHeader}>Manual Meal Entry</Text>
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Food name (e.g. Rice & Curry)"
                placeholderTextColor={TEXT_MUTED}
                value={manualFood}
                onChangeText={setManualFood}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Calories"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="numeric"
                value={manualCal}
                onChangeText={setManualCal}
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddCalorie(manualFood, Number(manualCal))}
              activeOpacity={0.8}
              disabled={isActionLoading || !manualFood || !manualCal}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color={TEXT_PRIMARY} />
              ) : (
                <Text style={styles.addButtonText}>Log Meal</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Today's Meals */}
          <Text style={styles.sectionLabel}>Logged Meals Today</Text>
          {todayLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="nutrition-outline" size={32} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>No food logs for today yet.</Text>
            </View>
          ) : (
            todayLogs.map((log, index) => (
              <View key={index} style={styles.logCard}>
                <View style={styles.logLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="restaurant-outline" size={16} color={ACCENT} />
                  </View>
                  <View>
                    <Text style={styles.logFoodName}>{log.foodName}</Text>
                    <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                  </View>
                </View>
                <Text style={styles.logCalAmount}>+{log.calories} kcal</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* AI Food Scanner Overlay Modal */}
      <Modal
        visible={scanModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setScanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AuraFit AI Food Scanner</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            {/* Preview Canvas */}
            <View style={styles.canvasContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholderCanvas}>
                  <Ionicons name="camera-outline" size={48} color={TEXT_MUTED} />
                  <Text style={styles.placeholderText}>Capture photo to analyze meal composition</Text>
                </View>
              )}
            </View>

            {/* Control buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.controlButton} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color={TEXT_PRIMARY} />
                <Text style={styles.controlText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
                <Ionicons name="image" size={20} color={TEXT_PRIMARY} />
                <Text style={styles.controlText}>Upload</Text>
              </TouchableOpacity>
            </View>

            {imageUri && !isScanning && (
              <TouchableOpacity style={styles.scanButton} onPress={handleAIScan}>
                <Text style={styles.scanButtonText}>Analyze & Log Meal</Text>
                <Ionicons name="sparkles" size={18} color={BG} />
              </TouchableOpacity>
            )}

            {isScanning && (
              <View style={styles.scanLoader}>
                <ActivityIndicator size="small" color={ACCENT_EMERALD} />
                <Text style={styles.scanLoaderText}>{statusMessage}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Alert popup */}
      <Modal visible={popup.visible} transparent={true} animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={dismissPopup} activeOpacity={0.85}>
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Inline fallback for expo-linear-gradient compatibility
function LinearGradientBackground() {
  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: '#8A2BE2',
          opacity: 0.85,
          borderRadius: 20,
          zIndex: -1,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: TEXT_SECONDARY,
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 100 : 90,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  progressHub: {
    alignItems: 'center',
    marginBottom: 32,
  },
  outerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  innerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 8,
    textAlign: 'center',
  },
  progressLabel: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  scanBannerTextWrapper: {
    flex: 1,
    marginLeft: 14,
  },
  scanBannerTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  scanBannerSub: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  customIntakeCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 30,
  },
  cardHeader: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  addButton: {
    width: '100%',
    height: 48,
    backgroundColor: ACCENT,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
    marginTop: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 13,
    marginTop: 10,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 10,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logFoodName: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  logTime: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    marginTop: 2,
  },
  logCalAmount: {
    color: ACCENT_EMERALD,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  canvasContainer: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  placeholderText: {
    color: TEXT_MUTED,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  controlText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  scanButton: {
    height: 50,
    backgroundColor: ACCENT_EMERALD,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: BG,
    fontWeight: '800',
    fontSize: 15,
  },
  scanLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  scanLoaderText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
  },
  alertCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  alertButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
});

