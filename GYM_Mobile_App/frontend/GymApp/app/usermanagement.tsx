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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Session } from '../constants/Session';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

interface User {
  _id: string;
  UserName: string;
  UserAge: number;
  UserNIC: string;
  UserContactNumber: string;
  Email: string;
  UserDP: string | null;
  Role: string;
  Approve: boolean;
}

export default function UserManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const loginAdminId = (params.adminId as string) || Session.getUserId();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isAdminApproved, setIsAdminApproved] = useState<boolean | null>(Session.getAdminApproved());

  /* ── Custom Alert & Confirmation Modals State ── */
  const [alertPopup, setAlertPopup] = useState<{
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

  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    targetUser: User | null;
  }>({
    visible: false,
    targetUser: null,
  });

  /* ── Fetch Data ── */
  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch users sorted with Approve = false at the top
      const response = await fetch(`${BACKEND_URL}/api/admin-manage/admin-manage-sort-up-to-approve-fales-users`);
      const data = await response.json();
      if (response.status === 200 && data.users) {
        setUsers(data.users);
      } else {
        showAlert('Error', data.message || 'Failed to retrieve users list.', 'error');
      }
    } catch (error) {
      showAlert('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const checkAdminApproval = async () => {
    if (!loginAdminId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/admin-get-approval-status/${loginAdminId}`);
      const data = await response.json();
      if (response.status === 200 && data.approvalStatus !== undefined) {
        setIsAdminApproved(data.approvalStatus);
        Session.setAdminApproved(data.approvalStatus);
        if (data.approvalStatus === false) {
          showAlert('Access Denied', 'Your admin account is not approved yet.', 'error');
        }
      }
    } catch (error) {
      console.error('Failed to check admin approval status:', error);
    }
  };

  useEffect(() => {
    if (!loginAdminId) {
      showAlert('Session Expired', 'Please login as an admin to continue.', 'error');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      return;
    }
    checkAdminApproval();
    fetchUsers(true);
  }, [loginAdminId]);

  /* ── Helpers ── */
  const showAlert = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setAlertPopup({ visible: true, title, message, type });
  };

  const dismissAlert = () => {
    setAlertPopup({ visible: false, title: '', message: '', type: 'info' });
  };

  /* ── Approve / Reject User ── */
  const handleToggleApprove = async (targetUserId: string, newStatus: boolean) => {
    if (isAdminApproved === false) {
      showAlert('Access Denied', 'Your admin account is not approved yet.', 'error');
      return;
    }
    if (!loginAdminId) return;
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin-manage/admin-manage-change-approve-for-user/${targetUserId}/${loginAdminId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Approve: newStatus }),
        }
      );
      const data = await response.json();
      if (response.status === 200) {
        // Refresh local items
        await fetchUsers(false);
        showAlert(
          'Success',
          `User has been ${newStatus ? 'Approved' : 'Rejected'} successfully.`,
          'success'
        );
      } else {
        showAlert('Update Failed', data.message || 'Failed to change approval status.', 'error');
      }
    } catch (error) {
      showAlert('Network Error', 'Could not update approval status.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Delete User ── */
  const openDeleteConfirm = (user: User) => {
    if (isAdminApproved === false) {
      showAlert('Access Denied', 'Your admin account is not approved yet.', 'error');
      return;
    }
    setDeleteConfirm({ visible: true, targetUser: user });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ visible: false, targetUser: null });
  };

  const handleConfirmDelete = async () => {
    if (isAdminApproved === false) {
      showAlert('Access Denied', 'Your admin account is not approved yet.', 'error');
      return;
    }
    const targetUserId = deleteConfirm.targetUser?._id;
    if (!targetUserId || !loginAdminId) return;

    closeDeleteConfirm();
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin-manage/admin-manage-delete-user/${targetUserId}/${loginAdminId}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();
      if (response.status === 200) {
        // Refresh local items
        await fetchUsers(false);
        showAlert('Success', 'User has been permanently deleted.', 'success');
      } else {
        showAlert('Deletion Failed', data.message || 'Failed to delete user.', 'error');
      }
    } catch (error) {
      showAlert('Network Error', 'Could not delete user.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        {/* Decorative Glow */}
        <View style={styles.glowCircle} />

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.pageTitle}>User Management</Text>
        <View style={styles.titleUnderline} />

        {/* Shadow Overlay */}
        <LinearGradient
          colors={[BG, 'rgba(13, 13, 13, 0)']}
          style={styles.fadeOverlay}
        />
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={TEXT_MUTED} />
            <Text style={styles.emptyText}>No users registered</Text>
            <Text style={styles.emptySubtext}>There are currently no user accounts in the system.</Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {users.map((item) => {
              const hasProfileImage = item.UserDP && item.UserDP !== 'None' && item.UserDP !== '';
              return (
                <View key={item._id} style={styles.card}>
                  {/* Card Header: DP, Name, Role, Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarWrapper}>
                      {hasProfileImage ? (
                        <Image source={{ uri: item.UserDP as string }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Ionicons name="person-outline" size={20} color={TEXT_SECONDARY} />
                        </View>
                      )}
                    </View>
                    <View style={styles.headerTextWrapper}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {item.UserName}
                      </Text>
                      <Text style={styles.userSubtitle}>
                        Age: {item.UserAge} • {item.Role}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        item.Approve ? styles.badgeApproved : styles.badgePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          item.Approve ? styles.badgeTextApproved : styles.badgeTextPending,
                        ]}
                      >
                        {item.Approve ? 'Approved' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Card Body: Contact and Personal Information */}
                  <View style={styles.cardBody}>
                    <Text style={styles.sectionLabel}>Contact Information</Text>

                    <View style={styles.infoRow}>
                      <Ionicons name="mail-outline" size={15} color={TEXT_MUTED} />
                      <Text style={styles.infoValue} numberOfLines={1}>{item.Email}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="call-outline" size={15} color={TEXT_MUTED} />
                      <Text style={styles.infoValue}>{item.UserContactNumber}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="card-outline" size={15} color={TEXT_MUTED} />
                      <Text style={styles.infoValue}>NIC: {item.UserNIC}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Card Actions: Approve / Reject Controls */}
                  {isAdminApproved === null ? (
                    <View style={styles.loadingActions}>
                      <ActivityIndicator size="small" color={ACCENT} />
                      <Text style={styles.loadingActionsText}>Checking permissions...</Text>
                    </View>
                  ) : (
                    <View style={[styles.actionsContainer, isAdminApproved === false && { opacity: 0.5 }]}>
                      <View style={styles.approvalButtonsRow}>
                        <TouchableOpacity
                          style={[
                            styles.approvalBtn,
                            styles.btnApproveStyle,
                            item.Approve ? styles.btnApproveActive : styles.btnInactive,
                          ]}
                          onPress={() => handleToggleApprove(item._id, true)}
                          disabled={isActionLoading}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={item.Approve ? TEXT_PRIMARY : TEXT_SECONDARY}
                          />
                          <Text
                            style={[
                              styles.approvalBtnText,
                              item.Approve ? styles.btnTextActive : styles.btnTextInactive,
                            ]}
                          >
                            Approve
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.approvalBtn,
                            styles.btnRejectStyle,
                            !item.Approve ? styles.btnRejectActive : styles.btnInactive,
                          ]}
                          onPress={() => handleToggleApprove(item._id, false)}
                          disabled={isActionLoading}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={!item.Approve ? TEXT_PRIMARY : TEXT_SECONDARY}
                          />
                          <Text
                            style={[
                              styles.approvalBtnText,
                              !item.Approve ? styles.btnTextActive : styles.btnTextInactive,
                            ]}
                          >
                            Reject
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.deleteUserButton}
                        onPress={() => openDeleteConfirm(item)}
                        disabled={isActionLoading}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={15} color={ERROR_RED} />
                        <Text style={styles.deleteUserButtonText}>Delete User</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        visible={deleteConfirm.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.warnIconWrapper}>
              <Ionicons name="warning-outline" size={28} color={ERROR_RED} />
            </View>
            <Text style={styles.confirmTitle}>Delete User</Text>
            <Text style={styles.modalConfirmText}>
              Are you sure you want to permanently delete user "{deleteConfirm.targetUser?.UserName}"? This action cannot be undone.
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={closeDeleteConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn, { backgroundColor: ERROR_RED }]}
                onPress={handleConfirmDelete}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Global Alert Popup Modal ── */}
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
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'ios' ? 82 : 67,
    zIndex: 10,
    padding: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
    marginBottom: 16,
  },
  glowCircle: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT,
    opacity: 0.05,
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: TEXT_SECONDARY,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
    gap: 12,
  },
  emptyText: {
    color: TEXT_PRIMARY,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtext: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: ACCENT,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  badgePending: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgeTextApproved: {
    color: SUCCESS_GREEN,
  },
  badgeTextPending: {
    color: ERROR_RED,
  },
  cardDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
    width: '100%',
  },
  cardBody: {
    width: '100%',
  },
  sectionLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 13.5,
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  approvalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  approvalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
  },
  btnApproveStyle: {
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  btnRejectStyle: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  btnApproveActive: {
    backgroundColor: SUCCESS_GREEN,
    borderColor: SUCCESS_GREEN,
  },
  btnRejectActive: {
    backgroundColor: ERROR_RED,
    borderColor: ERROR_RED,
  },
  btnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: BORDER,
  },
  approvalBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnTextActive: {
    color: TEXT_PRIMARY,
  },
  btnTextInactive: {
    color: TEXT_SECONDARY,
  },
  deleteUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    height: 42,
    gap: 6,
  },
  deleteUserButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ERROR_RED,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 30, 30, 0.98)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  warnIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  modalConfirmText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
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
    fontSize: 13.5,
  },
  modalConfirmBtn: {
    backgroundColor: ACCENT,
  },
  modalConfirmBtnText: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 13.5,
  },
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
  loadingActions: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  loadingActionsText: {
    color: TEXT_SECONDARY,
    fontSize: 12.5,
    fontWeight: '600',
  },
});
