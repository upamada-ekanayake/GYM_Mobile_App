import React, { useState, useEffect, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HamburgerMenu from '../components/HamburgerMenu';
import { Session } from '../constants/Session';

/* ── Colour Tokens (matching app-wide theme) ── */
const ACCENT = '#3B82F6'; // Vibrant blue
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#2A2A2A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#AAAAAA';
const TEXT_MUTED = '#555555';
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
}

export default function WorkoutsScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const userId = Session.getUserId();

  /* ── State Hooks ── */
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /* ── Modal Visibility States ── */
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  /* ── Add Form State ── */
  const [workoutName, setWorkoutName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [duration, setDuration] = useState('');

  /* ── Edit Form State ── */
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editDuration, setEditDuration] = useState('');

  /* ── Keyboard Height State ── */
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /* ── Custom Popup/Alert State ── */
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

  /* ── Initial Load & Fetch ── */
  useEffect(() => {
    if (!userId) {
      showPopup('Session Expired', 'Please login to track your workouts.', 'error');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      return;
    }
    fetchWorkouts();
  }, [userId]);

  const fetchWorkouts = async (showFullLoading = true) => {
    if (!userId) return;
    if (showFullLoading) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/workouts/user-workout-get-all-details/${userId}`);
      const data = await response.json();
      if (response.status === 200 && data.workouts) {
        // Reverse workouts array so that the newest ones are displayed at the top
        setWorkouts([...data.workouts].reverse());
      } else {
        console.warn('Failed to fetch workouts:', data.message);
        setWorkouts([]);
      }
    } catch (err) {
      console.warn('Network error fetching workouts:', err);
      setWorkouts([]);
    } finally {
      if (showFullLoading) {
        setIsLoading(false);
      }
    }
  };

  /* ── Custom Popup Triggers ── */
  const showPopup = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setPopup({ visible: true, title, message, type });
  };

  const dismissPopup = () => {
    setPopup({ visible: false, title: '', message: '', type: 'info' });
  };

  /* ── Add Workout Action ── */
  const handleAddWorkout = async () => {
    // Keyboard should automatically dismiss when Add Workout button is pressed
    Keyboard.dismiss();

    if (!workoutName.trim()) {
      showPopup('Validation Error', 'Please enter a Workout Name.', 'error');
      return;
    }
    if (sets === '' || isNaN(Number(sets)) || Number(sets) < 0) {
      showPopup('Validation Error', 'Sets cannot be a negative value.', 'error');
      return;
    }
    if (reps === '' || isNaN(Number(reps)) || Number(reps) < 0) {
      showPopup('Validation Error', 'Reps cannot be a negative value.', 'error');
      return;
    }
    if (weight === '' || isNaN(Number(weight)) || Number(weight) < 0) {
      showPopup('Validation Error', 'Weight cannot be a negative value.', 'error');
      return;
    }
    const durationNum = Number(duration);
    if (duration === '' || isNaN(durationNum) || durationNum < 0 || durationNum > 60) {
      showPopup('Validation Error', 'Duration must be between 0 and 60 minutes.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workouts/user-workout-create/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workoutName: workoutName.trim(),
          sets: Number(sets),
          reps: Number(reps),
          weight: Number(weight),
          duration: Number(duration),
        }),
      });

      const data = await response.json();
      if (response.status === 201) {
        setAddModalVisible(false);
        // Clear fields
        setWorkoutName('');
        setSets('');
        setReps('');
        setWeight('');
        setDuration('');

        // Refresh workouts list
        await fetchWorkouts(false);
      } else {
        showPopup('Error', data.message || 'Failed to create workout.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Open Edit modal & Load Details ── */
  const openEditModal = async (workoutId: string) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/workouts/user-workout-get-details/${userId}/${workoutId}`);
      const data = await response.json();
      if (response.status === 200 && data.workout) {
        const w: Workout = data.workout;
        setSelectedWorkout(w);
        setEditSets(String(w.sets));
        setEditReps(String(w.reps));
        setEditWeight(String(w.weight));
        setEditDuration(String(w.duration));
        setEditModalVisible(true);
      } else {
        showPopup('Error', data.message || 'Failed to fetch workout details.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Update Workout Action ── */
  const handleUpdateWorkout = async () => {
    // Keyboard should automatically dismiss when Update Workout button is pressed
    Keyboard.dismiss();

    if (!selectedWorkout) return;

    if (editSets === '' || isNaN(Number(editSets)) || Number(editSets) < 0) {
      showPopup('Validation Error', 'Sets cannot be a negative value.', 'error');
      return;
    }
    if (editReps === '' || isNaN(Number(editReps)) || Number(editReps) < 0) {
      showPopup('Validation Error', 'Reps cannot be a negative value.', 'error');
      return;
    }
    if (editWeight === '' || isNaN(Number(editWeight)) || Number(editWeight) < 0) {
      showPopup('Validation Error', 'Weight cannot be a negative value.', 'error');
      return;
    }
    const durationNum = Number(editDuration);
    if (editDuration === '' || isNaN(durationNum) || durationNum < 0 || durationNum > 60) {
      showPopup('Validation Error', 'Duration must be between 0 and 60 minutes.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const updatePromises: Promise<Response>[] = [];

      // Check what fields were changed compared to pre-filled values
      if (Number(editSets) !== selectedWorkout.sets) {
        updatePromises.push(
          fetch(`${BACKEND_URL}/api/workouts/user-workout-update-sets/${userId}/${selectedWorkout._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sets: Number(editSets) }),
          })
        );
      }

      if (Number(editReps) !== selectedWorkout.reps) {
        updatePromises.push(
          fetch(`${BACKEND_URL}/api/workouts/user-workout-update-reps/${userId}/${selectedWorkout._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reps: Number(editReps) }),
          })
        );
      }

      if (Number(editWeight) !== selectedWorkout.weight) {
        updatePromises.push(
          fetch(`${BACKEND_URL}/api/workouts/user-workout-update-weight/${userId}/${selectedWorkout._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: Number(editWeight) }),
          })
        );
      }

      if (Number(editDuration) !== selectedWorkout.duration) {
        updatePromises.push(
          fetch(`${BACKEND_URL}/api/workouts/user-workout-update-duration/${userId}/${selectedWorkout._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration: Number(editDuration) }),
          })
        );
      }

      if (updatePromises.length > 0) {
        const responses = await Promise.all(updatePromises);
        const hasFailed = responses.some(res => res.status !== 200);

        if (!hasFailed) {
          setEditModalVisible(false);
          await fetchWorkouts(false);
          showPopup('Success', 'Workout updated successfully', 'success');
        } else {
          showPopup('Error', 'Some updates failed to complete.', 'error');
        }
      } else {
        // Nothing changed
        setEditModalVisible(false);
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Delete Workout Action ── */
  const handleDeleteWorkout = async () => {
    if (!selectedWorkout) return;
    setDeleteConfirmVisible(false);
    setIsActionLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/workouts/user-workout-delete/${userId}/${selectedWorkout._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.status === 200) {
        setEditModalVisible(false);
        setSelectedWorkout(null);
        await fetchWorkouts(false);
      } else {
        showPopup('Error', data.message || 'Failed to delete workout.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole={(role as any) || 'User'} />

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        {/* ── Decorative Glow Accent ── */}
        <View style={styles.glowCircle} />

        {/* ── Page Heading ── */}
        <Text style={styles.pageTitle}>Workouts</Text>
        <View style={styles.titleUnderline} />

        {/* ── Shaded Fade Overlay at bottom ── */}
        <LinearGradient
          colors={[BG, 'rgba(13, 13, 13, 0)']}
          style={styles.fadeOverlay}
        />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Workouts List / State Layout ── */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading workouts...</Text>
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No workouts added yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button below to create your first workout.</Text>
          </View>
        ) : (
          <View style={styles.workoutsContainer}>
            {workouts.map((item) => (
              <View key={item._id} style={styles.workoutCard}>
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={{ width: 30 }} />
                  <Text style={styles.workoutNameText}>{item.workoutName}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(item._id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={22} color={ACCENT} />
                  </TouchableOpacity>
                </View>

                {/* Specs Info Grid: 2-column layout */}
                <View style={styles.statsGrid}>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Ionicons name="layers-outline" size={16} color={TEXT_MUTED} />
                        <Text style={styles.statLabel}>Sets</Text>
                      </View>
                      <Text style={styles.statValue}>{item.sets}</Text>
                    </View>

                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Ionicons name="repeat-outline" size={16} color={TEXT_MUTED} />
                        <Text style={styles.statLabel}>Reps</Text>
                      </View>
                      <Text style={styles.statValue}>{item.reps}</Text>
                    </View>
                  </View>

                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Ionicons name="fitness-outline" size={16} color={TEXT_MUTED} />
                        <Text style={styles.statLabel}>Weight</Text>
                      </View>
                      <Text style={styles.statValue}>{item.weight} kg</Text>
                    </View>

                    <View style={styles.statBox}>
                      <View style={styles.statHeader}>
                        <Ionicons name="time-outline" size={16} color={TEXT_MUTED} />
                        <Text style={styles.statLabel}>Duration</Text>
                      </View>
                      <Text style={styles.statValue}>{item.duration} min</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── 1. Floating Action Button (FAB) ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── 2. Add Workout Modal ── */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>Add Workout</Text>

            {/* Form Input Fields */}
            <View style={styles.modalFormContainer}>

              {/* Workout Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Workout Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="barbell-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Workout Name"
                    placeholderTextColor={TEXT_MUTED}
                    value={workoutName}
                    onChangeText={setWorkoutName}
                  />
                </View>
              </View>

              {/* Sets & Reps side by side */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="layers-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Sets"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={sets}
                      onChangeText={setSets}
                    />
                  </View>
                </View>

                <View style={{ width: 16 }} />

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="repeat-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Reps"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={reps}
                      onChangeText={setReps}
                    />
                  </View>
                </View>
              </View>

              {/* Weight & Duration side by side */}
              <View style={styles.row}>
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

                <View style={{ width: 16 }} />

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="time-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0 - 60"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={duration}
                      onChangeText={setDuration}
                    />
                  </View>
                </View>
              </View>

            </View>

            {/* Actions Row */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setAddModalVisible(false)}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleAddWorkout}
                disabled={isActionLoading}
                activeOpacity={0.85}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Add Workout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3. Edit Workout Modal ── */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>
              Edit {selectedWorkout?.workoutName || 'Workout'}
            </Text>

            {/* Form Input Fields */}
            <View style={styles.modalFormContainer}>

              {/* Sets & Reps side by side */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="layers-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Sets"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={editSets}
                      onChangeText={setEditSets}
                    />
                  </View>
                </View>

                <View style={{ width: 16 }} />

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="repeat-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Reps"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={editReps}
                      onChangeText={setEditReps}
                    />
                  </View>
                </View>
              </View>

              {/* Weight & Duration side by side */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="fitness-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Weight"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="numeric"
                      value={editWeight}
                      onChangeText={setEditWeight}
                    />
                  </View>
                </View>

                <View style={{ width: 16 }} />

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Duration (minutes)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="time-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0 - 60"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={editDuration}
                      onChangeText={setEditDuration}
                    />
                  </View>
                </View>
              </View>

            </View>

            {/* Actions Row */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setEditModalVisible(false)}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleUpdateWorkout}
                disabled={isActionLoading}
                activeOpacity={0.85}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Update Workout</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Delete Workout Button */}
            <TouchableOpacity
              style={[styles.deleteButton, { marginTop: 14 }]}
              onPress={() => setDeleteConfirmVisible(true)}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={ERROR_RED} />
              <Text style={styles.deleteButtonText}>Delete Workout</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* ── 4. Delete Confirmation Modal ── */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.modalConfirmText}>
              Are you sure you want to delete this workout?
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn, { backgroundColor: ERROR_RED }]}
                onPress={handleDeleteWorkout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 5. Custom Global Popup Modal ── */}
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
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 80 : 65,
    backgroundColor: BG,
    alignItems: 'center',
    width: '100%',
    zIndex: 5,
    position: 'relative',
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 6,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 100, // Extra padding to not hide cards behind FAB
  },
  glowCircle: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT,
    opacity: 0.06,
  },

  /* ── Page Title ── */
  pageTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: ACCENT,
    borderRadius: 2,
    marginBottom: 16,
  },

  /* ── Loading and Empty states ── */
  loadingContainer: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: TEXT_SECONDARY,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  emptyText: {
    color: TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  /* ── Workouts Cards ── */
  workoutsContainer: {
    width: '100%',
  },
  workoutCard: {
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  editButton: {
    padding: 4,
    width: 30,
    alignItems: 'center',
  },
  statsGrid: {
    width: '100%',
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    fontWeight: '800',
    marginTop: 2,
  },

  /* ── Floating Action Button (FAB) ── */
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  fabText: {
    fontSize: 34,
    color: BG,
    fontWeight: 'normal',
    lineHeight: 38,
  },

  /* ── Modals Overlay ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollModalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 40,
  },

  /* ── Form Popups ── */
  formModalCard: {
    width: '100%',
    backgroundColor: 'rgba(26, 26, 26, 0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 5,
    padding: 4,
  },
  formModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.4,
  },
  modalFormContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
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
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 52,
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

  /* ── Buttons ── */
  modalButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BG,
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    height: 52,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ERROR_RED,
  },

  /* ── Confirm Dialogue popup ── */
  confirmModalCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalConfirmText: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCancelBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirmBtn: {
    backgroundColor: ACCENT,
  },
  modalConfirmBtnText: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },

  /* ── Global Alert Card ── */
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.94)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
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
});
