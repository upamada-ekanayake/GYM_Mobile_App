import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
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
import { useRouter } from 'expo-router';

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
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function LiveWorkoutScreen() {
  const router = useRouter();
  const userId = Session.getUserId();

  /* ── Get Today's Weekday ── */
  const todayIndex = new Date().getDay();
  const todayName = DAYS_OF_WEEK[todayIndex];

  /* ── State Hooks ── */
  const [selectedDay, setSelectedDay] = useState<string>(todayName);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEngineActive, setIsEngineActive] = useState<boolean>(false);

  /* ── Engine State ── */
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
  const [currentSetIndex, setCurrentSetIndex] = useState<number>(0);
  const [liveSets, setLiveSets] = useState<number>(0);
  const [liveReps, setLiveReps] = useState<number>(0);
  const [liveWeight, setLiveWeight] = useState<number>(0);
  const [liveDuration, setLiveDuration] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  /* ── Timer State ── */
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

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
      console.warn('Error loading routines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannedWorkouts();
  }, [userId]);

  /* ── Timer Loop ── */
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      setTimerActive(false);
      showPopup('Timer Finished', 'Time is up! Complete this set now.', 'success');
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  /* ── Initialize Live Set HUD ── */
  const startWorkoutHUD = () => {
    const todayRoutines = workouts.filter((w) => w.dayOfWeek === selectedDay);
    if (todayRoutines.length === 0) {
      showPopup('No routines', 'You have no exercise routines planned for this day.', 'info');
      return;
    }
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    loadExercise(todayRoutines[0], 0);
    setIsEngineActive(true);
    setIsCompleted(false);
  };

  const loadExercise = (workout: Workout, setIndex: number) => {
    setLiveSets(workout.sets);
    setLiveReps(workout.reps);
    setLiveWeight(workout.weight);
    setLiveDuration(workout.duration);
    setTimeRemaining(workout.duration);
    setTimerActive(false);
  };

  const activeRoutines = workouts.filter((w) => w.dayOfWeek === selectedDay);
  const currentExercise = activeRoutines[currentExerciseIndex];

  /* ── Handle Set Submission ── */
  const handleDoneSet = () => {
    const nextSetIndex = currentSetIndex + 1;
    if (nextSetIndex < liveSets) {
      setCurrentSetIndex(nextSetIndex);
      if (currentExercise.category === 'Time') {
        setTimeRemaining(liveDuration);
        setTimerActive(false);
      }
    } else {
      // Completed all sets for the current exercise
      const nextExerciseIndex = currentExerciseIndex + 1;
      if (nextExerciseIndex < activeRoutines.length) {
        setCurrentExerciseIndex(nextExerciseIndex);
        setCurrentSetIndex(0);
        loadExercise(activeRoutines[nextExerciseIndex], 0);
      } else {
        // Workout completely finished!
        setIsEngineActive(false);
        setIsCompleted(true);
      }
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <HamburgerMenu currentRole="User" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Syncing scheduled routines...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Live HUD</Text>
            <Text style={styles.subTitle}>In-gym active workout guide</Text>
          </View>

          {isCompleted ? (
            <View style={styles.celebrationCard}>
              <Ionicons name="trophy-outline" size={64} color={ACCENT_EMERALD} />
              <Text style={styles.celebrationTitle}>Workout Completed!</Text>
              <Text style={styles.celebrationText}>
                Awesome job! You finished your scheduled routines for today.
              </Text>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => setIsCompleted(false)}
              >
                <Text style={styles.doneBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : isEngineActive && currentExercise ? (
            /* Active Live HUD Engine Card */
            <View style={styles.engineCard}>
              <View style={styles.engineHeader}>
                <View style={styles.tagRow}>
                  <View style={[styles.badge, currentExercise.category === 'Time' ? styles.timeBadge : styles.volumeBadge]}>
                    <Text style={styles.badgeText}>{currentExercise.category || 'Volume'}</Text>
                  </View>
                  <Text style={styles.exerciseCounter}>
                    Exercise {currentExerciseIndex + 1} of {activeRoutines.length}
                  </Text>
                </View>
                <Text style={styles.activeExerciseTitle}>{currentExercise.workoutName}</Text>
              </View>

              {/* Set Info Banner */}
              <View style={styles.setInfoBanner}>
                <Text style={styles.setInfoText}>
                  SET {currentSetIndex + 1} of {liveSets}
                </Text>
              </View>

              {/* Stepper Controls */}
              <View style={styles.stepperContainer}>
                {/* Weight Stepper */}
                <View style={styles.stepperItem}>
                  <Text style={styles.stepperLabel}>Weight (kg)</Text>
                  <View style={styles.stepperControls}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setLiveWeight((w) => Math.max(w - 2.5, 0))}
                    >
                      <Ionicons name="remove" size={20} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{liveWeight} kg</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setLiveWeight((w) => w + 2.5)}
                    >
                      <Ionicons name="add" size={20} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                  </View>
                </View>

                {currentExercise.category === 'Time' ? (
                  /* Time Controls */
                  <View style={styles.timerWrapper}>
                    <Text style={styles.stepperLabel}>Countdown Timer</Text>
                    <Text style={styles.timerValue}>{timeRemaining}s</Text>
                    <View style={styles.timerControls}>
                      <TouchableOpacity
                        style={[styles.timerActionBtn, timerActive ? styles.stopBtn : styles.startBtn]}
                        onPress={() => setTimerActive((a) => !a)}
                      >
                        <Ionicons
                          name={timerActive ? 'pause-outline' : 'play-outline'}
                          size={18}
                          color={TEXT_PRIMARY}
                        />
                        <Text style={styles.timerActionText}>{timerActive ? 'Pause' : 'Start'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.timerResetBtn}
                        onPress={() => {
                          setTimerActive(false);
                          setTimeRemaining(liveDuration);
                        }}
                      >
                        <Ionicons name="refresh-outline" size={18} color={TEXT_PRIMARY} />
                        <Text style={styles.timerActionText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Reps Stepper */
                  <View style={styles.stepperItem}>
                    <Text style={styles.stepperLabel}>Reps</Text>
                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setLiveReps((r) => Math.max(r - 1, 0))}
                      >
                        <Ionicons name="remove" size={20} color={TEXT_PRIMARY} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{liveReps}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setLiveReps((r) => r + 1)}
                      >
                        <Ionicons name="add" size={20} color={TEXT_PRIMARY} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Complete Set Trigger */}
              <TouchableOpacity
                style={styles.doneSetBtn}
                onPress={handleDoneSet}
                activeOpacity={0.8}
              >
                <Text style={styles.doneSetBtnText}>Complete Set</Text>
                <Ionicons name="checkmark-circle" size={20} color={BG} />
              </TouchableOpacity>
            </View>
          ) : (
            /* General Hub: Routine schedule for today */
            <View style={styles.introCard}>
              <Text style={styles.introHeader}>Today's Target Routine</Text>
              
              {/* Day selector drop down */}
              <View style={styles.pickerRow}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.smallDayTab, selectedDay === day && styles.smallDayTabActive]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text style={[styles.smallDayTabText, selectedDay === day && styles.smallDayTabTextActive]}>
                      {day.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.targetDayTitle}>Routines for {selectedDay}</Text>

              {activeRoutines.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="calendar-outline" size={32} color={TEXT_MUTED} />
                  <Text style={styles.emptyText}>No routines planned for {selectedDay}.</Text>
                </View>
              ) : (
                <View style={styles.routinesList}>
                  {activeRoutines.map((routine, idx) => (
                    <View key={idx} style={styles.routineRow}>
                      <Ionicons name="ellipse" size={8} color={ACCENT} />
                      <Text style={styles.routineRowText}>
                        {routine.workoutName} - {routine.sets} Sets ×{' '}
                        {routine.category === 'Time' ? `${routine.duration}s` : `${routine.reps} Reps`}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.startWorkoutBtn}
                    onPress={startWorkoutHUD}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startWorkoutBtnText}>Start Workout</Text>
                    <Ionicons name="play" size={18} color={BG} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

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
  introCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 22,
  },
  introHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  smallDayTab: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: BORDER,
    flex: 1,
    alignItems: 'center',
  },
  smallDayTabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  smallDayTabText: {
    color: TEXT_SECONDARY,
    fontSize: 11,
    fontWeight: '700',
  },
  smallDayTabTextActive: {
    color: TEXT_PRIMARY,
  },
  targetDayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 14,
  },
  routinesList: {
    gap: 12,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  routineRowText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
  },
  startWorkoutBtn: {
    height: 48,
    backgroundColor: ACCENT_EMERALD,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    shadowColor: ACCENT_EMERALD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  startWorkoutBtnText: {
    color: BG,
    fontWeight: '800',
    fontSize: 15,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 13,
    marginTop: 10,
  },
  celebrationCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  celebrationText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  doneBtn: {
    height: 46,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
  engineCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 24,
  },
  engineHeader: {
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  volumeBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  timeBadge: {
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
  },
  badgeText: {
    color: TEXT_PRIMARY,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  exerciseCounter: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '600',
  },
  activeExerciseTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '800',
  },
  setInfoBanner: {
    backgroundColor: 'rgba(138, 43, 226, 0.08)',
    borderColor: 'rgba(138, 43, 226, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  setInfoText: {
    color: ACCENT,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  stepperContainer: {
    gap: 20,
    marginBottom: 30,
  },
  stepperItem: {
    gap: 8,
  },
  stepperLabel: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 8,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  timerWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  startBtn: {
    backgroundColor: SUCCESS_GREEN,
  },
  stopBtn: {
    backgroundColor: ERROR_RED,
  },
  timerResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  timerActionText: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
  doneSetBtn: {
    height: 52,
    backgroundColor: ACCENT_EMERALD,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  doneSetBtnText: {
    color: BG,
    fontWeight: '800',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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

