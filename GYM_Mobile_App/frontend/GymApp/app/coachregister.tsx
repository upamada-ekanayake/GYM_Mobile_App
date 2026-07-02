import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Colour Tokens (matching app-wide theme) ── */
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

export default function CoachRegisterScreen() {
  const router = useRouter();

  /* ── Form State ── */
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [coachName, setCoachName] = useState('');
  const [coachAge, setCoachAge] = useState('');
  const [coachNIC, setCoachNIC] = useState('');
  const [coachID, setCoachID] = useState('');
  const [coachContactNumber, setCoachContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* ── UI State ── */
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [popup, setPopup] = useState<{ visible: boolean; title: string; message: string; type: 'error' | 'success' | 'info' }>({
    visible: false, title: '', message: '', type: 'info',
  });

  const showPopup = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setPopup({ visible: true, title, message, type });
  };

  const dismissPopup = () => {
    const wasSuccess = popup.type === 'success';
    setPopup({ visible: false, title: '', message: '', type: 'info' });
    if (wasSuccess) {
      router.push('/login');
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

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

  /* ── Pick Image from Gallery ── */
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showPopup('Permission Required', 'Please allow access to your photo library to select a profile picture.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setProfileImage(asset.uri);
      await uploadToCloudinary(asset.uri, asset.base64 || undefined);
    }
  };

  /* ── Upload to Cloudinary ── */
  const uploadToCloudinary = async (imageUri: string, base64Data?: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', base64Data ? `data:image/jpeg;base64,${base64Data}` : {
        uri: imageUri,
        name: `coach_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('upload_preset', 'GymApp');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        setUploadedImageUrl(data.secure_url);
      } else {
        const errMsg = data.error?.message || JSON.stringify(data);
        showPopup('Upload Failed', errMsg, 'error');
        setProfileImage(null);
      }
    } catch (error: any) {
      showPopup('Upload Error', error.message || 'An error occurred while uploading.', 'error');
      setProfileImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Frontend Validation ── */
  const validateForm = (): boolean => {
    if (!coachName.trim()) {
      showPopup('Validation Error', 'Please enter the coach\'s full name.', 'error');
      return false;
    }
    if (!coachAge.trim()) {
      showPopup('Validation Error', 'Please enter the coach\'s age.', 'error');
      return false;
    }
    if (!coachNIC.trim()) {
      showPopup('Validation Error', 'Please enter the coach\'s NIC number.', 'error');
      return false;
    }
    if (!coachID.trim()) {
      showPopup('Validation Error', 'Please enter the Coach ID.', 'error');
      return false;
    }
    if (!coachContactNumber.trim()) {
      showPopup('Validation Error', 'Please enter the coach\'s contact number.', 'error');
      return false;
    }
    if (coachContactNumber.trim().length !== 10) {
      showPopup('Validation Error', 'Contact number must be 10 digits.', 'error');
      return false;
    }
    if (!email.trim()) {
      showPopup('Validation Error', 'Please enter the email address.', 'error');
      return false;
    }
    if (!password) {
      showPopup('Validation Error', 'Please enter a password.', 'error');
      return false;
    }
    if (password.length < 6) {
      showPopup('Validation Error', 'Password must be at least 6 characters long.', 'error');
      return false;
    }
    if (!confirmPassword) {
      showPopup('Validation Error', 'Please confirm your password.', 'error');
      return false;
    }
    if (password !== confirmPassword) {
      showPopup('Validation Error', 'Passwords do not match.', 'error');
      return false;
    }
    return true;
  };

  /* ── Handle Registration ── */
  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsRegistering(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/coach/coach-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CoachDP: uploadedImageUrl || 'None',
          CoachName: coachName.trim(),
          CoachAge: coachAge.trim(),
          CoachNIC: coachNIC.trim(),
          CoachID: coachID.trim(),
          CoachContactNumber: coachContactNumber.trim(),
          Email: email.trim(),
          Password: password,
          ConfirmPassword: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        showPopup('Success', 'Coach registered successfully', 'success');
      } else {
        // Display backend error messages as popup
        showPopup('Registration Failed', data.message || 'Something went wrong.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not connect to the server. Please try again.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Back Button ── */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={TEXT_PRIMARY} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 50 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Decorative Glow ── */}
        <View style={styles.glowCircle} />

        {/* ── Page Title ── */}
        <Text style={styles.pageTitle}>Coach Registration</Text>
        <View style={styles.titleUnderline} />

        {/* ── Profile Picture ── */}
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={pickImage}
          activeOpacity={0.8}
          disabled={isUploading}
        >
          <View style={styles.profileOuterWrapper}>
            <View style={styles.profileImageWrapper}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person-outline" size={48} color={TEXT_MUTED} />
                </View>
              )}
            </View>

            {/* Camera Badge - outside the clipped circle */}
            <View style={styles.cameraBadge}>
              {isUploading ? (
                <ActivityIndicator size="small" color={TEXT_PRIMARY} />
              ) : (
                <Ionicons name="camera" size={18} color={TEXT_PRIMARY} />
              )}
            </View>
          </View>

          <Text style={styles.profileHint}>
            {isUploading ? 'Uploading...' : 'Tap to add profile photo'}
          </Text>

          {/* Upload Status */}
          {uploadedImageUrl !== '' && !isUploading && (
            <View style={styles.uploadSuccess}>
              <Ionicons name="checkmark-circle" size={16} color={SUCCESS_GREEN} />
              <Text style={styles.uploadSuccessText}>Photo uploaded</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Form Fields ── */}
        <View style={styles.formContainer}>

          {/* Coach Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter coach's full name"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="words"
                value={coachName}
                onChangeText={setCoachName}
              />
            </View>
          </View>

          {/* Coach Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter coach's age"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="number-pad"
                maxLength={3}
                value={coachAge}
                onChangeText={setCoachAge}
              />
            </View>
          </View>

          {/* Coach NIC */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIC Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter coach's NIC number"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="sentences"
                value={coachNIC}
                onChangeText={setCoachNIC}
              />
            </View>
          </View>

          {/* Coach ID */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Coach ID</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter Coach ID"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="sentences"
                value={coachID}
                onChangeText={setCoachID}
              />
            </View>
          </View>

          {/* Coach Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter contact number"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad"
                maxLength={10}
                value={coachContactNumber}
                onChangeText={setCoachContactNumber}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="email-address"
                autoCapitalize="sentences"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Security</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!showPassword}
                autoCapitalize="sentences"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={TEXT_MUTED}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="sentences"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={TEXT_MUTED}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Register Button ── */}
        <TouchableOpacity
          style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]}
          onPress={handleRegister}
          activeOpacity={0.85}
          disabled={isRegistering || isUploading}
        >
          {isRegistering ? (
            <ActivityIndicator size="small" color={BG} />
          ) : (
            <>
              <Text style={styles.registerButtonText}>Register</Text>
              <Ionicons name="arrow-forward" size={20} color={BG} />
            </>
          )}
        </TouchableOpacity>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 100 : 90,
  },

  /* ── Back Button ── */
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

  /* ── Decorative Glow ── */
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
    fontSize: 26,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titleUnderline: {
    width: 50,
    height: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
    marginBottom: 28,
  },

  /* ── Profile Picture ── */
  profileContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileOuterWrapper: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: ACCENT,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BG,
  },
  profileHint: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 10,
    letterSpacing: 0.3,
  },
  uploadSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  uploadSuccessText: {
    fontSize: 12,
    color: SUCCESS_GREEN,
    fontWeight: '600',
  },

  /* ── Form ── */
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 15,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },

  /* ── Section Divider ── */
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  /* ── Register Button ── */
  registerButton: {
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
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: BG,
    letterSpacing: 0.6,
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },

  /* ── Custom Popup Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSuccess: {
    backgroundColor: SUCCESS_GREEN,
  },
  modalButtonError: {
    backgroundColor: ERROR_RED,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
});
