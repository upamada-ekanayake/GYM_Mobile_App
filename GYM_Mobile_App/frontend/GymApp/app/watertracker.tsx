import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '../components/HamburgerMenu';

/* ── Colour Tokens (matching app-wide theme) ── */
const ACCENT = '#8A2BE2'; // Aura Violet
const ACCENT_EMERALD = '#00FF87'; // Neon Emerald
const BG = '#08080C'; // Deep Obsidian
const CARD = '#12121A'; // Deep Charcoal
const BORDER = '#241C35'; // Deep Violet Border
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#B3AEC6';
const TEXT_MUTED = '#5C5570';
const ERROR_RED = '#EF4444';
const SUCCESS_GREEN = '#22C55E';
const BACKEND_URL = 'http://192.168.1.5:5000';

export default function WaterTrackerScreen() {
  const { role } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  /* ── Keyboard Height State ── */
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /* ── Form State ── */
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'Low' | 'Moderate' | 'High' | null>(null);
  const [weather, setWeather] = useState<'Hot' | 'Normal' | 'Cold' | null>(null);

  /* ── Calculation State ── */
  const [isCalculating, setIsCalculating] = useState(false);
  const [predictedWater, setPredictedWater] = useState<number | null>(null);

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

  /* ── Keyboard Listener ── */
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ── Frontend Validation ── */
  const validateForm = (): boolean => {
    if (gender === null) {
      showPopup('Validation Error', 'Please select your Gender.', 'error');
      return false;
    }

    if (!age.trim()) {
      showPopup('Validation Error', 'Please enter your Age.', 'error');
      return false;
    }
    if (!/^\d+$/.test(age)) {
      showPopup('Validation Error', 'Only numeric values are allowed for Age.', 'error');
      return false;
    }
    const ageNum = Number(age);
    if (ageNum < 0) {
      showPopup('Validation Error', 'Age cannot be negative.', 'error');
      return false;
    }

    if (!weight.trim()) {
      showPopup('Validation Error', 'Please enter your Weight.', 'error');
      return false;
    }
    if (isNaN(Number(weight))) {
      showPopup('Validation Error', 'Only numeric values are allowed for Weight.', 'error');
      return false;
    }
    const weightNum = Number(weight);
    if (weightNum < 0) {
      showPopup('Validation Error', 'Weight cannot be negative.', 'error');
      return false;
    }

    if (!activityLevel) {
      showPopup('Validation Error', 'Please select your Physical Activity Level.', 'error');
      return false;
    }

    if (!weather) {
      showPopup('Validation Error', 'Please select the Weather type.', 'error');
      return false;
    }

    return true;
  };

  /* ── Predict Water Intake ── */
  const handleCalculate = async () => {
    if (!validateForm()) return;

    const startTime = Date.now();

    // Dismiss Mobile Keyboard & remove focus
    Keyboard.dismiss();

    setIsCalculating(true);

    const mappedGenderMale = gender === 'Male' ? 1 : 0;
    
    let mappedActivity = 0;
    if (activityLevel === 'Low') mappedActivity = 0;
    else if (activityLevel === 'Moderate') mappedActivity = 1;
    else if (activityLevel === 'High') mappedActivity = 2;

    let mappedWeatherHot = 0;
    let mappedWeatherNormal = 0;
    if (weather === 'Hot') {
      mappedWeatherHot = 1;
      mappedWeatherNormal = 0;
    } else if (weather === 'Normal') {
      mappedWeatherHot = 0;
      mappedWeatherNormal = 1;
    } else if (weather === 'Cold') {
      mappedWeatherHot = 0;
      mappedWeatherNormal = 0;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-Model/predict-water`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Age: Number(age),
          Weight: Number(weight),
          Physical_Activity_Level: mappedActivity,
          Gender_Male: mappedGenderMale,
          Weather_Hot: mappedWeatherHot,
          Weather_Normal: mappedWeatherNormal,
        }),
      });

      const data = await response.json();

      if (response.status === 200 && data.success) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 320 - elapsed); // Wait for keyboard hide animation

        setTimeout(() => {
          setPredictedWater(data.water_intake_liters);
          
          // Smoothly scroll to the bottom to display the result card
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }, delay);
      } else {
        showPopup('Prediction Error', data.message || 'Failed to calculate water intake prediction.', 'error');
      }
    } catch (err: any) {
      showPopup('Network Error', 'Could not connect to the backend server.', 'error');
    } finally {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 320 - elapsed);
      setTimeout(() => {
        setIsCalculating(false);
      }, delay);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole={(role as any) || 'User'} />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 60 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Decorative Glow Accent ── */}
        <View style={styles.glowCircle} />

        {/* ── Proper Page Heading ── */}
        <Text style={styles.pageTitle}>AuraFit Water Tracker</Text>
        <View style={styles.titleUnderline} />

        {/* ── Form Container ── */}
        <View style={styles.formContainer}>
          
          {/* 1. Gender Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderCard,
                  gender === 'Male' && styles.genderCardActive,
                ]}
                onPress={() => setGender('Male')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="male-outline"
                  size={22}
                  color={gender === 'Male' ? '#FFFFFF' : TEXT_SECONDARY}
                />
                <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderCard,
                  gender === 'Female' && styles.genderCardActive,
                ]}
                onPress={() => setGender('Female')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="female-outline"
                  size={22}
                  color={gender === 'Female' ? '#FFFFFF' : TEXT_SECONDARY}
                />
                <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2 & 3. Age & Weight side-by-side */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </View>

            <View style={{ width: 16 }} />

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="fitness-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Weight"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>
          </View>

          {/* 4. Physical Activity Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Physical Activity Level</Text>
            <View style={styles.threeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.threeButtonsCard,
                  activityLevel === 'Low' && styles.threeButtonsCardActive,
                ]}
                onPress={() => setActivityLevel('Low')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="walk-outline"
                  size={18}
                  color={activityLevel === 'Low' ? '#FFFFFF' : ACCENT}
                />
                <Text style={[styles.threeButtonsText, activityLevel === 'Low' && styles.threeButtonsTextActive]}>
                  Low
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.threeButtonsCard,
                  activityLevel === 'Moderate' && styles.threeButtonsCardActive,
                ]}
                onPress={() => setActivityLevel('Moderate')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="fitness-outline"
                  size={18}
                  color={activityLevel === 'Moderate' ? '#FFFFFF' : ACCENT}
                />
                <Text style={[styles.threeButtonsText, activityLevel === 'Moderate' && styles.threeButtonsTextActive]}>
                  Moderate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.threeButtonsCard,
                  activityLevel === 'High' && styles.threeButtonsCardActive,
                ]}
                onPress={() => setActivityLevel('High')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flame-outline"
                  size={18}
                  color={activityLevel === 'High' ? '#FFFFFF' : ACCENT}
                />
                <Text style={[styles.threeButtonsText, activityLevel === 'High' && styles.threeButtonsTextActive]}>
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Weather Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weather</Text>
            <View style={styles.threeButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.threeButtonsCard,
                  weather === 'Hot' && styles.threeButtonsCardActive,
                ]}
                onPress={() => setWeather('Hot')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="sunny-outline"
                  size={18}
                  color={weather === 'Hot' ? '#FFFFFF' : ACCENT}
                />
                <Text style={[styles.threeButtonsText, weather === 'Hot' && styles.threeButtonsTextActive]}>
                  Hot
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.threeButtonsCard,
                  weather === 'Normal' && styles.threeButtonsCardActive,
                ]}
                onPress={() => setWeather('Normal')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="cloudy-outline"
                  size={18}
                  color={weather === 'Normal' ? '#FFFFFF' : ACCENT}
                />
                <Text style={[styles.threeButtonsText, weather === 'Normal' && styles.threeButtonsTextActive]}>
                  Normal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.threeButtonsCard,
                  weather === 'Cold' && styles.threeButtonsCardActive,
                ]}
                onPress={() => setWeather('Cold')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="snow-outline"
                  size={18}
                  color={weather === 'Cold' ? '#FFFFFF' : ACCENT}
                />
                <Text style={[styles.threeButtonsText, weather === 'Cold' && styles.threeButtonsTextActive]}>
                  Cold
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* ── 6. Calculate Button ── */}
        <TouchableOpacity
          style={[styles.calculateButton, isCalculating && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          activeOpacity={0.85}
          disabled={isCalculating}
        >
          {isCalculating ? (
            <View style={styles.loadingButtonContent}>
              <ActivityIndicator size="small" color={BG} />
              <Text style={styles.calculateButtonText}>Calculating...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.calculateButtonText}>Calculate Water Intake</Text>
              <Ionicons name="arrow-forward" size={20} color={BG} />
            </>
          )}
        </TouchableOpacity>

        {/* ── 7. Prediction Result Card ── */}
        {predictedWater !== null && !isCalculating && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmojiText}>
              💧 {predictedWater.toFixed(1)} L
            </Text>
            <Text style={styles.resultLabelText}>Total Water Intake</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Custom Popup Modal ── */}
      <Modal
        visible={popup.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissPopup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalMessage}>{popup.message}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={dismissPopup}
              activeOpacity={0.85}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Screen ── */
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

  /* ── Decorative Glow ── */
  glowCircle: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT,
    opacity: 0.08,
  },

  /* ── Page Title ── */
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: ACCENT,
    borderRadius: 2,
    marginBottom: 28,
  },

  /* ── Form Container ── */
  formContainer: {
    width: '100%',
    gap: 18,
    marginBottom: 28,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 8,
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 15,
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },

  /* ── Gender Selection ── */
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    height: 56,
    gap: 8,
  },
  genderCardActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_SECONDARY,
  },
  genderTextActive: {
    color: '#FFFFFF',
  },

  /* ── Three Buttons Row (Activity & Weather) ── */
  threeButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  threeButtonsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 18,
    height: 60,
    gap: 6,
    paddingHorizontal: 8,
  },
  threeButtonsCardActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  threeButtonsText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  threeButtonsTextActive: {
    color: '#FFFFFF',
  },

  /* ── Calculate Button ── */
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    backgroundColor: ACCENT,
    borderRadius: 16,
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 28,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calculateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },

  /* ── Prediction Result Card ── */
  resultCard: {
    width: '100%',
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: ACCENT_EMERALD,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: ACCENT_EMERALD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  resultEmojiText: {
    fontSize: 32,
    fontWeight: '800',
    color: ACCENT_EMERALD,
    marginBottom: 6,
    textAlign: 'center',
  },
  resultLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },

  /* ── Custom Popup Modal ── */
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
    // Glass shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
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
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
});
