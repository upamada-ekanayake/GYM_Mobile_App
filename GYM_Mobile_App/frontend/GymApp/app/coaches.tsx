import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HamburgerMenu from '../components/HamburgerMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Colour Tokens ── */
const ACCENT = '#3B82F6';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#2A2A2A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#AAAAAA';
const TEXT_MUTED = '#555555';
const SUCCESS_GREEN = '#22C55E';

/* ── Backend Config ── */
const BACKEND_URL = 'http://192.168.1.5:5000';

export default function CoachesScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const currentRole = (role as string) || 'User';

  const [coachPosts, setCoachPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Alert Popup State ── */
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showPopup = (title: string, message: string) => {
    setPopup({ visible: true, title, message });
  };

  const dismissPopup = () => {
    setPopup({ visible: false, title: '', message: '' });
  };

  const fetchCoachPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/coachposts/coach-post-get-all`);
      const data = await response.json();
      if (response.status === 200 && data.coachposts) {
        // Reverse array so that newest coach posts appear first in the feed
        setCoachPosts([...data.coachposts].reverse());
      } else {
        setCoachPosts([]);
      }
    } catch (error) {
      setCoachPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachPosts();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole={currentRole as any} />

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>Coaches</Text>
        <View style={styles.titleUnderline} />
        <LinearGradient colors={[BG, 'rgba(13, 13, 13, 0)']} style={styles.fadeOverlay} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading Coaches...</Text>
        </View>
      ) : coachPosts.length === 0 ? (
        /* ── Empty State ── */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏃‍♂️</Text>
          <Text style={styles.emptyTitle}>No Coaches Available</Text>
          <Text style={styles.emptySubtitle}>Check back later to find professional coaches near you.</Text>
        </View>
      ) : (
        /* ── Coaches Feed ── */
        <ScrollView style={styles.feedContainer} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
          {coachPosts.map((item) => (
            <View key={item._id} style={styles.coachCard}>
              {/* Coach Image (3:2 ratio) */}
              {item.postimage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.postimage }} style={[styles.coachImage, { height: (SCREEN_WIDTH * 2) / 3 }]} />
                </View>
              ) : null}

              {/* Coach Details */}
              <View style={styles.cardBody}>
                {/* Name */}
                <Text style={styles.coachName}>{item.fullname || 'Fitness Coach'}</Text>

                {/* Centered Description Text */}
                <Text style={[styles.description, { textAlign: 'center', marginBottom: 20 }]}>{item.description}</Text>

                {/* Experience */}
                <Text style={styles.sectionLabel}>Experience</Text>
                <Text style={[styles.description, { marginBottom: 20 }]}>{item.experience}</Text>

                {/* Fee and Duration */}
                <View style={styles.postDetailsGrid}>
                  <View style={styles.postDetailRow}>
                    <Ionicons name="cash-outline" size={16} color={SUCCESS_GREEN} />
                    <Text style={styles.postDetailText}><Text style={styles.boldLabel}>Fee:</Text> Rs. {item.fee}</Text>
                  </View>

                  <View style={styles.postDetailRow}>
                    <Ionicons name="time-outline" size={16} color={ACCENT} />
                    <Text style={styles.postDetailText}><Text style={styles.boldLabel}>Duration:</Text> {item.duration} Months</Text>
                  </View>
                </View>

                {/* Contact number banner */}
                <View style={styles.contactWrapperCard}>
                  <Ionicons name="call" size={16} color={BG} />
                  <Text style={styles.contactText}>Contact me: {item.contactNumber}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Global Alert Popup ── */}
      <Modal visible={popup.visible} transparent animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={dismissPopup}>
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
    gap: 12,
  },
  loadingText: {
    color: TEXT_SECONDARY,
    fontSize: 16,
    letterSpacing: 0.5,
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
  glowCircle: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT,
    opacity: 0.06,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  feedContainer: {
    flex: 1,
    width: '100%',
  },
  feedContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },

  /* ── Coach Feed Card ── */
  coachCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  coachImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 22,
  },
  coachName: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  postDetailsGrid: {
    gap: 10,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  postDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postDetailText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  boldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
  },
  description: {
    fontSize: 14.5,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  contactWrapperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  contactText: {
    color: BG,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ── Modal Overlay ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
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
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
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
