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


/* ── Backend Config ── */
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';
const CLOUDINARY_CLOUD_NAME = 'dcahmv4lj';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function UserRegisterScreen() {
  const router = useRouter();

  /* ── Form State ── */
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userNIC, setUserNIC] = useState('');
  const [userContactNumber, setUserContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* ── Biometrics State ── */
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [userWeight, setUserWeight] = useState('');
  const [userHeight, setUserHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'Low' | 'Moderate' | 'High' | null>(null);
  const [workoutGoal, setWorkoutGoal] = useState<'Muscle Gain' | 'Weight Loss' | 'Fitness' | null>(null);

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
        name: `profile_${Date.now()}.jpg`,
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
    if (!userName.trim()) {
      showPopup('Validation Error', 'Please enter your full name.', 'error');
      return false;
    }
    if (!userAge.trim()) {
      showPopup('Validation Error', 'Please enter your age.', 'error');
      return false;
    }
    if (!userNIC.trim()) {
      showPopup('Validation Error', 'Please enter your NIC number.', 'error');
      return false;
    }
    if (!userContactNumber.trim()) {
      showPopup('Validation Error', 'Please enter your contact number.', 'error');
      return false;
    }
    if (userContactNumber.trim().length !== 10) {
      showPopup('Validation Error', 'Contact number must be 10 digits.', 'error');
      return false;
    }
    if (!email.trim()) {
      showPopup('Validation Error', 'Please enter your email address.', 'error');
      return false;
    }

    // Biometrics Validation
    if (!gender) {
      showPopup('Validation Error', 'Please select your Gender.', 'error');
      return false;
    }
    if (!userWeight.trim() || isNaN(Number(userWeight))) {
      showPopup('Validation Error', 'Please enter a valid Weight in kg.', 'error');
      return false;
    }
    if (!userHeight.trim() || isNaN(Number(userHeight))) {
      showPopup('Validation Error', 'Please enter a valid Height in cm.', 'error');
      return false;
    }
    if (!activityLevel) {
      showPopup('Validation Error', 'Please select your Activity Level.', 'error');
      return false;
    }
    if (!workoutGoal) {
      showPopup('Validation Error', 'Please select your Workout Goal.', 'error');
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
      const weightNum = parseFloat(userWeight.trim());
      const heightNum = parseFloat(userHeight.trim());
      const ageNum = parseInt(userAge.trim());

      // 1. Water Target Calculation
      const waterTarget = Math.round(weightNum * 35); // weight in kg * 35ml

      // 2. Calorie Target Calculation using Mifflin-St Jeor Formula
      let bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum);
      if (gender === 'Male') {
        bmr += 5;
      } else {
        bmr -= 161;
      }

      // Apply Activity Multiplier (Low: 1.2, Moderate: 1.55, High: 1.725)
      let multiplier = 1.2;
      if (activityLevel === 'Moderate') {
        multiplier = 1.55;
      } else if (activityLevel === 'High') {
        multiplier = 1.725;
      }
      let tdee = bmr * multiplier;

      // Adjust based on Workout Goal
      let calorieTarget = tdee;
      if (workoutGoal === 'Weight Loss') {
        calorieTarget -= 500;
      } else if (workoutGoal === 'Muscle Gain') {
        calorieTarget += 500;
      }
      calorieTarget = Math.max(Math.round(calorieTarget), 1200);

      const response = await fetch(`${BACKEND_URL}/api/user/user-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          UserName: userName.trim(),
          UserAge: userAge.trim(),
          UserNIC: userNIC.trim(),
          UserContactNumber: userContactNumber.trim(),
          Email: email.trim(),
          Password: password,
          ConfirmPassword: confirmPassword,
          UserDP: uploadedImageUrl || 'None',
          UserWeight: weightNum,
          UserHeight: heightNum,
          Gender: gender,
          ActivityLevel: activityLevel,
          WorkoutGoal: workoutGoal,
          WaterTarget: waterTarget,
          CalorieTarget: calorieTarget
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        showPopup('Success', 'Successfully registered', 'success');
      } else {
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
        <Text style={styles.pageTitle}>User Registration</Text>
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

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="words"
                value={userName}
                onChangeText={setUserName}
              />
            </View>
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="number-pad"
                maxLength={3}
                value={userAge}
                onChangeText={setUserAge}
              />
            </View>
          </View>

          {/* NIC */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIC Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your NIC number"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="sentences"
                value={userNIC}
                onChangeText={setUserNIC}
              />
            </View>
          </View>

          {/* Contact Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your contact number"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad"
                maxLength={10}
                value={userContactNumber}
                onChangeText={setUserContactNumber}
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
            <Text style={styles.dividerText}>Biometrics</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerButton, gender === 'Male' && styles.pickerButtonActive]}
                onPress={() => setGender('Male')}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerButtonText, gender === 'Male' && styles.pickerButtonTextActive]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerButton, gender === 'Female' && styles.pickerButtonActive]}
                onPress={() => setGender('Female')}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerButtonText, gender === 'Female' && styles.pickerButtonTextActive]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="scale-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 70"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="numeric"
                value={userWeight}
                onChangeText={setUserWeight}
              />
            </View>
          </View>

          {/* Height */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="resize-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. 175"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="numeric"
                value={userHeight}
                onChangeText={setUserHeight}
              />
            </View>
          </View>

          {/* Activity Level */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Activity Level</Text>
            <View style={styles.pickerRow}>
              {(['Low', 'Moderate', 'High'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.pickerButton, activityLevel === level && styles.pickerButtonActive, { flex: 1 }]}
                  onPress={() => setActivityLevel(level)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerButtonText, activityLevel === level && styles.pickerButtonTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Workout Goal */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Workout Goal</Text>
            <View style={styles.pickerRow}>
              {(['Muscle Gain', 'Weight Loss', 'Fitness'] as const).map((goalOption) => (
                <TouchableOpacity
                  key={goalOption}
                  style={[styles.pickerButton, workoutGoal === goalOption && styles.pickerButtonActive, { flex: 1 }]}
                  onPress={() => setWorkoutGoal(goalOption)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerButtonText, workoutGoal === goalOption && styles.pickerButtonTextActive, { fontSize: 12 }]}>{goalOption}</Text>
                </TouchableOpacity>
              ))}
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
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 1.5,
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
    opacity: 0.08,
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
    borderWidth: 2.5,
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
    borderRadius: 16,
    borderWidth: 1.5,
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
    borderRadius: 16,
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
    color: '#FFFFFF',
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
    color: ACCENT_EMERALD,
  },

  /* ── Custom Popup Modal ── */
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
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalIconSuccess: {
    backgroundColor: SUCCESS_GREEN,
  },
  modalIconError: {
    backgroundColor: ERROR_RED,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.3,
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
    borderRadius: 16,
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
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  pickerButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#12121A',
    borderWidth: 1.5,
    borderColor: '#241C35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerButtonActive: {
    backgroundColor: '#8A2BE2',
    borderColor: '#8A2BE2',
  },
  pickerButtonText: {
    color: '#B3AEC6',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
