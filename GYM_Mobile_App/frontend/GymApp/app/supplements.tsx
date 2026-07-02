import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HamburgerMenu from '../components/HamburgerMenu';
import { Session } from '../constants/Session';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Colour Tokens ── */
const ACCENT = '#3B82F6';
const BG = '#0D0D0D';
const CARD = '#1A1A1A';
const BORDER = '#2A2A2A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#AAAAAA';
const TEXT_MUTED = '#555555';
const ERROR_RED = '#EF4444';
const SUCCESS_GREEN = '#22C55E';

/* ── Backend Config ── */
const BACKEND_URL = 'http://192.168.1.5:5000';

interface SupplementPost {
  _id: string;
  SupplementName: string;
  SupplementBrand: string;
  SupplementType: string;
  SupplementDescription: string;
  SupplementPrice: number;
  SupplementStock: number;
  SupplementAvailable: boolean;
  SupplementImage: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupplementsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { role } = useLocalSearchParams();
  const currentRole = (role as string) || 'User';
  const userId = Session.getUserId();
  const adminId = userId;

  /* ── State Hooks ── */
  const [supplements, setSupplements] = useState<SupplementPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminApproved, setIsAdminApproved] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /* ── Buy Modal Form State ── */
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementPost | null>(null);
  const [selectedSupplementPrice, setSelectedSupplementPrice] = useState<number>(0);
  
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [amount, setAmount] = useState('0');

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /* ── Alert Popup State ── */
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

  /* ── Keyboard Listeners ── */
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

  /* ── Fetch Supplements ── */
  const fetchSupplements = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/supplements/supplement-post-get-all`);
      const data = await response.json();
      if (response.status === 200 && data.Supplement) {
        // Reverse array to show newest first
        setSupplements([...data.Supplement].reverse());
      } else {
        setSupplements([]);
      }
    } catch (error) {
      console.warn('Error fetching supplements:', error);
      setSupplements([]);
    } finally {
      if (showLoadingIndicator) {
        setIsLoading(false);
      }
    }
  };

  /* ── Check Admin Approval Status ── */
  const checkAdminApproval = async () => {
    if (currentRole !== 'Admin' || !userId) {
      setIsAdminApproved(false);
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/admin-get-approval-status/${userId}`);
      const data = await response.json();
      if (response.status === 200 && data.approvalStatus !== undefined) {
        setIsAdminApproved(data.approvalStatus);
      } else {
        setIsAdminApproved(false);
      }
    } catch (error) {
      console.warn('Error checking admin approval status:', error);
      setIsAdminApproved(false);
    }
  };

  /* ── Setup Page Listeners ── */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSupplements(true);
      checkAdminApproval();
    });

    fetchSupplements(true);
    checkAdminApproval();

    return unsubscribe;
  }, [navigation, currentRole, userId]);

  /* ── Expiry Date formatting helper (auto insert "/") ── */
  const handleExpiryDateChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 2) {
      cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    setExpiryDate(cleaned);
  };

  /* ── Card Number formatting helper (format as 1234 1234 1234 1234) ── */
  const handleCardNumberChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  /* ── Auto calculate Amount ── */
  useEffect(() => {
    const qty = Number(quantity);
    if (!isNaN(qty) && qty > 0 && selectedSupplementPrice > 0) {
      setAmount(String(qty * selectedSupplementPrice));
    } else {
      setAmount('0');
    }
  }, [quantity, selectedSupplementPrice]);

  /* ── Open Buy Modal ── */
  const openBuyModal = async (supplement: SupplementPost) => {
    if (!supplement.SupplementAvailable || supplement.SupplementStock <= 0) {
      showPopup('Out of Stock', 'This supplement is currently out of stock.', 'error');
      return;
    }

    setSelectedSupplement(supplement);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setQuantity('1');
    setAmount(String(supplement.SupplementPrice));
    setIsActionLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/supplements/supplement-price-by-supplement-id/${supplement._id}`);
      const data = await response.json();
      if (response.status === 200 && data.SupplementPrice !== undefined) {
        setSelectedSupplementPrice(data.SupplementPrice);
        setBuyModalVisible(true);
      } else {
        showPopup('Error', 'Failed to retrieve supplement price.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not retrieve price from server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Handle Buy Supplement API Call ── */
  const handleBuySupplement = async () => {
    Keyboard.dismiss();
    if (!selectedSupplement) return;

    // Card inputs validation
    const parsedCardNum = Number(cardNumber.replace(/\s/g, ''));
    if (!cardNumber.trim() || isNaN(parsedCardNum) || cardNumber.length < 15) {
      showPopup('Validation Error', 'Please enter a valid credit card number.', 'error');
      return;
    }

    if (!expiryDate.trim() || expiryDate.length !== 5 || !expiryDate.includes('/')) {
      showPopup('Validation Error', 'Please enter Expiry Date in MM/YY format.', 'error');
      return;
    }

    const parsedCvv = Number(cvv);
    if (!cvv.trim() || isNaN(parsedCvv) || cvv.length < 3) {
      showPopup('Validation Error', 'Please enter a valid 3-digit CVV.', 'error');
      return;
    }

    const parsedQty = Number(quantity);
    if (!quantity.trim() || isNaN(parsedQty) || parsedQty <= 0 || !Number.isInteger(parsedQty)) {
      showPopup('Validation Error', 'Quantity must be a positive integer.', 'error');
      return;
    }

    if (parsedQty > selectedSupplement.SupplementStock) {
      showPopup('Stock Insufficient', `Only ${selectedSupplement.SupplementStock} units left in stock.`, 'error');
      return;
    }

    setIsActionLoading(true);

    const payload = {
      CradNumber: parsedCardNum, // Spelled as required by backend destructuring key
      ExpiryDate: expiryDate.trim(),
      CVV: parsedCvv,
      Quantity: parsedQty,
      Amount: Number(amount),
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/supplements/supplement-buy/${selectedSupplement._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 200) {
        setBuyModalVisible(false);
        await fetchSupplements(false); // Refresh feed in background
        showPopup('Success', 'Payment Successful', 'success');
      } else {
        showPopup('Payment Failed', data.message || 'Verification details failed.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not complete payment request.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const imageWidth = SCREEN_WIDTH - 48;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole={currentRole as any} />

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>Supplements</Text>
        <View style={styles.titleUnderline} />
        <LinearGradient colors={[BG, 'rgba(13, 13, 13, 0)']} style={styles.fadeOverlay} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading supplements...</Text>
        </View>
      ) : supplements.length === 0 ? (
        /* ── Empty State ── */
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No Supplements Available</Text>
          <Text style={styles.emptySubtitle}>Check back later to buy supplements.</Text>
        </View>
      ) : (
        /* ── Shop Catalog Feed ── */
        <ScrollView
          style={styles.feedContainer}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
        >
          {supplements.map((item) => {
            const isApprovedAdmin = currentRole === 'Admin' && isAdminApproved;
            return (
              <View key={item._id} style={styles.supplementCard}>
                {/* Image Section */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.SupplementImage }} style={[styles.supplementImage, { height: (SCREEN_WIDTH * 2) / 3 }]} />

                  {/* Modern Status Badge (Top-Left) */}
                  <View style={[
                    styles.statusBadge,
                    item.SupplementAvailable && item.SupplementStock > 0 ? styles.availableBadge : styles.finishedBadge
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      item.SupplementAvailable && item.SupplementStock > 0 ? styles.availableBadgeText : styles.finishedBadgeText
                    ]}>
                      {item.SupplementAvailable && item.SupplementStock > 0 ? 'Stock Available' : 'Stock Finished'}
                    </Text>
                  </View>

                  {/* Edit Pencil Icon (Top-Right, Admin Only) */}
                  {isApprovedAdmin && (
                    <TouchableOpacity
                      style={styles.editButtonBadge}
                      onPress={() => router.push({
                        pathname: '/createsupplementpost',
                        params: { editMode: 'true', supplementPostId: item._id, adminId }
                      } as any)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={20} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Supplement Info Body */}
                <View style={styles.cardBody}>
                  {/* Name (Centered, large and bold) */}
                  <Text style={styles.supplementName}>{item.SupplementName}</Text>

                  {/* Brand & Type nicely formatted and clearly visible */}
                  <View style={styles.brandTypeContainer}>
                    <View style={styles.brandTypeRow}>
                      <Ionicons name="pricetag-outline" size={16} color={ACCENT} style={{ marginRight: 8 }} />
                      <Text style={styles.brandTypeLabel}>Brand: <Text style={styles.brandTypeValue}>{item.SupplementBrand}</Text></Text>
                    </View>
                    <View style={styles.brandTypeRow}>
                      <Ionicons name="grid-outline" size={16} color={ACCENT} style={{ marginRight: 8 }} />
                      <Text style={styles.brandTypeLabel}>Type: <Text style={styles.brandTypeValue}>{item.SupplementType}</Text></Text>
                    </View>
                  </View>

                  {/* Description (Centered) */}
                  <Text style={styles.description}>{item.SupplementDescription}</Text>

                  <View style={styles.pricingStockRow}>
                    {/* Stock Detail */}
                    <Text style={styles.stockText}>
                      Stock: <Text style={styles.stockValue}>{item.SupplementStock}</Text>
                    </Text>
                    
                    {/* Price Prominent styling */}
                    <Text style={styles.priceHighlight}>Rs. {item.SupplementPrice}</Text>
                  </View>

                  {/* Buy Button */}
                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      (!item.SupplementAvailable || item.SupplementStock <= 0) && styles.buyButtonDisabled
                    ]}
                    onPress={() => openBuyModal(item)}
                    disabled={!item.SupplementAvailable || item.SupplementStock <= 0}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cart-outline" size={18} color={BG} style={{ marginRight: 6 }} />
                    <Text style={styles.buyButtonText}>Buy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── 1. Create Floating Action Button (FAB) (Admin Only) ── */}
      {currentRole === 'Admin' && isAdminApproved && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push({ pathname: '/createsupplementpost', params: { editMode: 'false', adminId } } as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── 2. Buy Modal Window (same modal style as Gym edit modal) ── */}
      <Modal
        visible={buyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBuyModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.buyModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy Supplement</Text>
              <TouchableOpacity onPress={() => setBuyModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.buyProductLabel}>
                Buying: <Text style={styles.buyProductName}>{selectedSupplement?.SupplementName}</Text>
              </Text>

              {/* Demo Credentials Info Alert */}
              <View style={styles.demoCredentialsBox}>
                <Ionicons name="information-circle-outline" size={16} color={ACCENT} />
                <Text style={styles.demoCredentialsText}>
                  Test credentials: Card <Text style={styles.boldText}>1234 1234 1234 1234</Text>, Expiry <Text style={styles.boldText}>12/26</Text>, CVV <Text style={styles.boldText}>123</Text>
                </Text>
              </View>

              {/* Form Input Fields */}
              <View style={styles.formContainer}>
                {/* Card Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="card-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="1234 1234 1234 1234"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      maxLength={19}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                    />
                  </View>
                </View>

                {/* Expiry & CVV side-by-side */}
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="calendar-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="MM/YY"
                        placeholderTextColor={TEXT_MUTED}
                        keyboardType="number-pad"
                        maxLength={5}
                        value={expiryDate}
                        onChangeText={handleExpiryDateChange}
                      />
                    </View>
                  </View>

                  <View style={{ width: 16 }} />

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="123"
                        placeholderTextColor={TEXT_MUTED}
                        keyboardType="number-pad"
                        maxLength={3}
                        value={cvv}
                        onChangeText={setCvv}
                      />
                    </View>
                  </View>
                </View>

                {/* Quantity */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="cube-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="1"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>
                </View>

                {/* Amount (Read-only) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (Rs.)</Text>
                  <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                    <Ionicons name="cash-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: TEXT_SECONDARY }]}
                      value={amount}
                      editable={false}
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                  onPress={() => setBuyModalVisible(false)}
                  disabled={isActionLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                  onPress={handleBuySupplement}
                  disabled={isActionLoading}
                  activeOpacity={0.85}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>Pay Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 3. Global Popup Modal ── */}
      <Modal
        visible={popup.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissPopup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popupCard}>
            <Text style={styles.popupMessage}>{popup.message}</Text>
            <TouchableOpacity
              style={styles.popupButton}
              onPress={dismissPopup}
              activeOpacity={0.85}
            >
              <Text style={styles.popupButtonText}>OK</Text>
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
    paddingBottom: 90, // Clear floating FAB button
  },
  /* ── Supplement Shop Card ── */
  supplementCard: {
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
  supplementImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  availableBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  availableBadgeText: {
    color: SUCCESS_GREEN,
  },
  finishedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  finishedBadgeText: {
    color: ERROR_RED,
  },
  editButtonBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 22,
  },
  supplementName: {
    fontSize: 26,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  brandTypeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  brandTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTypeLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
  },
  brandTypeValue: {
    color: TEXT_PRIMARY,
    fontWeight: '800',
  },
  description: {
    fontSize: 14.5,
    color: TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  pricingStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stockText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  stockValue: {
    color: TEXT_PRIMARY,
    fontWeight: '800',
  },
  priceHighlight: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: '800',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    backgroundColor: ACCENT,
    borderRadius: 14,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buyButtonDisabled: {
    backgroundColor: BORDER,
    shadowOpacity: 0,
    elevation: 0,
  },
  buyButtonText: {
    color: BG,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  /* ── Floating Action Button (FAB) ── */
  fab: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 10,
  },
  fabText: {
    fontSize: 34,
    color: TEXT_PRIMARY,
    fontWeight: '300',
    lineHeight: 38,
  },
  /* ── Buy Modal Card & Overlay ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  buyModalCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT_PRIMARY,
  },
  buyProductLabel: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    marginBottom: 8,
  },
  buyProductName: {
    color: TEXT_PRIMARY,
    fontWeight: '800',
  },
  demoCredentialsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  demoCredentialsText: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  formContainer: {
    width: '100%',
    gap: 14,
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 50,
  },
  readOnlyInput: {
    backgroundColor: 'rgba(255,255,255,0.015)',
    borderColor: 'rgba(255,255,255,0.03)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 14,
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  modalActionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalCancelBtnText: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    backgroundColor: ACCENT,
  },
  modalConfirmBtnText: {
    color: BG,
    fontSize: 15,
    fontWeight: '700',
  },
  popupCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  popupMessage: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  popupButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
});
