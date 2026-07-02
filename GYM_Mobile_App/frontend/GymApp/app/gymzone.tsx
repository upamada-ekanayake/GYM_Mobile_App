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

export default function GymZoneScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const currentRole = (role as string) || 'User';

  const [gymPosts, setGymPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

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

  const fetchGymPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/gym-posts/gym-post-get-all`);
      const data = await response.json();
      if (response.status === 200 && data.gymPosts) {
        // Reverse arrays so that newest created posts appear first in the feed
        setGymPosts([...data.gymPosts].reverse());

        // Pre-expand all package pricing cards
        const expanded: Record<string, boolean> = {};
        data.gymPosts.forEach((post: any) => {
          post.packages?.forEach((pkg: any) => {
            expanded[pkg._id] = true;
          });
        });
        setExpandedPackages(expanded);
      } else {
        setGymPosts([]);
      }
    } catch (error) {
      setGymPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGymPosts();
  }, []);

  const togglePackageExpand = (pkgId: string) => {
    setExpandedPackages(prev => ({ ...prev, [pkgId]: !prev[pkgId] }));
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole={currentRole as any} />

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>Gym Zone</Text>
        <View style={styles.titleUnderline} />
        <LinearGradient colors={[BG, 'rgba(13, 13, 13, 0)']} style={styles.fadeOverlay} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading Gym Zone...</Text>
        </View>
      ) : gymPosts.length === 0 ? (
        /* ── Empty State ── */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyTitle}>No Gym Posts Available</Text>
          <Text style={styles.emptySubtitle}>Check back later to discover gyms near you.</Text>
        </View>
      ) : (
        /* ── Gym Zone Feed ── */
        <ScrollView style={styles.feedContainer} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
          {gymPosts.map((item) => (
            <View key={item._id} style={styles.gymCard}>
              {/* Gym Image (3:2 ratio) */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.gymImg }} style={[styles.gymImage, { height: (SCREEN_WIDTH * 2) / 3 }]} />
              </View>

              {/* Gym Details */}
              <View style={styles.cardBody}>
                <Text style={styles.gymName}>{item.gymId?.GymName || 'Fitness Center'}</Text>

                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={ACCENT} />
                  <Text style={styles.locationText}>{item.city}</Text>
                </View>

                <Text style={styles.description}>{item.gymInfotmation}</Text>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color={TEXT_SECONDARY} />
                    <Text style={styles.infoLabel}>Hours:</Text>
                    <Text style={styles.infoValue}>{item.openHours} - {item.closeHours}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={16} color={TEXT_SECONDARY} />
                    <Text style={styles.infoLabel}>Contact:</Text>
                    <Text style={styles.infoValue}>{item.gymContactNumber}</Text>
                  </View>
                </View>

                {/* Facilities List as chips/tags */}
                {item.gymFasilities && item.gymFasilities.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Facilities</Text>
                    <View style={styles.tagsContainer}>
                      {item.gymFasilities.map((fac: any) => (
                        <View key={fac._id} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{fac.fasility}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Packages List as pricing cards */}
                {item.packages && item.packages.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Packages</Text>
                    <View style={styles.packagesContainer}>
                      {item.packages.map((pkg: any) => (
                        <View key={pkg._id} style={styles.pricingCard}>
                          <Text style={styles.pricingName}>{pkg.packageName}</Text>
                          <View style={styles.pricingDetailItem}>
                            <Ionicons name="cash-outline" size={16} color={TEXT_MUTED} style={{ marginRight: 8 }} />
                            <Text style={styles.pricingLabel}>Price: </Text>
                            <Text style={[styles.pricingValue, styles.pricingPriceHighlight]}>Rs. {pkg.packagePrice}</Text>
                          </View>
                          <View style={styles.pricingDetailItem}>
                            <Ionicons name="calendar-outline" size={16} color={TEXT_MUTED} style={{ marginRight: 8 }} />
                            <Text style={styles.pricingLabel}>Duration: </Text>
                            <Text style={styles.pricingValue}>{pkg.packageDuration}</Text>
                          </View>
                          {pkg.features && pkg.features.length > 0 && (
                            <View style={styles.pricingFeaturesContainer}>
                              <Text style={styles.pricingFeaturesTitle}>Features:</Text>
                              {pkg.features.map((feat: string, idx: number) => (
                                <View key={idx} style={styles.pricingFeatureRow}>
                                  <Text style={styles.pricingFeatureCheckmark}>✓</Text>
                                  <Text style={styles.pricingFeatureText}>{feat}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}

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

  /* ── Gym Feed Card ── */
  gymCard: {
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
  gymImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 22,
  },
  gymName: {
    fontSize: 32,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoGrid: {
    gap: 10,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '700',
    width: 65,
  },
  infoValue: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tagChipText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: '700',
  },
  packagesContainer: {
    gap: 12,
  },
  pricingCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 14,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pricingName: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  pricingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pricingLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  pricingValue: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  pricingPriceHighlight: {
    color: ACCENT,
    fontSize: 15,
    fontWeight: '800',
  },
  pricingFeaturesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  pricingFeaturesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_SECONDARY,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pricingFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  pricingFeatureCheckmark: {
    color: SUCCESS_GREEN,
    fontSize: 14,
    fontWeight: '900',
  },
  pricingFeatureText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '500',
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
