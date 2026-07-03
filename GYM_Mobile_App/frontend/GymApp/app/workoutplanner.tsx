import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HamburgerMenu from '../components/HamburgerMenu';
import { Session } from '../constants/Session';
import { useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Colour Tokens ── */
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

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';

interface Workout {
  _id: string;
  workoutName: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  dayOfWeek: string;
  category: 'Volume' | 'Time';
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function WorkoutPlannerScreen() {
  const { role } = useLocalSearchParams();
  const userId = Session.getUserId();

  /* ── State Hooks ── */
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  /* ── Add Workout Modal State ── */
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [workoutName, setWorkoutName] = useState<string>('');
  const [sets, setSets] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [exerciseCategory, setExerciseCategory] = useState<'Volume' | 'Time'>('Volume');

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

  /* ── Fetch Planned Workouts ── */
  const fetchPlannedWorkouts = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/workouts/user-workout-get-all-details/${userId}`);
      const data = await response.json();
      if (response.ok && data.workouts) {
        setWorkouts(data.workouts);
      }
    } catch (err) {
      console.warn('Error loading plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannedWorkouts();
  }, [userId]);

  /* ── Save Workout Plan ── */
  const handleSaveWorkout = async () => {
    if (!userId) {
      showPopup('Session Expired', 'Please login to configure routines.', 'error');
      return;
    }
    if (!workoutName.trim() || !sets.trim()) {
      showPopup('Validation Error', 'Workout Name and Sets are required.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      // Structure based on Category
      const setsNum = Number(sets);
      const weightNum = Number(weight) || 0;
      const repsNum = exerciseCategory === 'Volume' ? Number(reps) || 0 : 0;
      const durationNum = exerciseCategory === 'Time' ? Number(duration) || 0 : 0;

      const response = await fetch(`${BACKEND_URL}/api/workouts/user-workout-create/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutName: workoutName.trim(),
          sets: setsNum,
          reps: repsNum,
          weight: weightNum,
          duration: durationNum,
          dayOfWeek: selectedDay,
          category: exerciseCategory,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Workout list returns updated list
        await fetchPlannedWorkouts();
        setAddModalVisible(false);
        // Clear fields
        setWorkoutName('');
        setSets('');
        setReps('');
        setWeight('');
        setDuration('');
        showPopup('Routine Configured', `${workoutName} planned for ${selectedDay}!`, 'success');
      } else {
        showPopup('Error', data.message || 'Could not save routine.', 'error');
      }
    } catch (err) {
      showPopup('Error', 'Connection failure.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter((w) => w.dayOfWeek === selectedDay);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <HamburgerMenu currentRole="User" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Syncing routines calendar...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Routine Planner</Text>
            <Text style={styles.subTitle}>Configure routines per day of the week</Text>
          </View>

          {/* 7-Day Selector Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContainer}
          >
            {DAYS_OF_WEEK.map((day) => {
              const isActive = selectedDay === day;
              const hasWorkouts = workouts.some((w) => w.dayOfWeek === day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, isActive && styles.dayTabActive]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                    {day.substring(0, 3)}
                  </Text>
                  {hasWorkouts && (
                    <View style={[styles.dotMarker, isActive && styles.dotMarkerActive]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Planned Routines list */}
          <View style={styles.routineListHeader}>
            <Text style={styles.sectionLabel}>{selectedDay}'s Routine</Text>
            <TouchableOpacity
              style={styles.addRoutineBtn}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={ACCENT_EMERALD} />
              <Text style={styles.addRoutineText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {filteredWorkouts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={32} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>Rest Day! No routines scheduled for {selectedDay}.</Text>
            </View>
          ) : (
            filteredWorkouts.map((workout, index) => (
              <View key={index} style={styles.workoutCard}>
                <View style={styles.cardLeft}>
                  <View style={[styles.categoryBadge, workout.category === 'Time' ? styles.timeBadge : styles.volumeBadge]}>
                    <Text style={styles.categoryBadgeText}>
                      {workout.category || 'Volume'}
                    </Text>
                  </View>
                  <Text style={styles.workoutTitle}>{workout.workoutName}</Text>
                  <Text style={styles.workoutStats}>
                    {workout.sets} Sets ×{' '}
                    {workout.category === 'Time'
                      ? `${workout.duration}s`
                      : `${workout.reps} Reps`}{' '}
                    | {workout.weight} kg
                  </Text>
                </View>
                <Ionicons
                  name={workout.category === 'Time' ? 'timer-outline' : 'barbell-outline'}
                  size={20}
                  color={ACCENT}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Exercise Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Routine ({selectedDay})</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
                </TouchableOpacity>
              </View>

              {/* Exercise Category Selector */}
              <Text style={styles.inputLabel}>Tracking Method</Text>
              <View style={styles.categorySelector}>
                <TouchableOpacity
                  style={[styles.categoryBtn, exerciseCategory === 'Volume' && styles.categoryBtnActive]}
                  onPress={() => setExerciseCategory('Volume')}
                >
                  <Text style={[styles.categoryBtnText, exerciseCategory === 'Volume' && styles.categoryBtnTextActive]}>
                    Volume (Sets × Reps)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryBtn, exerciseCategory === 'Time' && styles.categoryBtnActive]}
                  onPress={() => setExerciseCategory('Time')}
                >
                  <Text style={[styles.categoryBtnText, exerciseCategory === 'Time' && styles.categoryBtnTextActive]}>
                    Time (Sets × Duration)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form fields */}
              <Text style={styles.inputLabel}>Exercise Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bench Press"
                placeholderTextColor={TEXT_MUTED}
                value={workoutName}
                onChangeText={setWorkoutName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 4"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={sets}
                    onChangeText={setSets}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 40"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>

              {exerciseCategory === 'Volume' ? (
                <View>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={reps}
                    onChangeText={setReps}
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.inputLabel}>Duration (Seconds)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 60"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveWorkout}
                activeOpacity={0.8}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.saveBtnText}>Plan Routine</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    marginBottom: 24,
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
  carouselContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  dayTab: {
    width: 60,
    height: 70,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dayTabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  dayTabText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '700',
  },
  dayTabTextActive: {
    color: TEXT_PRIMARY,
  },
  dotMarker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT_EMERALD,
  },
  dotMarkerActive: {
    backgroundColor: TEXT_PRIMARY,
  },
  routineListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRoutineText: {
    color: ACCENT_EMERALD,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  volumeBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  timeBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  categoryBadgeText: {
    color: TEXT_PRIMARY,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  workoutTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  workoutStats: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
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
  inputLabel: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
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
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  categoryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  categoryBtnActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  categoryBtnText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryBtnTextActive: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  saveBtn: {
    height: 48,
    backgroundColor: ACCENT_EMERALD,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: BG,
    fontWeight: '800',
    fontSize: 14,
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

