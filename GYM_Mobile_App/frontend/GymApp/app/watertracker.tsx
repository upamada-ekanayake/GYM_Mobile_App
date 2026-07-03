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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
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

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';

interface WaterLogEntry {
  timestamp: string;
  amount: number;
}

export default function WaterTrackerScreen() {
  const router = useRouter();
  const userId = Session.getUserId();

  /* ── State Hooks ── */
  const [waterTarget, setWaterTarget] = useState<number>(2500); // default
  const [waterLogs, setWaterLogs] = useState<WaterLogEntry[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
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

  /* ── Fetch User Details & Logs ── */
  const loadUserDetails = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/user-details/${userId}`);
      const data = await response.json();
      if (response.ok && data.user) {
        if (data.user.WaterTarget) {
          setWaterTarget(Number(data.user.WaterTarget));
        }
        if (data.user.WaterLog) {
          setWaterLogs(data.user.WaterLog);
        }
      }
    } catch (err) {
      console.warn('Error loading water logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  /* ── Calculate Today's Intake ── */
  const getTodayIntake = () => {
    const todayStr = new Date().toDateString();
    return waterLogs
      .filter((log) => new Date(log.timestamp).toDateString() === todayStr)
      .reduce((sum, log) => sum + log.amount, 0);
  };

  const todayIntake = getTodayIntake();
  const percentage = Math.min(Math.round((todayIntake / waterTarget) * 100), 100);

  /* ── Log Water intake ── */
  const handleAddWater = async (amount: number) => {
    if (!userId) {
      showPopup('Session Expired', 'Please login to track your daily intake.', 'error');
      return;
    }
    if (amount <= 0 || isNaN(amount)) {
      showPopup('Invalid Amount', 'Please enter a valid water amount.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/user-log-water/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (response.ok) {
        setWaterLogs((prev) => [...prev, data.entry]);
        setCustomAmount('');
        showPopup('Logged', `Added ${amount}ml to daily intake!`, 'success');
      } else {
        showPopup('Error', data.message || 'Could not log intake.', 'error');
      }
    } catch (err) {
      showPopup('Error', 'Network connection failure.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const todayLogs = waterLogs.filter(
    (log) => new Date(log.timestamp).toDateString() === new Date().toDateString()
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <HamburgerMenu currentRole="User" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Analyzing intake profile...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Water Hub</Text>
            <Text style={styles.subTitle}>Track and optimize hydration baseline</Text>
          </View>

          {/* Progress Circular Hub */}
          <View style={styles.progressHub}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Ionicons name="water" size={48} color={percentage >= 100 ? ACCENT_EMERALD : ACCENT} />
                <Text style={styles.percentageText}>{percentage}%</Text>
                <Text style={styles.progressLabel}>
                  {todayIntake} / {waterTarget} ml
                </Text>
              </View>
            </View>
          </View>

          {/* Quick-Add Buttons */}
          <Text style={styles.sectionLabel}>Quick Hydration Log</Text>
          <View style={styles.quickAddRow}>
            {[250, 500, 750].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAddCard}
                onPress={() => handleAddWater(amount)}
                activeOpacity={0.8}
                disabled={isActionLoading}
              >
                <Ionicons name="water-outline" size={24} color={ACCENT_EMERALD} />
                <Text style={styles.quickAddText}>+{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Precise Log Form */}
          <View style={styles.customIntakeCard}>
            <Text style={styles.cardHeader}>Custom Intake Entry</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter amount in ml (e.g. 350)"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddWater(Number(customAmount))}
                activeOpacity={0.8}
                disabled={isActionLoading || !customAmount}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Logs list */}
          <Text style={styles.sectionLabel}>Today's Log Timeline</Text>
          {todayLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="hourglass-outline" size={32} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>No hydration logs for today yet.</Text>
            </View>
          ) : (
            todayLogs.map((log, index) => (
              <View key={index} style={styles.logCard}>
                <View style={styles.logLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="checkmark" size={16} color={ACCENT_EMERALD} />
                  </View>
                  <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                </View>
                <Text style={styles.logAmount}>+{log.amount} ml</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Alert popup */}
      <Modal visible={popup.visible} transparent={true} animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={dismissPopup} activeOpacity={0.85}>
              <Text style={styles.modalButtonText}>OK</Text>
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
    // Glow effect
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
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
    fontWeight: '600',
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
  quickAddRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickAddCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickAddText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '700',
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
  inputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
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
    width: 80,
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
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTime: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  logAmount: {
    color: ACCENT_EMERALD,
    fontSize: 15,
    fontWeight: '700',
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
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
});
