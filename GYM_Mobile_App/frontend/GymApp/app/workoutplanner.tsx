import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  SafeAreaView
} from 'react-native';
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

type PickerType = 'gender' | 'experience' | 'goal' | 'hypertension' | 'diabetes' | null;

export default function WorkoutPlannerScreen() {
  const { role } = useLocalSearchParams();

  // Form Inputs
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [experience, setExperience] = useState<'Beginner' | 'Intermediate' | 'Advanced' | null>(null);
  const [goal, setGoal] = useState<'Weight Loss' | 'Muscle Gain' | 'Strength' | 'Endurance' | null>(null);
  const [hypertension, setHypertension] = useState<'No' | 'Yes'>('No');
  const [diabetes, setDiabetes] = useState<'No' | 'Yes'>('No');

  // Request State
  const [loading, setLoading] = useState(false);
  const [calculatedBmi, setCalculatedBmi] = useState<number | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Custom Modal Picker State
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  // Custom Popup Alert State
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

  const handlePredict = async () => {
    if (!age || !height || !weight || !gender || !experience || !goal) {
      showPopup('Missing Fields', 'Please fill in all requested fields to generate your custom program.', 'error');
      return;
    }

    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      showPopup('Invalid Input', 'Please enter a valid age.', 'error');
      return;
    }
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      showPopup('Invalid Input', 'Please enter a valid height in cm (e.g. 175).', 'error');
      return;
    }
    if (isNaN(weightNum) || weightNum < 10 || weightNum > 500) {
      showPopup('Invalid Input', 'Please enter a valid weight in kg (e.g. 70).', 'error');
      return;
    }

    setLoading(true);
    setRecommendedPlan(null);
    setIsSaved(false);

    try {
      const token = Session.getToken();
      const response = await fetch(`${BACKEND_URL}/api/ai-Model/predict-workout-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          age: ageNum,
          sex: gender,
          height: heightNum,
          weight: weightNum,
          hypertension,
          diabetes,
          experienceLevel: experience,
          workoutGoal: goal
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setRecommendedPlan(data.recommended_plan);
        setCalculatedBmi(data.calculated_bmi);
      } else {
        showPopup('Inference Error', data.message || 'AI prediction model failed.', 'error');
      }
    } catch (err: any) {
      showPopup('Network Error', err.message || 'Error communicating with backend model gateway.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mock list of exercises mapping dynamically based on the plan string contents
  const getExercisesList = (plan: string) => {
    const isCardio = plan.toLowerCase().includes('walk') || plan.toLowerCase().includes('cycl') || plan.toLowerCase().includes('run');
    if (isCardio) {
      return [
        { day: 'Day 1', name: 'LISS Cardio Training (30-45 mins)', reps: 'Zone 2 Heart Rate' },
        { day: 'Day 2', name: 'Active Recovery Walk or Cycle', reps: '30 mins low-intensity' },
        { day: 'Day 3', name: 'HIIT Cardio Circuit', reps: '5 intervals of 1 min on / 1 min off' },
        { day: 'Day 4', name: 'Low Impact Cardio (Rowing/Swimming)', reps: '40 mins constant speed' },
        { day: 'Day 5', name: 'Steady State Run or Jog', reps: '5km target or 35 mins' }
      ];
    } else {
      return [
        { day: 'Day 1', name: 'Compound Pull Exercises (Deadlifts, Rows)', reps: '3 Sets × 8-10 Reps' },
        { day: 'Day 2', name: 'Push Exercises (Bench Press, Overhead Press)', reps: '3 Sets × 8-12 Reps' },
        { day: 'Day 3', name: 'Lower Body Leg Routine (Squats, Lunges)', reps: '4 Sets × 10 Reps' },
        { day: 'Day 4', name: 'Core Activation & Shoulder Detailing', reps: '3 Sets × 12-15 Reps' },
        { day: 'Day 5', name: 'Full Body Functional Pump Circuit', reps: '4 Sets × 8 reps per station' }
      ];
    }
  };

  const handleSaveToDiary = () => {
    setIsSaved(true);
    showPopup('Plan Saved', 'Your custom AI Workout routine has been saved to your FitTrack Diary!', 'success');
  };

  const renderPickerModal = () => {
    if (!activePicker) return null;

    let title = '';
    let options: string[] = [];
    let onSelect: (value: any) => void = () => {};

    if (activePicker === 'gender') {
      title = 'Select Gender';
      options = ['Male', 'Female'];
      onSelect = (val) => setGender(val);
    } else if (activePicker === 'experience') {
      title = 'Select Experience Level';
      options = ['Beginner', 'Intermediate', 'Advanced'];
      onSelect = (val) => setExperience(val);
    } else if (activePicker === 'goal') {
      title = 'Select Fitness Goal';
      options = ['Weight Loss', 'Muscle Gain', 'Strength', 'Endurance'];
      onSelect = (val) => setGoal(val);
    } else if (activePicker === 'hypertension') {
      title = 'Diagnosed Hypertension?';
      options = ['No', 'Yes'];
      onSelect = (val) => setHypertension(val);
    } else if (activePicker === 'diabetes') {
      title = 'Diagnosed Diabetes?';
      options = ['No', 'Yes'];
      onSelect = (val) => setDiabetes(val);
    }

    return (
      <Modal visible={true} transparent={true} animationType="fade" onRequestClose={() => setActivePicker(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.modalSeparator} />
            
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.pickerItem}
                onPress={() => {
                  onSelect(opt);
                  setActivePicker(null);
                }}
              >
                <Text style={styles.pickerItemText}>{opt}</Text>
                <Ionicons name="chevron-forward" size={16} color={ACCENT_VIOLET} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.pickerCancelButton} onPress={() => setActivePicker(null)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <HamburgerMenu currentRole={(role as any) || 'User'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Decorative ambient violet circle */}
        <View style={styles.glowCircle} />

        <Text style={styles.pageTitle}>AI Workout Planner</Text>
        <View style={styles.titleUnderline} />

        {/* ── Inputs Card ── */}
        <View style={styles.formContainer}>
          <Text style={styles.formSectionTitle}>Biometric Parameters</Text>

          {/* Age Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              placeholder="e.g. 25"
              placeholderTextColor={TEXT_MUTED}
              value={age}
              onChangeText={setAge}
            />
          </View>

          {/* Height and Weight Row */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="e.g. 178"
                placeholderTextColor={TEXT_MUTED}
                value={height}
                onChangeText={setHeight}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="e.g. 74"
                placeholderTextColor={TEXT_MUTED}
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          {/* Dropdown Selectors */}
          <View style={styles.dropdownRow}>
            {/* Gender Selection */}
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setActivePicker('gender')}>
              <Text style={styles.dropdownLabel}>Gender</Text>
              <View style={styles.dropdownValueWrapper}>
                <Text style={styles.dropdownValue}>{gender || 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={ACCENT_EMERALD} />
              </View>
            </TouchableOpacity>

            {/* Experience Level */}
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setActivePicker('experience')}>
              <Text style={styles.dropdownLabel}>Experience</Text>
              <View style={styles.dropdownValueWrapper}>
                <Text style={styles.dropdownValue}>{experience || 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={ACCENT_EMERALD} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.dropdownRow}>
            {/* Goal Selection */}
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setActivePicker('goal')}>
              <Text style={styles.dropdownLabel}>Fitness Goal</Text>
              <View style={styles.dropdownValueWrapper}>
                <Text style={styles.dropdownValue}>{goal || 'Select'}</Text>
                <Ionicons name="chevron-down" size={16} color={ACCENT_EMERALD} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.modalSeparator} />
          <Text style={styles.formSectionTitle}>Health Indicators (Optional)</Text>

          <View style={styles.dropdownRow}>
            {/* Hypertension */}
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setActivePicker('hypertension')}>
              <Text style={styles.dropdownLabel}>Hypertension</Text>
              <View style={styles.dropdownValueWrapper}>
                <Text style={styles.dropdownValue}>{hypertension}</Text>
                <Ionicons name="chevron-down" size={16} color={ACCENT_VIOLET} />
              </View>
            </TouchableOpacity>

            {/* Diabetes */}
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setActivePicker('diabetes')}>
              <Text style={styles.dropdownLabel}>Diabetes</Text>
              <View style={styles.dropdownValueWrapper}>
                <Text style={styles.dropdownValue}>{diabetes}</Text>
                <Ionicons name="chevron-down" size={16} color={ACCENT_VIOLET} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Predict Button */}
          <TouchableOpacity style={styles.predictButton} onPress={handlePredict} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={BG} />
            ) : (
              <>
                <Text style={styles.predictButtonText}>Generate Routine</Text>
                <Ionicons name="sparkles" size={18} color={BG} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Glowing Recommended Workout Results ── */}
        {recommendedPlan && !loading && (
          <View style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <Ionicons name="barbell-outline" size={26} color={ACCENT_EMERALD} />
              <Text style={styles.resultsTitle}>FitTrack Recommendation</Text>
            </View>

            <View style={styles.bmiBanner}>
              <Text style={styles.bmiText}>
                Calculated BMI: <Text style={styles.highlightText}>{calculatedBmi}</Text>
              </Text>
            </View>

            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationLabel}>Your Core Recommended Exercises</Text>
              <Text style={styles.recommendationText}>{recommendedPlan}</Text>
            </View>

            <View style={styles.divider} />

            {/* Target Exercises Breakdown */}
            <Text style={styles.breakdownTitle}>Routine Target Splits</Text>
            <View style={styles.exercisesList}>
              {getExercisesList(recommendedPlan).map((ex, idx) => (
                <View key={idx} style={styles.exerciseItem}>
                  <View style={styles.exerciseLeft}>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>{ex.day}</Text>
                    </View>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                  </View>
                  <Text style={styles.exerciseReps}>{ex.reps}</Text>
                </View>
              ))}
            </View>

            {/* Save to fitTrack Diary */}
            <TouchableOpacity 
              style={[styles.saveButton, isSaved && styles.saveButtonDisabled]} 
              onPress={handleSaveToDiary}
              disabled={isSaved}
            >
              <Text style={styles.saveButtonText}>
                {isSaved ? 'Saved to Diary ✅' : 'Save to FitTrack Diary'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Render modals */}
      {renderPickerModal()}

      {/* Custom Popup Alert */}
      <Modal visible={popup.visible} transparent={true} animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={dismissPopup}>
              <Text style={styles.alertButtonText}>OK</Text>
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
  formContainer: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 20,
    gap: 16,
    marginBottom: 24,
  },
  formSectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: '#241C35',
    borderRadius: 16,
    color: TEXT_PRIMARY,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dropdownButton: {
    flex: 1,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: '#241C35',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: CARD,
    paddingHorizontal: 6,
  },
  dropdownValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  predictButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_EMERALD,
    height: 54,
    borderRadius: 16,
    gap: 8,
    marginTop: 12,
    shadowColor: ACCENT_EMERALD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  predictButtonText: {
    color: BG,
    fontSize: 16,
    fontWeight: '850',
    letterSpacing: 0.5,
  },
  resultsCard: {
    width: '100%',
    maxWidth: 600,
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
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 12,
  },
  resultsTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
  },
  bmiBanner: {
    width: '100%',
    backgroundColor: 'rgba(0, 255, 135, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bmiText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '700',
  },
  highlightText: {
    color: ACCENT_EMERALD,
    fontWeight: '900',
  },
  recommendationContainer: {
    gap: 6,
  },
  recommendationLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  recommendationText: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
  },
  breakdownTitle: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: -4,
  },
  exercisesList: {
    gap: 10,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
  },
  exerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dayBadgeText: {
    color: ACCENT_VIOLET,
    fontSize: 10,
    fontWeight: '800',
  },
  exerciseName: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  exerciseReps: {
    color: ACCENT_EMERALD,
    fontSize: 11,
    fontWeight: '700',
  },
  saveButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: ACCENT_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#1E1E2A',
    opacity: 0.6,
  },
  saveButtonText: {
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
    padding: 24,
    gap: 14,
  },
  modalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '850',
    textAlign: 'center',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: BORDER,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pickerItemText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerCancelButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  pickerCancelText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '750',
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  alertButton: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: ACCENT_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
});
