import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
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
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';
const CLOUDINARY_CLOUD_NAME = 'dcahmv4lj';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;



export default function CreateSupplementPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const editMode = params.editMode === 'true';
  const supplementPostId = params.supplementPostId as string;
  const adminId = (params.adminId as string) || Session.getUserId();
  const scrollViewRef = useRef<ScrollView>(null);

  /* ── Core State ── */
  const [originalPost, setOriginalPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /* ── Form State ── */
  const [supplementImg, setSupplementImg] = useState('');
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [supplementName, setSupplementName] = useState('');
  const [supplementBrand, setSupplementBrand] = useState('');
  const [supplementType, setSupplementType] = useState('');
  const [supplementDescription, setSupplementDescription] = useState('');
  const [supplementPrice, setSupplementPrice] = useState('');
  const [supplementStock, setSupplementStock] = useState('');

  /* ── UI States ── */

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /* ── Custom Popup State ── */
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
    onDismiss?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showPopup = (
    title: string,
    message: string,
    type: 'error' | 'success' | 'info' = 'info',
    onDismiss?: () => void
  ) => {
    setPopup({ visible: true, title, message, type, onDismiss });
  };

  const dismissPopup = () => {
    const callback = popup.onDismiss;
    setPopup({ visible: false, title: '', message: '', type: 'info' });
    if (callback) callback();
  };

  /* ── Initial Load for Edit Mode ── */
  useEffect(() => {
    if (!adminId) {
      showPopup('Session Expired', 'Please login to continue.', 'error', () => {
        router.replace('/login');
      });
      return;
    }

    if (editMode && supplementPostId) {
      fetchSupplementDetails();
    }
  }, [editMode, supplementPostId]);

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

  const fetchSupplementDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/supplements/supplement-post-get-by-id/${supplementPostId}`);
      const data = await response.json();
      if (response.status === 200 && data.Supplement) {
        const sup = data.Supplement;
        setOriginalPost(sup);
        setSupplementImg(sup.SupplementImage || '');
        setSupplementName(sup.SupplementName || '');
        setSupplementBrand(sup.SupplementBrand || '');
        setSupplementType(sup.SupplementType || '');
        setSupplementDescription(sup.SupplementDescription || '');
        setSupplementPrice(sup.SupplementPrice !== undefined && sup.SupplementPrice !== null ? String(sup.SupplementPrice) : '');
        setSupplementStock(sup.SupplementStock !== undefined && sup.SupplementStock !== null ? String(sup.SupplementStock) : '');
      } else {
        showPopup('Error', data.message || 'Failed to fetch supplement details.', 'error', () => {
          router.back();
        });
      }
    } catch (error) {
      showPopup('Network Error', 'Could not fetch details from server.', 'error', () => {
        router.back();
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Image Upload Functions ── */
  const selectSupplementImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showPopup('Permission Required', 'Please allow access to your photo library to pick an image.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadImage(asset.uri, asset.base64 || undefined);
    }
  };

  const uploadImage = async (uri: string, base64Data?: string) => {
    setIsUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append('file', base64Data ? `data:image/jpeg;base64,${base64Data}` : {
        uri,
        name: `supplement_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('upload_preset', 'GymApp');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        setSupplementImg(data.secure_url);
      } else {
        const errMsg = data.error?.message || 'Could not upload to Cloudinary.';
        showPopup('Upload Failed', errMsg, 'error');
      }
    } catch (error: any) {
      showPopup('Upload Error', error.message || 'An error occurred during upload.', 'error');
    } finally {
      setIsUploadingImg(false);
    }
  };

  /* ── Form Validation ── */
  const validateForm = (): boolean => {
    if (!supplementImg) {
      showPopup('Validation Error', 'Please select a supplement image.', 'error');
      return false;
    }
    if (!supplementName.trim()) {
      showPopup('Validation Error', 'Please enter a supplement name.', 'error');
      return false;
    }
    if (!supplementBrand.trim()) {
      showPopup('Validation Error', 'Please enter a brand.', 'error');
      return false;
    }
    if (!supplementType) {
      showPopup('Validation Error', 'Please select a supplement type.', 'error');
      return false;
    }
    if (!supplementDescription.trim()) {
      showPopup('Validation Error', 'Please enter a description.', 'error');
      return false;
    }

    const priceVal = Number(supplementPrice);
    if (!supplementPrice.trim() || isNaN(priceVal) || priceVal <= 0) {
      showPopup('Validation Error', 'Price must be a valid positive value.', 'error');
      return false;
    }

    const stockVal = Number(supplementStock);
    if (!supplementStock.trim() || isNaN(stockVal) || stockVal < 0 || !Number.isInteger(stockVal)) {
      showPopup('Validation Error', 'Stock cannot be a negative value.', 'error');
      return false;
    }

    return true;
  };

  /* ── Action: Create Supplement ── */
  const handleCreateSupplement = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/supplements/supplement-post-create/${adminId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SupplementName: supplementName.trim(),
          SupplementBrand: supplementBrand.trim(),
          SupplementType: supplementType,
          SupplementDescription: supplementDescription.trim(),
          SupplementPrice: Number(supplementPrice),
          SupplementStock: Number(supplementStock),
          SupplementImage: supplementImg,
        }),
      });

      const data = await response.json();
      if (response.status === 201) {
        showPopup('Success', 'Supplement created successfully.', 'success', () => {
          router.push({ pathname: '/supplements', params: { role: 'Admin' } } as any);
        });
      } else {
        showPopup('Error', data.message || 'Failed to create supplement.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Action: Save Changes (Edit Mode) ── */
  const handleSaveChanges = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;
    if (!originalPost) return;

    setIsActionLoading(true);
    const fetchThunks: (() => Promise<any>)[] = [];

    // 1. Supplement Name
    if (supplementName.trim() !== originalPost.SupplementName) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-name/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementName: supplementName.trim() }),
        })
      );
    }

    // 2. Supplement Brand
    if (supplementBrand.trim() !== originalPost.SupplementBrand) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-brand/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementBrand: supplementBrand.trim() }),
        })
      );
    }

    // 3. Supplement Type
    if (supplementType !== originalPost.SupplementType) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-type/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementType: supplementType }),
        })
      );
    }

    // 4. Supplement Description
    if (supplementDescription.trim() !== originalPost.SupplementDescription) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-description/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementDescription: supplementDescription.trim() }),
        })
      );
    }

    // 5. Supplement Price
    if (Number(supplementPrice) !== originalPost.SupplementPrice) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-price/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementPrice: Number(supplementPrice) }),
        })
      );
    }

    // 6. Supplement Stock
    if (Number(supplementStock) !== originalPost.SupplementStock) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-stock/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementStock: Number(supplementStock) }),
        })
      );
    }

    // 7. Supplement Image
    if (supplementImg !== originalPost.SupplementImage) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/supplements/supplement-post-update-image/${supplementPostId}/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ SupplementImage: supplementImg }),
        })
      );
    }

    try {
      if (fetchThunks.length > 0) {
        // Execute updates sequentially
        for (const thunk of fetchThunks) {
          const res = await thunk();
          if (res.status !== 200) {
            const data = await res.json();
            throw new Error(data.message || 'Failed to update field.');
          }
        }
        showPopup('Success', 'Supplement updated successfully.', 'success', () => {
          router.push({ pathname: '/supplements', params: { role: 'Admin' } } as any);
        });
      } else {
        // Nothing changed, just go back
        router.back();
      }
    } catch (error: any) {
      showPopup('Update Error', error.message || 'Failed to save changes.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Action: Delete Supplement ── */
  const handleDeleteSupplement = async () => {
    setDeleteConfirmVisible(false);
    setIsActionLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/supplements/supplement-post-delete/${supplementPostId}/${adminId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.status === 200) {
        showPopup('Deleted', 'Supplement deleted successfully.', 'success', () => {
          router.push({ pathname: '/supplements', params: { role: 'Admin' } } as any);
        });
      } else {
        showPopup('Error', data.message || 'Failed to delete supplement.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not delete supplement.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const imageWidth = SCREEN_WIDTH - 48;
  const imageHeight = (imageWidth * 2) / 3;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Back Button ── */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>
          {isLoading
            ? (editMode ? 'Edit Supplement' : 'Create Supplement')
            : (editMode ? 'Edit Supplement' : 'Create Supplement')}
        </Text>
        <View style={styles.titleUnderline} />
        <LinearGradient colors={[BG, 'rgba(13, 13, 13, 0)']} style={styles.fadeOverlay} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 60 }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker */}
          <Text style={styles.formSectionTitle}>Supplement Image</Text>
          <TouchableOpacity
            style={[styles.imageUploadArea, { width: imageWidth, height: imageHeight }]}
            onPress={selectSupplementImage}
            disabled={isUploadingImg}
            activeOpacity={0.8}
          >
            {supplementImg ? (
              <>
                <Image source={{ uri: supplementImg }} style={styles.uploadedImage} />
                <View style={styles.imageOverlayBadge}>
                  {isUploadingImg ? (
                    <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                  ) : (
                    <Ionicons name="camera" size={18} color={TEXT_PRIMARY} />
                  )}
                </View>
              </>
            ) : isUploadingImg ? (
              <ActivityIndicator size="large" color={ACCENT} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color={TEXT_MUTED} />
                <Text style={styles.imagePlaceholderText}>Tap to select image (3:2)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formContainer}>
            {/* Supplement Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplement Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flask-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Supplement Name"
                  placeholderTextColor={TEXT_MUTED}
                  value={supplementName}
                  onChangeText={setSupplementName}
                />
              </View>
            </View>

            {/* Supplement Brand */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplement Brand</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="pricetag-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Supplement Brand"
                  placeholderTextColor={TEXT_MUTED}
                  value={supplementBrand}
                  onChangeText={setSupplementBrand}
                />
              </View>
            </View>

            {/* Supplement Type Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplement Type</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="grid-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Supplement Type (e.g. Whey Protein)"
                  placeholderTextColor={TEXT_MUTED}
                  value={supplementType}
                  onChangeText={setSupplementType}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplement Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Supplement Description"
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={4}
                  value={supplementDescription}
                  onChangeText={setSupplementDescription}
                />
              </View>
            </View>

            {/* Price */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price (Rs.)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  value={supplementPrice}
                  onChangeText={setSupplementPrice}
                />
              </View>
            </View>

            {/* Stock */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Stock</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cube-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Stock"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="number-pad"
                  value={supplementStock}
                  onChangeText={setSupplementStock}
                />
              </View>
            </View>
          </View>

          {/* Create or Save Buttons */}
          {editMode ? (
            <View style={{ width: '100%', gap: 14 }}>
              <TouchableOpacity
                style={[styles.submitButton, isActionLoading && styles.submitButtonDisabled]}
                onPress={handleSaveChanges}
                disabled={isActionLoading}
                activeOpacity={0.85}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                    <Ionicons name="checkmark" size={20} color={BG} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, isActionLoading && styles.submitButtonDisabled]}
                onPress={() => setDeleteConfirmVisible(true)}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color={ERROR_RED} style={{ marginRight: 6 }} />
                <Text style={styles.deleteButtonText}>Delete Supplement Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, isActionLoading && styles.submitButtonDisabled]}
              onPress={handleCreateSupplement}
              disabled={isActionLoading}
              activeOpacity={0.85}
            >
              {isActionLoading ? (
                <ActivityIndicator size="small" color={BG} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Create Supplement Post</Text>
                  <Ionicons name="checkmark" size={20} color={BG} />
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}



      {/* ── Delete Confirmation Modal ── */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.modalConfirmText}>
              Are you sure you want to delete this supplement?
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
                onPress={handleDeleteSupplement}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Global Alert Popup ── */}
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 32,
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
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  formSectionTitle: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: 4,
  },
  imageUploadArea: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BG,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 56,
    width: '100%',
  },
  dropdownChevron: {
    marginLeft: 'auto',
  },
  dropdownValueText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '500',
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
  textAreaWrapper: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  textAreaInput: {
    textAlignVertical: 'top',
    height: '100%',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    backgroundColor: ACCENT,
    borderRadius: 14,
    gap: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
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
    marginBottom: 30,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ERROR_RED,
  },
  /* ── Modal & Dropdown Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  dropdownModalCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 22,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 6,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  dropdownOptionText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: ACCENT,
    fontWeight: '700',
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
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
    color: TEXT_PRIMARY,
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
