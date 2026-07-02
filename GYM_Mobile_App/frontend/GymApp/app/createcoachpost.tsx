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

export default function CreateCoachPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const coachId = (params.coachId as string) || Session.getUserId();
  const scrollViewRef = useRef<ScrollView>(null);

  /* ── Core State ── */
  const [coachPost, setCoachPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /* ── Form State (Create Mode) ── */
  const [postimage, setPostimage] = useState('');
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [fullname, setFullname] = useState('');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [duration, setDuration] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  /* ── Edit State ── */
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editPostImage, setEditPostImage] = useState('');
  const [isUploadingEditImg, setIsUploadingEditImg] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');

  /* ── Navigation/View State ── */
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  /* ── Popup State ── */
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

  /* ── Fetch Data ── */
  const fetchCoachPost = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/coachposts/coach-post-get-by-coach-id/${coachId}`);
      const data = await response.json();
      if (response.status === 200 && data.coachpost && data.coachpost.length > 0) {
        const post = data.coachpost[0];
        setCoachPost(post);
        // Pre-load the existing data into the form inputs
        setPostimage(post.postimage || '');
        setFullname(post.fullname || '');
        setDescription(post.description || '');
        setExperience(post.experience || '');
        setFee(String(post.fee || ''));
        setDuration(String(post.duration || ''));
        setContactNumber(post.contactNumber || '');
      } else {
        setCoachPost(null);
      }
    } catch (error) {
      setCoachPost(null);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (coachId) {
      fetchCoachPost();
    } else {
      showPopup('Session Expired', 'Please login to continue.', 'error', () => {
        router.replace('/login');
      });
    }
  }, [coachId]);

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

  /* ── Image Upload Functions ── */
  const selectCoachImage = async (isEdit = false) => {
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
      await uploadImage(asset.uri, asset.base64 || undefined, isEdit);
    }
  };

  const uploadImage = async (uri: string, base64Data?: string, isEdit = false) => {
    const setUploading = isEdit ? setIsUploadingEditImg : setIsUploadingImg;
    const setImg = isEdit ? setEditPostImage : setPostimage;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', base64Data ? `data:image/jpeg;base64,${base64Data}` : {
        uri,
        name: `coachpost_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('upload_preset', 'GymApp');

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.secure_url) {
        setImg(data.secure_url);
      } else {
        const errMsg = data.error?.message || 'Could not upload to Cloudinary.';
        showPopup('Upload Failed', errMsg, 'error');
      }
    } catch (error: any) {
      showPopup('Upload Error', error.message || 'An error occurred during upload.', 'error');
    } finally {
      setUploading(false);
    }
  };

  /* ── Validation Helper ── */
  const validateForm = (
    img: string,
    name: string,
    desc: string,
    exp: string,
    f: string,
    dur: string,
    phone: string
  ): boolean => {
    if (!img) {
      showPopup('Validation Error', 'Please upload a cover image.', 'error');
      return false;
    }
    if (!name.trim()) {
      showPopup('Validation Error', 'Please enter your full name.', 'error');
      return false;
    }
    if (!desc.trim()) {
      showPopup('Validation Error', 'Please enter a description.', 'error');
      return false;
    }
    if (!exp.trim()) {
      showPopup('Validation Error', 'Please enter your experience details.', 'error');
      return false;
    }
    const feeVal = Number(f);
    if (!f.trim() || isNaN(feeVal) || feeVal <= 0) {
      showPopup('Validation Error', 'Please enter a valid positive fee.', 'error');
      return false;
    }
    const durVal = Number(dur);
    if (!dur.trim() || isNaN(durVal) || durVal <= 0 || !Number.isInteger(durVal)) {
      showPopup('Validation Error', 'Please enter a valid positive integer duration (in months).', 'error');
      return false;
    }
    if (!phone.trim() || !/^\d{10}$/.test(phone)) {
      showPopup('Validation Error', 'Contact number must be exactly 10 digits.', 'error');
      return false;
    }
    return true;
  };

  /* ── Submit Creation ── */
  const handleCreateCoachPost = async () => {
    Keyboard.dismiss();

    if (isActionLoading) return;

    if (
      !validateForm(
        postimage,
        fullname,
        description,
        experience,
        fee,
        duration,
        contactNumber
      )
    ) {
      return;
    }

    setIsActionLoading(true);

    try {
      // Pre-check if coach post already exists to prevent duplicate creation
      const checkResponse = await fetch(`${BACKEND_URL}/api/coachposts/coach-post-get-by-coach-id/${coachId}`);
      const checkData = await checkResponse.json();
      if (checkResponse.status === 200 && checkData.coachpost && checkData.coachpost.length > 0) {
        const existingPost = checkData.coachpost[0];
        setCoachPost(existingPost);
        setPostimage(existingPost.postimage || '');
        setFullname(existingPost.fullname || '');
        setDescription(existingPost.description || '');
        setExperience(existingPost.experience || '');
        setFee(String(existingPost.fee || ''));
        setDuration(String(existingPost.duration || ''));
        setContactNumber(existingPost.contactNumber || '');

        showPopup('Info', 'Coach Post already exists. Switching to Edit mode.', 'info');
        setIsActionLoading(false);
        return;
      }

      const body = {
        fullname: fullname.trim(),
        description: description.trim(),
        experience: experience.trim(),
        fee: Number(fee),
        duration: Number(duration),
        contactNumber: contactNumber.trim(),
        postimage: postimage,
      };

      const response = await fetch(`${BACKEND_URL}/api/coachposts/coach-post-create/${coachId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 201 && data.coachPost) {
        showPopup('Success', 'Coach Post created successfully.', 'success', () => {
          setCoachPost(data.coachPost);
        });
      } else {
        showPopup('Error', data.message || 'Failed to create Coach Post.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Open Edit modal ── */
  const openEditModal = () => {
    if (!coachPost) return;
    setEditPostImage(coachPost.postimage || '');
    setEditDescription(coachPost.description || '');
    setEditExperience(coachPost.experience || '');
    setEditFee(String(coachPost.fee || ''));
    setEditDuration(String(coachPost.duration || ''));
    setEditContactNumber(coachPost.contactNumber || '');

    setEditModalVisible(true);
  };

  /* ── Save Updates ── */
  const handleSaveUpdates = async () => {
    Keyboard.dismiss();

    if (isActionLoading) return;

    if (!coachPost) return;

    if (
      !validateForm(
        postimage,
        coachPost.fullname || fullname,
        description,
        experience,
        fee,
        duration,
        contactNumber
      )
    ) {
      return;
    }

    setIsActionLoading(true);
    const coachPostId = coachPost._id;
    const fetchThunks: (() => Promise<any>)[] = [];

    // 1. Image
    if (postimage !== coachPost.postimage) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/coachposts/coach-post-image/${coachPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postimage: postimage }),
        })
      );
    }

    // 2. Description
    if (description.trim() !== coachPost.description) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/coachposts/coach-post-description/${coachPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: description.trim() }),
        })
      );
    }

    // 3. Experience
    if (experience.trim() !== coachPost.experience) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/coachposts/coach-post-experience/${coachPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ experience: experience.trim() }),
        })
      );
    }

    // 4. Fee
    if (Number(fee) !== coachPost.fee) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/coachposts/coach-post-fee/${coachPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fee: Number(fee) }),
        })
      );
    }

    // 5. Duration
    if (Number(duration) !== coachPost.duration) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/coachposts/coach-post-duration/${coachPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: Number(duration) }),
        })
      );
    }

    // 6. Contact Number
    if (contactNumber.trim() !== coachPost.contactNumber) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/coachposts/coach-post-contact-number/${coachPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactNumber: contactNumber.trim() }),
        })
      );
    }

    try {
      // Execute sequentially
      for (const thunk of fetchThunks) {
        await thunk();
      }
      setEditModalVisible(false);
      await fetchCoachPost();
      showPopup('Success', 'Coach post updated successfully.', 'success');
    } catch (err) {
      showPopup('Error', 'Failed to update all changes.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Delete Coach Post ── */
  const handleDeleteCoachPost = async () => {
    if (!coachPost) return;
    setDeleteConfirmVisible(false);
    setIsActionLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/coachposts/coach-post-delete/${coachPost._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.status === 200) {
        setEditModalVisible(false);
        setCoachPost(null);
        // Reset create form inputs
        setPostimage('');
        setFullname('');
        setDescription('');
        setExperience('');
        setFee('');
        setDuration('');
        setContactNumber('');
        showPopup('Deleted', 'Coach post deleted successfully.', 'success');
      } else {
        showPopup('Error', data.message || 'Failed to delete Coach Post.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not delete Coach Post.', 'error');
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
        onPress={() => router.push({ pathname: '/coachpage', params: { userId: coachId } } as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>
          {isLoading
            ? (params.editMode === 'true' ? "Edit Coach Post" : "Create Coach Post")
            : (coachPost ? "Edit Coach Post" : "Create Coach Post")}
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
        /* ── FORM MODE ── */
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker */}
          <Text style={styles.formSectionTitle}>Cover Image</Text>
          <TouchableOpacity
            style={[styles.imageUploadArea, { width: imageWidth, height: imageHeight }]}
            onPress={() => selectCoachImage(false)}
            disabled={isUploadingImg}
            activeOpacity={0.8}
          >
            {postimage ? (
              <>
                <Image source={{ uri: postimage }} style={styles.uploadedImage} />
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
                <Text style={styles.imagePlaceholderText}>Tap to select cover image (3:2)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formContainer}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={TEXT_MUTED}
                  value={fullname}
                  onChangeText={setFullname}
                  editable={!coachPost}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Tell clients about your coaching style, philosophy..."
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Experience */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Experience</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="medal-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5 Years Personal Trainer"
                  placeholderTextColor={TEXT_MUTED}
                  value={experience}
                  onChangeText={setExperience}
                />
              </View>
            </View>

            {/* Fee */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fee (Rs.)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5000"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="numeric"
                  value={fee}
                  onChangeText={setFee}
                />
              </View>
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (Months)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 3"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="number-pad"
                  value={duration}
                  onChangeText={setDuration}
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
                  placeholder="e.g. 0771234567"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isActionLoading && styles.submitButtonDisabled]}
            onPress={coachPost ? handleSaveUpdates : handleCreateCoachPost}
            disabled={isActionLoading}
            activeOpacity={0.85}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color={BG} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {coachPost ? "Edit Coach Post" : "Create Coach Post"}
                </Text>
                <Ionicons name="checkmark" size={20} color={BG} />
              </>
            )}
          </TouchableOpacity>

          {/* Delete Button (only if post exists) */}
          {coachPost && (
            <TouchableOpacity
              style={[styles.deletePostBtn, isActionLoading && styles.submitButtonDisabled]}
              onPress={() => setDeleteConfirmVisible(true)}
              disabled={isActionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={20} color={ERROR_RED} />
              <Text style={styles.deletePostBtnText}>Delete Coach Post</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Coach Post</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Image */}
              <Text style={styles.formSectionTitle}>Cover Image</Text>
              <TouchableOpacity
                style={[styles.imageUploadArea, { width: '100%', height: 180 }]}
                onPress={() => selectCoachImage(true)}
                disabled={isUploadingEditImg}
                activeOpacity={0.8}
              >
                {editPostImage ? (
                  <>
                    <Image source={{ uri: editPostImage }} style={styles.uploadedImage} />
                    <View style={styles.imageOverlayBadge}>
                      {isUploadingEditImg ? (
                        <ActivityIndicator size="small" color={TEXT_PRIMARY} />
                      ) : (
                        <Ionicons name="camera" size={18} color={TEXT_PRIMARY} />
                      )}
                    </View>
                  </>
                ) : isUploadingEditImg ? (
                  <ActivityIndicator size="large" color={ACCENT} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={48} color={TEXT_MUTED} />
                    <Text style={styles.imagePlaceholderText}>Tap to select cover image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textAreaInput]}
                    placeholder="Description..."
                    placeholderTextColor={TEXT_MUTED}
                    multiline
                    numberOfLines={4}
                    value={editDescription}
                    onChangeText={setEditDescription}
                  />
                </View>
              </View>

              {/* Experience */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="medal-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Experience"
                    placeholderTextColor={TEXT_MUTED}
                    value={editExperience}
                    onChangeText={setEditExperience}
                  />
                </View>
              </View>

              {/* Fee */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fee (Rs.)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="cash-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Fee"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={editFee}
                    onChangeText={setEditFee}
                  />
                </View>
              </View>

              {/* Duration */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Duration (Months)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Duration"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="number-pad"
                    value={editDuration}
                    onChangeText={setEditDuration}
                  />
                </View>
              </View>

              {/* Contact */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contact Number"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={editContactNumber}
                    onChangeText={setEditContactNumber}
                  />
                </View>
              </View>

              <View style={{ height: 24 }} />

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.submitButton, isActionLoading && styles.submitButtonDisabled, { marginBottom: 16 }]}
                onPress={handleSaveUpdates}
                disabled={isActionLoading}
                activeOpacity={0.85}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                    <Ionicons name="save-outline" size={20} color={BG} />
                  </>
                )}
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                style={[styles.deletePostBtn, isActionLoading && styles.submitButtonDisabled]}
                onPress={() => setDeleteConfirmVisible(true)}
                disabled={isActionLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={20} color={ERROR_RED} />
                <Text style={styles.deletePostBtnText}>Delete Coach Post</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Overlay */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmMessage}>
              Are you sure you want to permanently delete your coach post?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmNoBtn]}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmYesBtn]}
                onPress={handleDeleteCoachPost}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmYesBtnText}>Yes, Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Alert */}
      <Modal visible={popup.visible} transparent animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={dismissPopup} activeOpacity={0.85}>
              <Text style={styles.alertButtonText}>OK</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },

  /* ── Form Section Styling ── */
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 10,
  },
  imageUploadArea: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: BG,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    height: 52,
    width: '100%',
  },
  textAreaWrapper: {
    height: 110,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 14.5,
    height: '100%',
  },
  textAreaInput: {
    textAlignVertical: 'top',
    height: '100%',
  },

  /* ── Buttons ── */
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
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BG,
    letterSpacing: 0.5,
  },

  /* ── View Mode Card ── */
  coachPostCard: {
    width: '100%',
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  postImageContainer: {
    position: 'relative',
    width: '100%',
  },
  postImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  editIconBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  postBody: {
    padding: 22,
  },
  postCoachName: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  postDetailsGrid: {
    gap: 12,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  postDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postDetailText: {
    fontSize: 14.5,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  boldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 10,
  },
  postDescription: {
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

  /* ── Edit Modal Styling ── */
  editModalCard: {
    backgroundColor: '#151515',
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_PRIMARY,
  },
  modalScrollView: {
    padding: 20,
  },
  deletePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 8,
    marginTop: 8,
  },
  deletePostBtnText: {
    color: ERROR_RED,
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── Confirm Overlay ── */
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  confirmCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  confirmMessage: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmNoBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  confirmNoBtnText: {
    color: TEXT_SECONDARY,
    fontWeight: '700',
    fontSize: 14,
  },
  confirmYesBtn: {
    backgroundColor: ERROR_RED,
  },
  confirmYesBtnText: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 200,
  },
  alertCard: {
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
  alertMessage: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  alertButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
});
