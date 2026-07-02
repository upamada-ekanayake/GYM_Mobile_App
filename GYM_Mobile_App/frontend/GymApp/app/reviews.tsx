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
const BACKEND_URL = 'http://192.168.1.5:5000';

interface ReviewAndRating {
  _id: string;
  PersonID: string;
  Review: string;
  Rating: number;
  createdAt: string;
  updatedAt: string;
}

export default function ReviewsScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const currentRole = (role as string) || 'User';
  const userId = Session.getUserId();

  /* ── State Hooks ── */
  const [reviews, setReviews] = useState<ReviewAndRating[]>([]);
  const [ownReviewIds, setOwnReviewIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [reviewerNames, setReviewerNames] = useState<Record<string, { name: string; role: string }>>({});

  /* ── Modal Visibility States ── */
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [adminDeleteConfirmVisible, setAdminDeleteConfirmVisible] = useState(false);

  /* ── Add Form State ── */
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5); // Default to 5 stars

  /* ── Edit Form State ── */
  const [selectedReview, setSelectedReview] = useState<ReviewAndRating | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState(5);

  /* ── Deletion Target State ── */
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

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
      showPopup('Session Expired', 'Please login to view or submit reviews.', 'error');
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      return;
    }
    fetchReviews();
    fetchOwnReviews();
  }, [userId]);

  /* ── API Call: Get All Reviews ── */
  const fetchReviews = async (showFullLoading = true) => {
    if (showFullLoading) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/review/review-and-rating-get-all`);
      const data = await response.json();
      if (response.status === 200 && data.reviewAndRating) {
        // Reverse array so that newest is at top
        const reversedReviews = [...data.reviewAndRating].reverse();
        setReviews(reversedReviews);
        // Load reviewer names for the retrieved reviews
        resolveReviewers(reversedReviews);
      } else if (response.status === 404) {
        setReviews([]);
      } else {
        console.error('Failed to fetch reviews:', data.message);
      }
    } catch (err) {
      console.error('Network error fetching reviews:', err);
    } finally {
      if (showFullLoading) {
        setIsLoading(false);
      }
    }
  };

  /* ── API Call: Get User's Own Reviews ── */
  const fetchOwnReviews = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/review/review-and-rating-get-by-person-id/${userId}`);
      const data = await response.json();
      if (response.status === 200 && data.reviewAndRating) {
        const ids = data.reviewAndRating.map((r: any) => r._id);
        setOwnReviewIds(ids);
      } else {
        setOwnReviewIds([]);
      }
    } catch (err) {
      console.error('Network error fetching own reviews:', err);
    }
  };

  /* ── Reviewer Profile Resolving Cache ── */
  const resolveReviewers = async (reviewsList: ReviewAndRating[]) => {
    const uniquePersonIds = Array.from(new Set(reviewsList.map((r) => r.PersonID)));
    const idsToFetch = uniquePersonIds.filter((id) => !reviewerNames[id]);
    if (idsToFetch.length === 0) return;

    const resolved: Record<string, { name: string; role: string }> = {};
    await Promise.all(
      idsToFetch.map(async (personId) => {
        const details = await fetchReviewerDetails(personId);
        resolved[personId] = details;
      })
    );

    setReviewerNames((prev) => ({ ...prev, ...resolved }));
  };

  const fetchReviewerDetails = async (personId: string): Promise<{ name: string; role: string }> => {
    // 1. Try User
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/user-details/${personId}`);
      if (res.status === 200) {
        const data = await res.json();
        if (data.user) {
          return { name: data.user.UserName, role: 'User' };
        }
      }
    } catch (err) {
      // Ignore and proceed
    }

    // 2. Try Admin
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/admin-details/${personId}`);
      if (res.status === 200) {
        const data = await res.json();
        if (data.admin) {
          return { name: data.admin.AdminName, role: 'Admin' };
        }
      }
    } catch (err) {
      // Ignore and proceed
    }

    // 3. Try Gym
    try {
      const res = await fetch(`${BACKEND_URL}/api/gym/gym-details/${personId}`);
      if (res.status === 200) {
        const data = await res.json();
        if (data.gym) {
          return { name: data.gym.GymName, role: 'Gym' };
        }
      }
    } catch (err) {
      // Ignore and proceed
    }

    // 4. Try Coach
    try {
      const res = await fetch(`${BACKEND_URL}/api/coach/coach-details/${personId}`);
      if (res.status === 200) {
        const data = await res.json();
        if (data.coach) {
          return { name: data.coach.CoachName, role: 'Coach' };
        }
      }
    } catch (err) {
      // Ignore and proceed
    }

    return { name: 'Gym Member', role: 'Member' };
  };

  /* ── Custom Popup Triggers ── */
  const showPopup = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setPopup({ visible: true, title, message, type });
  };

  const dismissPopup = () => {
    setPopup({ visible: false, title: '', message: '', type: 'info' });
  };

  /* ── API Call: Create Review & Rating ── */
  const handleAddReview = async () => {
    Keyboard.dismiss();

    if (!reviewText.trim()) {
      showPopup('Validation Error', 'Please enter your review text.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/review/review-and-rating-create/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Review: reviewText.trim(),
          Rating: rating,
        }),
      });

      const data = await response.json();
      if (response.status === 201) {
        setAddModalVisible(false);
        setReviewText('');
        setRating(5); // reset to default 5

        await fetchReviews(false);
        await fetchOwnReviews();

        showPopup('Success', 'Review and rating created successfully', 'success');
      } else {
        showPopup('Error', data.message || 'Failed to create review.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── API Call: Update Review ── */
  const handleUpdateReview = async () => {
    Keyboard.dismiss();
    if (!selectedReview) return;

    if (!editReviewText.trim()) {
      showPopup('Validation Error', 'Please enter your review text.', 'error');
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/review/review-and-rating-update/${selectedReview._id}/${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            Review: editReviewText.trim(),
            Rating: editRating,
          }),
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        setEditModalVisible(false);
        setSelectedReview(null);

        await fetchReviews(false);
        await fetchOwnReviews();

        showPopup('Success', 'Review and rating updated successfully', 'success');
      } else {
        showPopup('Error', data.message || 'Failed to update review.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── API Call: Delete Own Review ── */
  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    setDeleteConfirmVisible(false);
    setIsActionLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/review/review-and-rating-delete-by-person-id/${selectedReview._id}/${userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        setEditModalVisible(false);
        setSelectedReview(null);

        await fetchReviews(false);
        await fetchOwnReviews();

        showPopup('Success', 'Review deleted successfully', 'success');
      } else {
        showPopup('Error', data.message || 'Failed to delete review.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── API Call: Delete Admin Direct ── */
  const handleAdminDeleteReview = async () => {
    if (!reviewToDelete) return;
    setAdminDeleteConfirmVisible(false);
    setIsActionLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/review/review-and-rating-delete-by-id-admin-only/${reviewToDelete}/${userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (response.status === 200) {
        setReviewToDelete(null);

        await fetchReviews(false);
        await fetchOwnReviews();

        showPopup('Success', 'Review deleted successfully', 'success');
      } else {
        showPopup('Error', data.message || 'Failed to delete review as admin.', 'error');
      }
    } catch (err) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Edit Modal Trigger ── */
  const openEditModal = (review: ReviewAndRating) => {
    setSelectedReview(review);
    setEditReviewText(review.Review);
    setEditRating(review.Rating);
    setEditModalVisible(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Hamburger Menu ── */}
      <HamburgerMenu currentRole={(role as any) || 'User'} />

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>Reviews</Text>
        <View style={styles.titleUnderline} />
        <LinearGradient colors={[BG, 'rgba(13, 13, 13, 0)']} style={styles.fadeOverlay} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews available yet.</Text>
            <Text style={styles.emptySubtext}>Be the first to leave a review.</Text>
          </View>
        ) : (
          <View style={styles.reviewsContainer}>
            {reviews.map((item) => {
              const isOwnReview = ownReviewIds.includes(item._id) || item.PersonID === userId;
              const isAdmin = currentRole === 'Admin';

              return (
                <View key={item._id} style={styles.reviewCard}>
                  {/* Header Row: Stars and Actions */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= item.Rating ? 'star' : 'star-outline'}
                          size={18}
                          color={star <= item.Rating ? '#FBBF24' : TEXT_MUTED}
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>

                    <View style={styles.cardActions}>
                      {isOwnReview && (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => openEditModal(item)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={22} color={ACCENT} />
                        </TouchableOpacity>
                      )}
                      {isAdmin && (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => {
                            setReviewToDelete(item._id);
                            setAdminDeleteConfirmVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={22} color={ERROR_RED} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Review Text */}
                  <Text style={styles.reviewText}>{item.Review}</Text>

                  {/* Card Footer: Reviewer and Date */}
                  <View style={styles.cardFooter}>
                    <View style={styles.reviewerInfo}>
                      <Text style={styles.reviewerName}>
                        {reviewerNames[item.PersonID]?.name || 'Loading...'}
                      </Text>
                      {reviewerNames[item.PersonID]?.role && (
                        <View style={styles.reviewerRoleBadge}>
                          <Text style={styles.reviewerRoleText}>{reviewerNames[item.PersonID].role}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── 1. Floating Action Button (FAB) ── */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── 2. Add Review Modal ── */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>Add Review</Text>

            <View style={styles.modalFormContainer}>
              {/* Review Text Area */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Review</Text>
                <View style={[styles.inputWrapper, styles.textAreaInputWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textAreaInput]}
                    placeholder="Write your review here..."
                    placeholderTextColor={TEXT_MUTED}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Rating Star Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rating</Text>
                <View style={styles.starSelectorRow}>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <TouchableOpacity key={starNum} onPress={() => setRating(starNum)} activeOpacity={0.7}>
                      <Ionicons
                        name={starNum <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={starNum <= rating ? '#FBBF24' : TEXT_MUTED}
                        style={{ marginHorizontal: 6 }}
                      />
                    </TouchableOpacity>
                  ))}
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
                onPress={handleAddReview}
                disabled={isActionLoading}
                activeOpacity={0.85}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Add Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3. Edit Review Modal ── */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>Edit Review</Text>

            <View style={styles.modalFormContainer}>
              {/* Review Text Area */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Review</Text>
                <View style={[styles.inputWrapper, styles.textAreaInputWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textAreaInput]}
                    placeholder="Write your review here..."
                    placeholderTextColor={TEXT_MUTED}
                    value={editReviewText}
                    onChangeText={setEditReviewText}
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Rating Star Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rating</Text>
                <View style={styles.starSelectorRow}>
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <TouchableOpacity key={starNum} onPress={() => setEditRating(starNum)} activeOpacity={0.7}>
                      <Ionicons
                        name={starNum <= editRating ? 'star' : 'star-outline'}
                        size={36}
                        color={starNum <= editRating ? '#FBBF24' : TEXT_MUTED}
                        style={{ marginHorizontal: 6 }}
                      />
                    </TouchableOpacity>
                  ))}
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
                onPress={handleUpdateReview}
                disabled={isActionLoading}
                activeOpacity={0.85}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Update Review</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Delete Review Button */}
            <TouchableOpacity
              style={[styles.deleteButton, { marginTop: 14 }]}
              onPress={() => setDeleteConfirmVisible(true)}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={ERROR_RED} />
              <Text style={styles.deleteButtonText}>Delete Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 4. Delete Own Confirmation Modal ── */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.modalConfirmText}>Are you sure you want to delete this review?</Text>

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
                onPress={handleDeleteReview}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 5. Admin Delete Confirmation Modal ── */}
      <Modal
        visible={adminDeleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setAdminDeleteConfirmVisible(false);
          setReviewToDelete(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <Text style={styles.modalConfirmText}>Are you sure you want to delete this review?</Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setAdminDeleteConfirmVisible(false);
                  setReviewToDelete(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn, { backgroundColor: ERROR_RED }]}
                onPress={handleAdminDeleteReview}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 6. Global Alert Popup Modal ── */}
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
    paddingBottom: 100, // Extra padding to clear FAB
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

  /* ── Reviews Cards ── */
  reviewsContainer: {
    width: '100%',
  },
  reviewCard: {
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
    marginBottom: 14,
  },
  cardStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 6,
  },
  reviewText: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  reviewerRoleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  reviewerRoleText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reviewDate: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
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
  textAreaInputWrapper: {
    height: 120,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 15,
    height: '100%',
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
    paddingBottom: 14,
  },
  starSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
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
