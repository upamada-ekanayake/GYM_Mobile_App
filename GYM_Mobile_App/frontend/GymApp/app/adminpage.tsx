import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Session } from '../constants/Session';
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
const ERROR_RED = '#EF4444';
const SUCCESS_GREEN = '#22C55E';

/* ── Backend Config ── */
const BACKEND_URL = 'http://192.168.1.5:5000';
const CLOUDINARY_CLOUD_NAME = 'dcahmv4lj';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function AdminProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const adminId = (params.userId as string) || Session.getUserId();

  /* ── Admin Details State ── */
  const [adminDetails, setAdminDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ── DP Upload State ── */
  const [isUploadingDP, setIsUploadingDP] = useState(false);

  /* ── Update Contact Number State ── */
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [newContactNumber, setNewContactNumber] = useState('');
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  /* ── Change Password State ── */
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  /* ── Delete Account State ── */
  const [deletePasswordModalVisible, setDeletePasswordModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isCheckingDeletePassword, setIsCheckingDeletePassword] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);

  /* ── Alert Popup State ── */
  const [alertPopup, setAlertPopup] = useState<{
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

  const showAlert = (
    title: string,
    message: string,
    type: 'error' | 'success' | 'info' = 'info',
    onDismiss?: () => void
  ) => {
    setAlertPopup({ visible: true, title, message, type, onDismiss });
  };

  const dismissAlert = () => {
    const callback = alertPopup.onDismiss;
    setAlertPopup({ visible: false, title: '', message: '', type: 'info' });
    if (callback) callback();
  };

  /* ── Fetch Admin Details ── */
  const fetchAdminDetails = async (id: string | null) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/admin-details/${id}`);
      const data = await response.json();
      if (response.status === 200 && data.admin) {
        setAdminDetails(data.admin);
      } else {
        showAlert('Error', data.message || 'Failed to retrieve admin details.', 'error');
      }
    } catch (error: any) {
      showAlert('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminId) {
      fetchAdminDetails(adminId);
    } else {
      showAlert('Session Expired', 'Please login to view your profile.', 'error', () => {
        router.replace('/login');
      });
    }
  }, [adminId]);

  /* ── Pick & Upload DP ── */
  const selectProfileImage = async () => {
    if (!adminId) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library to pick an image.', 'error');
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
      await uploadProfileImage(asset.uri, asset.base64 || undefined);
    }
  };

  const uploadProfileImage = async (uri: string, base64Data?: string) => {
    setIsUploadingDP(true);
    try {
      const formData = new FormData();
      formData.append('file', base64Data ? `data:image/jpeg;base64,${base64Data}` : {
        uri,
        name: `admindp_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('upload_preset', 'GymApp');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        const updateResponse = await fetch(`${BACKEND_URL}/api/admin/admin-update-dp/${adminId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ AdminDP: data.secure_url }),
        });

        const updateData = await updateResponse.json();

        if (updateResponse.status === 200) {
          showAlert('Success', 'Profile picture updated successfully.', 'success');
          fetchAdminDetails(adminId);
        } else {
          showAlert('Update Failed', updateData.message || 'Failed to save profile picture.', 'error');
        }
      } else {
        const errMsg = data.error?.message || 'Could not upload to Cloudinary.';
        showAlert('Upload Failed', errMsg, 'error');
      }
    } catch (error: any) {
      showAlert('Upload Error', error.message || 'An error occurred during DP upload.', 'error');
    } finally {
      setIsUploadingDP(false);
    }
  };

  /* ── Contact Number Update ── */
  const handleUpdateContactNumber = async () => {
    if (!adminId) return;

    if (newContactNumber.trim().length !== 10) {
      showAlert('Validation Error', 'Contact number must be exactly 10 digits.', 'error');
      return;
    }

    setIsUpdatingContact(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/admin-update-contact-number/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newContactNumber: newContactNumber.trim() }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setContactModalVisible(false);
        setNewContactNumber('');
        showAlert('Success', 'Contact number updated successfully.', 'success');
        fetchAdminDetails(adminId);
      } else {
        showAlert('Update Failed', data.message || 'Failed to update contact number.', 'error');
      }
    } catch (error: any) {
      showAlert('Error', 'Could not update contact number. Try again.', 'error');
    } finally {
      setIsUpdatingContact(false);
    }
  };

  /* ── Password Change ── */
  const handleChangePassword = async () => {
    if (!adminId) return;

    if (!oldPassword) {
      showAlert('Validation Error', 'Please enter your current password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Validation Error', 'New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert('Validation Error', 'New passwords are not same.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // NOTE: Admin update password expects lowercase "confirmNewPassword" in AdminController.js
      const response = await fetch(`${BACKEND_URL}/api/admin/admin-update-password/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        showAlert('Success', 'Password changed successfully.', 'success');
      } else {
        showAlert('Change Failed', data.message || 'Failed to change password.', 'error');
      }
    } catch (error: any) {
      showAlert('Error', 'Could not update password. Try again.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  /* ── Delete Account Flow ── */
  const handleDeletePasswordSubmit = async () => {
    if (!adminId || !adminDetails) return;

    if (!deletePassword) {
      showAlert('Validation Error', 'Please enter your password to continue.', 'error');
      return;
    }

    setIsCheckingDeletePassword(true);
    try {
      // Validate password via Admin Login endpoint
      const checkResponse = await fetch(`${BACKEND_URL}/api/admin/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email: adminDetails.Email,
          Password: deletePassword,
        }),
      });

      const checkData = await checkResponse.json();

      if (checkResponse.status === 200) {
        setDeletePasswordModalVisible(false);
        setDeleteConfirmModalVisible(true);
      } else {
        showAlert('Validation Failed', checkData.message || 'Invalid password.', 'error');
      }
    } catch (error: any) {
      showAlert('Error', 'Could not verify password. Try again.', 'error');
    } finally {
      setIsCheckingDeletePassword(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!adminId) return;

    setDeleteConfirmModalVisible(false);
    setIsLoading(true);
    try {
      // NOTE: Admin delete expects "Password" (capital P) in AdminController.js
      const response = await fetch(`${BACKEND_URL}/api/admin/admin-delete/${adminId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Password: deletePassword }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setDeletePassword('');
        Session.clear();
        showAlert('Account Deleted', 'Your account has been permanently deleted.', 'success', () => {
          router.replace('/login');
        });
      } else {
        showAlert('Deletion Failed', data.message || 'Failed to delete account.', 'error');
      }
    } catch (error: any) {
      showAlert('Error', 'Could not delete account. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const hasProfileImage = adminDetails?.AdminDP && adminDetails.AdminDP !== 'None' && adminDetails.AdminDP !== '';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole="Admin" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Decorative Glow ── */}
          <View style={styles.glowCircle} />

          {/* ── Profile Picture ── */}
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={selectProfileImage}
            activeOpacity={0.8}
            disabled={isUploadingDP}
          >
            <View style={styles.profileOuterWrapper}>
              <View style={styles.profileImageWrapper}>
                {hasProfileImage ? (
                  <Image source={{ uri: adminDetails.AdminDP }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person-outline" size={48} color={TEXT_MUTED} />
                  </View>
                )}
              </View>

              {/* Camera Badge overlay */}
              <View style={styles.cameraBadge}>
                {isUploadingDP ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Ionicons name="camera" size={18} color={TEXT_PRIMARY} />
                )}
              </View>
            </View>
            <Text style={styles.profileHint}>
              {isUploadingDP ? 'Uploading...' : 'Tap to change photo'}
            </Text>
          </TouchableOpacity>

          {/* ── Greeting ── */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Hi Admin {adminDetails?.AdminName || 'Admin'}!
            </Text>
          </View>

          {/* ── Admin Information Details Card ── */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color={TEXT_MUTED} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Admin Name</Text>
                <Text style={styles.detailValue}>{adminDetails?.AdminName || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailSeparator} />

            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={20} color={TEXT_MUTED} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{adminDetails?.Email || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailSeparator} />

            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={20} color={TEXT_MUTED} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>NIC Card Number</Text>
                <Text style={styles.detailValue}>{adminDetails?.AdminNIC || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailSeparator} />

            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color={TEXT_MUTED} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <Text style={styles.detailValue}>{adminDetails?.AdminContactNumber || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* ── Update Action Buttons Row ── */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setNewContactNumber(adminDetails?.AdminContactNumber || '');
                setContactModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={18} color={TEXT_PRIMARY} />
              <Text style={styles.actionButtonText}>Update Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setPasswordModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed-outline" size={18} color={TEXT_PRIMARY} />
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          {/* ── Admin Management Section ── */}
          <View style={styles.managementContainer}>
            <Text style={styles.managementSectionTitle}>Management Controls</Text>
            
            <TouchableOpacity
              style={styles.managementCardButton}
              onPress={() => router.push({ pathname: '/usermanagement', params: { adminId } })}
              activeOpacity={0.8}
            >
              <View style={styles.managementCardLeft}>
                <View style={styles.managementIconWrapper}>
                  <Ionicons name="people-outline" size={24} color={ACCENT} />
                </View>
                <View style={styles.managementTextWrapper}>
                  <Text style={styles.managementCardTitle}>User Management</Text>
                  <Text style={styles.managementCardSubtitle}>Approve pending users & view details</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managementCardButton}
              onPress={() => router.push({ pathname: '/gymmanagement', params: { adminId } })}
              activeOpacity={0.8}
            >
              <View style={styles.managementCardLeft}>
                <View style={styles.managementIconWrapper}>
                  <Ionicons name="barbell-outline" size={24} color={ACCENT} />
                </View>
                <View style={styles.managementTextWrapper}>
                  <Text style={styles.managementCardTitle}>Gym Management</Text>
                  <Text style={styles.managementCardSubtitle}>Verify gym credentials & status</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managementCardButton}
              onPress={() => router.push({ pathname: '/coachmanagement', params: { adminId } })}
              activeOpacity={0.8}
            >
              <View style={styles.managementCardLeft}>
                <View style={styles.managementIconWrapper}>
                  <Ionicons name="person-add-outline" size={24} color={ACCENT} />
                </View>
                <View style={styles.managementTextWrapper}>
                  <Text style={styles.managementCardTitle}>Coach Management</Text>
                  <Text style={styles.managementCardSubtitle}>Verify coach credentials & status</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.managementCardButton}
              onPress={() => router.push({ pathname: '/adminmanagement', params: { adminId } })}
              activeOpacity={0.8}
            >
              <View style={styles.managementCardLeft}>
                <View style={styles.managementIconWrapper}>
                  <Ionicons name="shield-half-outline" size={24} color={ACCENT} />
                </View>
                <View style={styles.managementTextWrapper}>
                  <Text style={styles.managementCardTitle}>Admin Management</Text>
                  <Text style={styles.managementCardSubtitle}>Manage administrator permissions</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>

          {/* ── Delete Account Button ── */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              setDeletePassword('');
              setDeletePasswordModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={ERROR_RED} />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── 1. Contact Number Modal ── */}
      <Modal
        visible={contactModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>Update Contact Number</Text>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit contact number"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad"
                maxLength={10}
                value={newContactNumber}
                onChangeText={setNewContactNumber}
                autoFocus
              />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setContactModalVisible(false)}
                disabled={isUpdatingContact}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleUpdateContactNumber}
                disabled={isUpdatingContact}
              >
                {isUpdatingContact ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 2. Change Password Modal ── */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>Change Password</Text>

            {/* Old Password */}
            <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Old Password"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                <Ionicons name={showOldPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <View style={[styles.inputWrapper, { marginBottom: 18 }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!showConfirmNewPassword}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                <Ionicons name={showConfirmNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={isUpdatingPassword}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleChangePassword}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Change</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3. Delete Account Password Modal ── */}
      <Modal
        visible={deletePasswordModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeletePasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>Delete Account</Text>
            <Text style={styles.modalSubtitle}>Please enter your password to confirm identity.</Text>

            <View style={[styles.inputWrapper, { marginBottom: 18 }]}>
              <Ionicons name="lock-closed-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={TEXT_MUTED}
                secureTextEntry={!showDeletePassword}
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
              <TouchableOpacity onPress={() => setShowDeletePassword(!showDeletePassword)}>
                <Ionicons name={showDeletePassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setDeletePasswordModalVisible(false)}
                disabled={isCheckingDeletePassword}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleDeletePasswordSubmit}
                disabled={isCheckingDeletePassword}
              >
                {isCheckingDeletePassword ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Next</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 4. Delete Account Confirmation Modal ── */}
      <Modal
        visible={deleteConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.modalConfirmText}>
              Are you sure you want to permanently delete this admin account?
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setDeleteConfirmModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn, { backgroundColor: ERROR_RED }]}
                onPress={handleConfirmDeleteAccount}
              >
                <Text style={styles.modalConfirmBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 5. Global Alert/Popup Modal ── */}
      <Modal
        visible={alertPopup.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissAlert}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalMessage}>{alertPopup.message}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={dismissAlert}
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
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 60,
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

  /* ── Profile Picture ── */
  profileContainer: {
    alignItems: 'center',
    marginBottom: 24,
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

  /* ── Greeting ── */
  greetingContainer: {
    marginBottom: 28,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  /* ── Details Card ── */
  detailsCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  detailSeparator: {
    height: 1,
    backgroundColor: BORDER,
  },

  /* ── Update Action Buttons Row ── */
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    height: 52,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },

  /* ── Delete Account Button ── */
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

  /* ── Modal Dialog Overlay ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  /* ── Custom Form Popup Card ── */
  formModalCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.96)',
    borderRadius: 24,
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
  formModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  modalConfirmText: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  /* ── Input Wrapper inside Modal ── */
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
    fontSize: 14,
    height: '100%',
  },

  /* ── Form Actions Row ── */
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 20,
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

  /* ── Custom Alert Popup Modal ── */
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
  managementContainer: {
    width: '100%',
    marginBottom: 28,
    gap: 12,
  },
  managementSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingLeft: 4,
  },
  managementCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    minHeight: 80,
  },
  managementCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  managementIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  managementCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  managementCardSubtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
  },
});
