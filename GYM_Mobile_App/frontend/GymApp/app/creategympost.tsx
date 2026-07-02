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

export default function CreateGymPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const gymId = (params.gymId as string) || Session.getUserId();
  const scrollViewRef = useRef<ScrollView>(null);


  /* ── Core State ── */
  const [gymPost, setGymPost] = useState<any>(null);
  const [gymDetails, setGymDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  /* ── Form State (Create Mode) ── */
  const [gymImg, setGymImg] = useState('');
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [gymInformation, setGymInformation] = useState('');
  const [city, setCity] = useState('');
  const [openHoursHour, setOpenHoursHour] = useState('');
  const [openHoursMinute, setOpenHoursMinute] = useState('');
  const [closeHoursHour, setCloseHoursHour] = useState('');
  const [closeHoursMinute, setCloseHoursMinute] = useState('');
  const [gymContactNumber, setGymContactNumber] = useState('');
  const [facilities, setFacilities] = useState<string[]>(['']);
  const [packages, setPackages] = useState<any[]>([
    {
      packageName: '',
      packagePrice: '',
      packageDuration: '',
      features: [''],
    },
  ]);

  /* ── Edit State ── */
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editGymImg, setEditGymImg] = useState('');
  const [isUploadingEditImg, setIsUploadingEditImg] = useState(false);
  const [editGymInformation, setEditGymInformation] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editOpenHoursHour, setEditOpenHoursHour] = useState('');
  const [editOpenHoursMinute, setEditOpenHoursMinute] = useState('');
  const [editCloseHoursHour, setEditCloseHoursHour] = useState('');
  const [editCloseHoursMinute, setEditCloseHoursMinute] = useState('');
  const [editGymContactNumber, setEditGymContactNumber] = useState('');
  const [editFacilities, setEditFacilities] = useState<any[]>([]);
  const [editPackages, setEditPackages] = useState<any[]>([]);

  /* ── Navigation/View State ── */
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
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
  const fetchGymDetails = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/gym/gym-details/${gymId}`);
      const data = await response.json();
      if (response.status === 200 && data.gym) {
        setGymDetails(data.gym);
      }
    } catch (error) {
      console.warn('Failed to fetch gym details:', error);
    }
  };

  const fetchGymPost = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/gym-posts/gym-post-get-by-gym-id/${gymId}`);
      const data = await response.json();
      if (response.status === 200 && data.gymPost) {
        setGymPost(data.gymPost);
        const expanded: Record<string, boolean> = {};
        data.gymPost.packages?.forEach((pkg: any) => {
          expanded[pkg._id] = true;
        });
        setExpandedPackages(expanded);
      } else {
        setGymPost(null);
      }
    } catch (error) {
      setGymPost(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gymId) {
      fetchGymDetails();
      fetchGymPost();
    } else {
      showPopup('Session Expired', 'Please login to continue.', 'error', () => {
        router.replace('/login');
      });
    }
  }, [gymId]);

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
  const selectGymImage = async (isEdit = false) => {
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
    const setImg = isEdit ? setEditGymImg : setGymImg;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', base64Data ? `data:image/jpeg;base64,${base64Data}` : {
        uri,
        name: `gympost_${Date.now()}.jpg`,
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

  /* ── Dynamic Form Handlers (Create Mode) ── */
  const handleAddFacility = () => {
    setFacilities([...facilities, '']);
  };

  const handleRemoveFacility = (index: number) => {
    const updated = facilities.filter((_, i) => i !== index);
    setFacilities(updated.length > 0 ? updated : ['']);
  };

  const handleFacilityChange = (index: number, value: string) => {
    const updated = [...facilities];
    updated[index] = value;
    setFacilities(updated);
  };

  const handleAddPackage = () => {
    setPackages([...packages, { packageName: '', packagePrice: '', packageDuration: '', features: [''] }]);
  };

  const handleRemovePackage = (index: number) => {
    const updated = packages.filter((_, i) => i !== index);
    setPackages(updated.length > 0 ? updated : [{ packageName: '', packagePrice: '', packageDuration: '', features: [''] }]);
  };

  const handlePackageFieldChange = (index: number, field: string, value: string) => {
    const updated = [...packages];
    updated[index][field] = value;
    setPackages(updated);
  };

  const handleAddPackageFeature = (pkgIndex: number) => {
    const updated = [...packages];
    updated[pkgIndex].features.push('');
    setPackages(updated);
  };

  const handleRemovePackageFeature = (pkgIndex: number, featIndex: number) => {
    const updated = [...packages];
    updated[pkgIndex].features = updated[pkgIndex].features.filter((_: string, i: number) => i !== featIndex);
    if (updated[pkgIndex].features.length === 0) {
      updated[pkgIndex].features.push('');
    }
    setPackages(updated);
  };

  const handlePackageFeatureChange = (pkgIndex: number, featIndex: number, value: string) => {
    const updated = [...packages];
    updated[pkgIndex].features[featIndex] = value;
    setPackages(updated);
  };

  /* ── Dynamic Form Handlers (Edit Mode) ── */
  const handleAddEditFacility = () => {
    setEditFacilities([...editFacilities, { fasility: '' }]);
  };

  const handleRemoveEditFacility = (index: number) => {
    const updated = editFacilities.filter((_: any, i: number) => i !== index);
    setEditFacilities(updated);
  };

  const handleEditFacilityChange = (index: number, value: string) => {
    const updated = [...editFacilities];
    updated[index].fasility = value;
    setEditFacilities(updated);
  };

  const handleAddEditPackage = () => {
    setEditPackages([...editPackages, { packageName: '', packagePrice: '', packageDuration: '', features: [''] }]);
  };

  const handleRemoveEditPackage = (index: number) => {
    const updated = editPackages.filter((_: any, i: number) => i !== index);
    setEditPackages(updated);
  };

  const handleEditPackageFieldChange = (index: number, field: string, value: string) => {
    const updated = [...editPackages];
    updated[index][field] = value;
    setEditPackages(updated);
  };

  const handleAddEditPackageFeature = (pkgIndex: number) => {
    const updated = [...editPackages];
    updated[pkgIndex].features.push('');
    setEditPackages(updated);
  };

  const handleRemoveEditPackageFeature = (pkgIndex: number, featIndex: number) => {
    const updated = [...editPackages];
    updated[pkgIndex].features = updated[pkgIndex].features.filter((_: string, i: number) => i !== featIndex);
    if (updated[pkgIndex].features.length === 0) {
      updated[pkgIndex].features.push('');
    }
    setEditPackages(updated);
  };

  const handleEditPackageFeatureChange = (pkgIndex: number, featIndex: number, value: string) => {
    const updated = [...editPackages];
    updated[pkgIndex].features[featIndex] = value;
    setEditPackages(updated);
  };

  /* ── Validation Helper ── */
  const validateForm = (
    img: string,
    desc: string,
    c: string,
    openH: string,
    openM: string,
    closeH: string,
    closeM: string,
    phone: string,
    facs: any[],
    pkgs: any[]
  ): boolean => {
    if (!img) {
      showPopup('Validation Error', 'Please upload a gym image.', 'error');
      return false;
    }
    if (!desc.trim()) {
      showPopup('Validation Error', 'Please enter a gym description.', 'error');
      return false;
    }
    if (!c.trim()) {
      showPopup('Validation Error', 'Please enter a city.', 'error');
      return false;
    }

    const oh = Number(openH);
    if (!openH.trim() || isNaN(oh) || !Number.isInteger(oh) || oh < 1 || oh > 24) {
      showPopup('Validation Error', 'Open Hour must be between 1 and 24.', 'error');
      return false;
    }
    const om = Number(openM);
    if (!openM.trim() || isNaN(om) || !Number.isInteger(om) || om < 0 || om > 59) {
      showPopup('Validation Error', 'Open Minute must be between 0 and 59.', 'error');
      return false;
    }

    const ch = Number(closeH);
    if (!closeH.trim() || isNaN(ch) || !Number.isInteger(ch) || ch < 1 || ch > 24) {
      showPopup('Validation Error', 'Close Hour must be between 1 and 24.', 'error');
      return false;
    }
    const cm = Number(closeM);
    if (!closeM.trim() || isNaN(cm) || !Number.isInteger(cm) || cm < 0 || cm > 59) {
      showPopup('Validation Error', 'Close Minute must be between 0 and 59.', 'error');
      return false;
    }

    if (!phone.trim() || !/^\d{10}$/.test(phone)) {
      showPopup('Validation Error', 'Gym contact number must be exactly 10 digits.', 'error');
      return false;
    }

    const validFacs = facs.filter(f => typeof f === 'string' ? f.trim() : f.fasility?.trim());
    if (validFacs.length === 0) {
      showPopup('Validation Error', 'Please add at least one facility.', 'error');
      return false;
    }

    if (pkgs.length === 0) {
      showPopup('Validation Error', 'Please add at least one package.', 'error');
      return false;
    }

    for (let i = 0; i < pkgs.length; i++) {
      const p = pkgs[i];
      if (!p.packageName?.trim()) {
        showPopup('Validation Error', `Package ${i + 1} must have a name.`, 'error');
        return false;
      }
      const price = Number(p.packagePrice);
      if (!p.packagePrice || isNaN(price) || price <= 0) {
        showPopup('Validation Error', `Package "${p.packageName || (i + 1)}" must have a valid positive price.`, 'error');
        return false;
      }
      if (!p.packageDuration?.trim()) {
        showPopup('Validation Error', `Package "${p.packageName}" must have a duration (e.g. Monthly).`, 'error');
        return false;
      }
      const validFeats = p.features?.filter((f: string) => f.trim());
      if (!validFeats || validFeats.length === 0) {
        showPopup('Validation Error', `Package "${p.packageName}" must have at least one feature.`, 'error');
        return false;
      }
    }

    return true;
  };

  /* ── Submit Creation ── */
  const handleCreateGymPost = async () => {
    Keyboard.dismiss();

    if (
      !validateForm(
        gymImg,
        gymInformation,
        city,
        openHoursHour,
        openHoursMinute,
        closeHoursHour,
        closeHoursMinute,
        gymContactNumber,
        facilities,
        packages
      )
    ) {
      return;
    }

    setIsActionLoading(true);
    const openH = `${openHoursHour.padStart(2, '0')}:${openHoursMinute.padStart(2, '0')}`;
    const closeH = `${closeHoursHour.padStart(2, '0')}:${closeHoursMinute.padStart(2, '0')}`;

    const cleanedFacs = facilities.filter(f => f.trim());
    const cleanedPkgs = packages.map(p => ({
      packageName: p.packageName.trim(),
      packagePrice: Number(p.packagePrice),
      packageDuration: p.packageDuration.trim(),
      features: p.features.filter((f: string) => f.trim()),
    }));

    const body = {
      gymInfotmation: gymInformation.trim(), // Database
      gymInformation: gymInformation.trim(), // Prompt
      gymFasilities: cleanedFacs.map(f => ({ fasility: f.trim() })), // Database
      gymFacilities: cleanedFacs.map(f => ({ facility: f.trim() })), // Prompt
      openHours: openH,
      closeHours: closeH,
      gymContactNumber: gymContactNumber.trim(),
      city: city.trim(),
      packages: cleanedPkgs,
      gymImg: gymImg,
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/gym-posts/gym-post-create/${gymId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 201 && data.gymPost) {
        showPopup('Success', 'Gym Post created successfully.', 'success', () => {
          setGymPost(data.gymPost);
          const expanded: Record<string, boolean> = {};
          data.gymPost.packages?.forEach((pkg: any) => {
            expanded[pkg._id] = true;
          });
          setExpandedPackages(expanded);
        });
      } else {
        showPopup('Error', data.message || 'Failed to create Gym Post.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not connect to the server.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Open Edit modal ── */
  const openEditModal = () => {
    if (!gymPost) return;
    setEditGymImg(gymPost.gymImg || '');
    setEditGymInformation(gymPost.gymInfotmation || '');
    setEditCity(gymPost.city || '');

    const [oh, om] = (gymPost.openHours || '08:00').split(':');
    setEditOpenHoursHour(String(Number(oh)));
    setEditOpenHoursMinute(String(Number(om)));

    const [ch, cm] = (gymPost.closeHours || '17:00').split(':');
    setEditCloseHoursHour(String(Number(ch)));
    setEditCloseHoursMinute(String(Number(cm)));

    setEditGymContactNumber(gymPost.gymContactNumber || '');
    setEditFacilities(
      gymPost.gymFasilities ? gymPost.gymFasilities.map((f: any) => ({ _id: f._id, fasility: f.fasility })) : []
    );
    setEditPackages(
      gymPost.packages
        ? gymPost.packages.map((p: any) => ({
            _id: p._id,
            packageName: p.packageName,
            packagePrice: String(p.packagePrice),
            packageDuration: p.packageDuration,
            features: [...p.features],
          }))
        : []
    );

    setEditModalVisible(true);
  };



  /* ── Save Updates ── */
  const handleSaveUpdates = async () => {
    Keyboard.dismiss();

    if (
      !validateForm(
        editGymImg,
        editGymInformation,
        editCity,
        editOpenHoursHour,
        editOpenHoursMinute,
        editCloseHoursHour,
        editCloseHoursMinute,
        editGymContactNumber,
        editFacilities,
        editPackages
      )
    ) {
      return;
    }

    setIsActionLoading(true);
    const gymPostId = gymPost._id;
    const fetchThunks: (() => Promise<any>)[] = [];

    // 1. Image
    if (editGymImg !== gymPost.gymImg) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-image-update/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymImg: editGymImg }),
        })
      );
    }

    // 2. City
    if (editCity !== gymPost.city) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-city-update/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: editCity }),
        })
      );
    }

    // 3. Description
    if (editGymInformation !== gymPost.gymInfotmation) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-information-update/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymInfotmation: editGymInformation }),
        })
      );
    }

    // 4. Open Hours
    const newOH = `${editOpenHoursHour.padStart(2, '0')}:${editOpenHoursMinute.padStart(2, '0')}`;
    if (newOH !== gymPost.openHours) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-open-hours-update/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ openHours: newOH }),
        })
      );
    }

    // 5. Close Hours
    const newCH = `${editCloseHoursHour.padStart(2, '0')}:${editCloseHoursMinute.padStart(2, '0')}`;
    if (newCH !== gymPost.closeHours) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-close-hours-update/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ closeHours: newCH }),
        })
      );
    }

    // 6. Contact Number
    if (editGymContactNumber !== gymPost.gymContactNumber) {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-contact-number-update/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newContactNumber: editGymContactNumber }),
        })
      );
    }

    // 7. Facilities Difference
    const origFacs = gymPost.gymFasilities || [];
    const facsToDelete = origFacs.filter((orig: any) => {
      const match = editFacilities.find((ed: any) => ed._id === orig._id);
      return !match || match.fasility !== orig.fasility;
    });
    const facsToAdd = editFacilities.filter((ed: any) => {
      if (!ed._id) return true;
      const match = origFacs.find((orig: any) => orig._id === ed._id);
      return match && match.fasility !== ed.fasility;
    });

    facsToDelete.forEach((f: any) => {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-fasilities-delete/${gymPostId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fasilityId: f._id }),
        })
      );
    });

    facsToAdd.forEach((f: any) => {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-fasilities-add/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fasility: f.fasility.trim() }),
        })
      );
    });

    // 8. Packages Difference
    const origPkgs = gymPost.packages || [];
    const pkgsToDelete = origPkgs.filter((orig: any) => {
      const match = editPackages.find((ed: any) => ed._id === orig._id);
      if (!match) return true;
      return (
        match.packageName !== orig.packageName ||
        Number(match.packagePrice) !== orig.packagePrice ||
        match.packageDuration !== orig.packageDuration ||
        JSON.stringify(match.features) !== JSON.stringify(orig.features)
      );
    });

    const pkgsToAdd = editPackages.filter((ed: any) => {
      if (!ed._id) return true;
      const match = origPkgs.find((orig: any) => orig._id === ed._id);
      return (
        match &&
        (match.packageName !== ed.packageName ||
          match.packagePrice !== Number(ed.packagePrice) ||
          match.packageDuration !== ed.packageDuration ||
          JSON.stringify(match.features) !== JSON.stringify(ed.features))
      );
    });

    pkgsToDelete.forEach((p: any) => {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-delete-package/${gymPostId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packageId: p._id }),
        })
      );
    });

    pkgsToAdd.forEach((p: any) => {
      fetchThunks.push(() =>
        fetch(`${BACKEND_URL}/api/gym-posts/gym-post-add-package/${gymPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageName: p.packageName.trim(),
            packagePrice: Number(p.packagePrice),
            packageDuration: p.packageDuration.trim(),
            features: p.features.filter((f: string) => f.trim()),
          }),
        })
      );
    });

    try {
      // Execute sequentially
      for (const thunk of fetchThunks) {
        await thunk();
      }
      setEditModalVisible(false);
      await fetchGymPost();
      showPopup('Success', 'Gym post updated successfully.', 'success');
    } catch (err) {
      showPopup('Error', 'Failed to update all changes.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  /* ── Delete Gym Post ── */
  const handleDeleteGymPost = async () => {
    if (!gymPost) return;
    setDeleteConfirmVisible(false);
    setIsActionLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/gym-posts/gym-post-delete/${gymPost._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.status === 200) {
        setEditModalVisible(false);
        setGymPost(null);
        // Reset create form inputs
        setGymImg('');
        setGymInformation('');
        setCity('');
        setOpenHoursHour('');
        setOpenHoursMinute('');
        setCloseHoursHour('');
        setCloseHoursMinute('');
        setGymContactNumber('');
        setFacilities(['']);
        setPackages([{ packageName: '', packagePrice: '', packageDuration: '', features: [''] }]);
        showPopup('Deleted', 'Gym post deleted successfully.', 'success');
      } else {
        showPopup('Error', data.message || 'Failed to delete Gym Post.', 'error');
      }
    } catch (error) {
      showPopup('Network Error', 'Could not delete Gym Post.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const togglePackageExpand = (pkgId: string) => {
    setExpandedPackages(prev => ({ ...prev, [pkgId]: !prev[pkgId] }));
  };

  const imageWidth = SCREEN_WIDTH - 48;
  const imageHeight = (imageWidth * 2) / 3;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* ── Back Button ── */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push({ pathname: '/gympage', params: { userId: gymId } } as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Fixed Header ── */}
      <View style={styles.headerContainer}>
        <View style={styles.glowCircle} />
        <Text style={styles.pageTitle}>
          {isLoading
            ? (params.editMode === 'true' ? "Edit Gym Post" : "Create Gym Post")
            : (gymPost ? "Edit Gym Post" : "Create Gym Post")}
        </Text>
        <View style={styles.titleUnderline} />
        <LinearGradient colors={[BG, 'rgba(13, 13, 13, 0)']} style={styles.fadeOverlay} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : gymPost ? (
        /* ── VIEW MODE (Gym Post Exists) ── */
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Post Card */}
          <View style={styles.gymPostCard}>
            <View style={styles.postImageContainer}>
              <Image source={{ uri: gymPost.gymImg }} style={[styles.postImage, { height: (SCREEN_WIDTH * 2) / 3 }]} />
              <TouchableOpacity style={styles.editIconBadge} onPress={openEditModal}>
                <Ionicons name="create" size={20} color={TEXT_PRIMARY} />
              </TouchableOpacity>
            </View>

            <View style={styles.postBody}>
              <Text style={styles.postGymName}>{gymDetails?.GymName || 'Gym Post'}</Text>
              
              <View style={styles.postLocationRow}>
                <Ionicons name="location" size={16} color={ACCENT} />
                <Text style={styles.postLocationText}>{gymPost.city}</Text>
              </View>

              <Text style={styles.postDescription}>{gymPost.gymInfotmation}</Text>

              <View style={styles.postInfoGrid}>
                <View style={styles.postInfoItem}>
                  <Ionicons name="time-outline" size={16} color={TEXT_SECONDARY} />
                  <Text style={styles.postInfoLabel}>Hours:</Text>
                  <Text style={styles.postInfoValue}>{gymPost.openHours} - {gymPost.closeHours}</Text>
                </View>

                <View style={styles.postInfoItem}>
                  <Ionicons name="call-outline" size={16} color={TEXT_SECONDARY} />
                  <Text style={styles.postInfoLabel}>Contact:</Text>
                  <Text style={styles.postInfoValue}>{gymPost.gymContactNumber}</Text>
                </View>
              </View>

              {/* Facilities Chips */}
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.tagsContainer}>
                {gymPost.gymFasilities && gymPost.gymFasilities.length > 0 ? (
                  gymPost.gymFasilities.map((item: any) => (
                    <View key={item._id} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{item.fasility}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No facilities listed</Text>
                )}
              </View>

              {/* Pricing Cards */}
              <Text style={styles.sectionTitle}>Gym Packages</Text>
              <View style={styles.packagesContainer}>
                {gymPost.packages && gymPost.packages.length > 0 ? (
                  gymPost.packages.map((pkg: any) => (
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
                  ))
                ) : (
                  <Text style={styles.noDataText}>No packages listed</Text>
                )}
              </View>

            </View>
          </View>
        </ScrollView>
      ) : (
        /* ── CREATE FORM MODE ── */
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 60 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Image Picker */}
          <Text style={styles.formSectionTitle}>Gym Image</Text>
          <TouchableOpacity
            style={[styles.imageUploadArea, { width: imageWidth, height: imageHeight }]}
            onPress={() => selectGymImage(false)}
            disabled={isUploadingImg}
            activeOpacity={0.8}
          >
            {gymImg ? (
              <>
                <Image source={{ uri: gymImg }} style={styles.uploadedImage} />
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
                <Text style={styles.imagePlaceholderText}>Tap to select gym image (3:2)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formContainer}>
            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gym Description</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textAreaInput]}
                  placeholder="Enter details about your gym..."
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={4}
                  value={gymInformation}
                  onChangeText={setGymInformation}
                />
              </View>
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Colombo"
                  placeholderTextColor={TEXT_MUTED}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            {/* Open Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Open Hours</Text>
              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Ionicons name="time-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Hour (1-24)"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={openHoursHour}
                    onChangeText={setOpenHoursHour}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Ionicons name="stopwatch-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min (0-59)"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={openHoursMinute}
                    onChangeText={setOpenHoursMinute}
                  />
                </View>
              </View>
            </View>

            {/* Close Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Close Hours</Text>
              <View style={styles.row}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Ionicons name="time-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Hour (1-24)"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={closeHoursHour}
                    onChangeText={setCloseHoursHour}
                  />
                </View>
                <View style={{ width: 16 }} />
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Ionicons name="stopwatch-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min (0-59)"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={closeHoursMinute}
                    onChangeText={setCloseHoursMinute}
                  />
                </View>
              </View>
            </View>

            {/* Contact Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gym Contact Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0771234567"
                  placeholderTextColor={TEXT_MUTED}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={gymContactNumber}
                  onChangeText={setGymContactNumber}
                />
              </View>
            </View>

            {/* Gym Facilities */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.inputLabel}>Gym Facilities</Text>
                <TouchableOpacity style={styles.circleAddBtn} onPress={handleAddFacility}>
                  <Ionicons name="add" size={18} color={ACCENT} />
                </TouchableOpacity>
              </View>

              {facilities.map((fac, idx) => (
                <View key={idx} style={[styles.row, { marginBottom: 10, alignItems: 'center' }]}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Free Wi-Fi"
                      placeholderTextColor={TEXT_MUTED}
                      value={fac}
                      onChangeText={val => handleFacilityChange(idx, val)}
                    />
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFacility(idx)}>
                    <Ionicons name="remove-circle-outline" size={24} color={ERROR_RED} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Packages */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.inputLabel}>Gym Packages</Text>
                <TouchableOpacity style={styles.circleAddBtn} onPress={handleAddPackage}>
                  <Ionicons name="add" size={18} color={ACCENT} />
                </TouchableOpacity>
              </View>

              {packages.map((pkg, pIdx) => (
                <View key={pIdx} style={styles.packageFormCard}>
                  <View style={styles.packageCardHeader}>
                    <Text style={styles.packageCardTitle}>Package #{pIdx + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemovePackage(pIdx)}>
                      <Ionicons name="trash-outline" size={20} color={ERROR_RED} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.packageCardBody}>
                    <TextInput
                      style={styles.packageInput}
                      placeholder="Package Name (e.g. Monthly Standard)"
                      placeholderTextColor={TEXT_MUTED}
                      value={pkg.packageName}
                      onChangeText={val => handlePackageFieldChange(pIdx, 'packageName', val)}
                    />
                    <View style={styles.row}>
                      <TextInput
                        style={[styles.packageInput, { flex: 1, marginRight: 10 }]}
                        placeholder="Price (LKR)"
                        placeholderTextColor={TEXT_MUTED}
                        keyboardType="numeric"
                        value={pkg.packagePrice}
                        onChangeText={val => handlePackageFieldChange(pIdx, 'packagePrice', val)}
                      />
                      <TextInput
                        style={[styles.packageInput, { flex: 1 }]}
                        placeholder="Duration (e.g. Monthly)"
                        placeholderTextColor={TEXT_MUTED}
                        value={pkg.packageDuration}
                        onChangeText={val => handlePackageFieldChange(pIdx, 'packageDuration', val)}
                      />
                    </View>

                    {/* Features list inside package */}
                    <View style={styles.featuresFormContainer}>
                      <View style={styles.sectionHeaderRow}>
                        <Text style={styles.featuresFormLabel}>Features</Text>
                        <TouchableOpacity style={styles.smallAddBtn} onPress={() => handleAddPackageFeature(pIdx)}>
                          <Ionicons name="add" size={14} color={ACCENT} />
                        </TouchableOpacity>
                      </View>
                      {pkg.features.map((feat: string, fIdx: number) => (
                        <View key={fIdx} style={[styles.row, { marginBottom: 6, alignItems: 'center' }]}>
                          <TextInput
                            style={[styles.packageInput, { flex: 1, marginBottom: 0 }]}
                            placeholder="Feature (e.g. Cardio area access)"
                            placeholderTextColor={TEXT_MUTED}
                            value={feat}
                            onChangeText={val => handlePackageFeatureChange(pIdx, fIdx, val)}
                          />
                          <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => handleRemovePackageFeature(pIdx, fIdx)}>
                            <Ionicons name="close-circle-outline" size={18} color={ERROR_RED} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>

          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isActionLoading && styles.submitButtonDisabled]}
            onPress={handleCreateGymPost}
            disabled={isActionLoading}
            activeOpacity={0.85}
          >
            {isActionLoading ? (
              <ActivityIndicator size="small" color={BG} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Create Gym Post</Text>
                <Ionicons name="checkmark" size={20} color={BG} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Gym Post</Text>
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
              <Text style={styles.formSectionTitle}>Gym Image</Text>
              <TouchableOpacity
                style={[styles.imageUploadArea, { width: '100%', height: 180 }]}
                onPress={() => selectGymImage(true)}
                disabled={isUploadingEditImg}
                activeOpacity={0.8}
              >
                {editGymImg ? (
                  <>
                    <Image source={{ uri: editGymImg }} style={styles.uploadedImage} />
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
                    <Text style={styles.imagePlaceholderText}>Tap to select gym image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gym Description</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <TextInput
                    style={[styles.input, styles.textAreaInput]}
                    placeholder="Description..."
                    placeholderTextColor={TEXT_MUTED}
                    multiline
                    numberOfLines={4}
                    value={editGymInformation}
                    onChangeText={setEditGymInformation}
                  />
                </View>
              </View>

              {/* City */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="location-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor={TEXT_MUTED}
                    value={editCity}
                    onChangeText={setEditCity}
                  />
                </View>
              </View>

              {/* Open Hours */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Open Hours</Text>
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Hour"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={editOpenHoursHour}
                      onChangeText={setEditOpenHoursHour}
                    />
                  </View>
                  <View style={{ width: 16 }} />
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Min"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={editOpenHoursMinute}
                      onChangeText={setEditOpenHoursMinute}
                    />
                  </View>
                </View>
              </View>

              {/* Close Hours */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Close Hours</Text>
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Hour"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={editCloseHoursHour}
                      onChangeText={setEditCloseHoursHour}
                    />
                  </View>
                  <View style={{ width: 16 }} />
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Min"
                      placeholderTextColor={TEXT_MUTED}
                      keyboardType="number-pad"
                      maxLength={2}
                      value={editCloseHoursMinute}
                      onChangeText={setEditCloseHoursMinute}
                    />
                  </View>
                </View>
              </View>

              {/* Contact */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gym Contact Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contact"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={editGymContactNumber}
                    onChangeText={setEditGymContactNumber}
                  />
                </View>
              </View>

              {/* Facilities */}
              <View style={styles.inputGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.inputLabel}>Facilities</Text>
                  <TouchableOpacity style={styles.circleAddBtn} onPress={handleAddEditFacility}>
                    <Ionicons name="add" size={18} color={ACCENT} />
                  </TouchableOpacity>
                </View>
                {editFacilities.map((f, idx) => (
                  <View key={idx} style={[styles.row, { marginBottom: 10, alignItems: 'center' }]}>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Facility"
                        placeholderTextColor={TEXT_MUTED}
                        value={f.fasility}
                        onChangeText={val => handleEditFacilityChange(idx, val)}
                      />
                    </View>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveEditFacility(idx)}>
                      <Ionicons name="remove-circle-outline" size={24} color={ERROR_RED} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Packages */}
              <View style={styles.inputGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.inputLabel}>Packages</Text>
                  <TouchableOpacity style={styles.circleAddBtn} onPress={handleAddEditPackage}>
                    <Ionicons name="add" size={18} color={ACCENT} />
                  </TouchableOpacity>
                </View>
                {editPackages.map((pkg, pIdx) => (
                  <View key={pIdx} style={styles.packageFormCard}>
                    <View style={styles.packageCardHeader}>
                      <Text style={styles.packageCardTitle}>Package #{pIdx + 1}</Text>
                      <TouchableOpacity onPress={() => handleRemoveEditPackage(pIdx)}>
                        <Ionicons name="trash-outline" size={20} color={ERROR_RED} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.packageCardBody}>
                      <TextInput
                        style={styles.packageInput}
                        placeholder="Name"
                        placeholderTextColor={TEXT_MUTED}
                        value={pkg.packageName}
                        onChangeText={val => handleEditPackageFieldChange(pIdx, 'packageName', val)}
                      />
                      <View style={styles.row}>
                        <TextInput
                          style={[styles.packageInput, { flex: 1, marginRight: 10 }]}
                          placeholder="Price (LKR)"
                          placeholderTextColor={TEXT_MUTED}
                          keyboardType="numeric"
                          value={pkg.packagePrice}
                          onChangeText={val => handleEditPackageFieldChange(pIdx, 'packagePrice', val)}
                        />
                        <TextInput
                          style={[styles.packageInput, { flex: 1 }]}
                          placeholder="Duration"
                          placeholderTextColor={TEXT_MUTED}
                          value={pkg.packageDuration}
                          onChangeText={val => handleEditPackageFieldChange(pIdx, 'packageDuration', val)}
                        />
                      </View>

                      {/* Features */}
                      <View style={styles.featuresFormContainer}>
                        <View style={styles.sectionHeaderRow}>
                          <Text style={styles.featuresFormLabel}>Features</Text>
                          <TouchableOpacity style={styles.smallAddBtn} onPress={() => handleAddEditPackageFeature(pIdx)}>
                            <Ionicons name="add" size={14} color={ACCENT} />
                          </TouchableOpacity>
                        </View>
                        {pkg.features.map((feat: string, fIdx: number) => (
                          <View key={fIdx} style={[styles.row, { marginBottom: 6, alignItems: 'center' }]}>
                            <TextInput
                              style={[styles.packageInput, { flex: 1, marginBottom: 0 }]}
                              placeholder="Feature"
                              placeholderTextColor={TEXT_MUTED}
                              value={feat}
                              onChangeText={val => handleEditPackageFeatureChange(pIdx, fIdx, val)}
                            />
                            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => handleRemoveEditPackageFeature(pIdx, fIdx)}>
                              <Ionicons name="close-circle-outline" size={18} color={ERROR_RED} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Buttons inside Modal ScrollView */}
              <TouchableOpacity
                style={[styles.submitButton, { marginTop: 24 }, isActionLoading && styles.submitButtonDisabled]}
                onPress={handleSaveUpdates}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={BG} />
                ) : (
                  <Text style={styles.submitButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deletePostBtn, { marginTop: 14 }]}
                onPress={() => setDeleteConfirmVisible(true)}
                disabled={isActionLoading}
              >
                <Ionicons name="trash" size={18} color={ERROR_RED} />
                <Text style={styles.deletePostBtnText}>Delete Gym Post</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── DELETE CONFIRMATION POPUP ── */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmMessage}>Are you sure you want to delete this gym post?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmBtn, styles.confirmNoBtn]} onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.confirmNoBtnText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, styles.confirmYesBtn]} onPress={handleDeleteGymPost}>
                <Text style={styles.confirmYesBtnText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── GLOBAL ALERT MODAL ── */}
      <Modal visible={popup.visible} transparent animationType="fade" onRequestClose={dismissPopup}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <Text style={styles.alertMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.alertButton} onPress={dismissPopup}>
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
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 60,
  },

  /* ── Form Styling ── */
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    alignSelf: 'flex-start',
    width: '100%',
  },
  imageUploadArea: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: TEXT_PRIMARY,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
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
  textAreaWrapper: {
    height: 120,
    alignItems: 'flex-start',
    paddingVertical: 12,
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
  textAreaInput: {
    textAlignVertical: 'top',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  circleAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  smallAddBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Package Card Form ── */
  packageFormCard: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
    width: '100%',
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 8,
  },
  packageCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  packageCardBody: {
    gap: 10,
  },
  packageInput: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    color: TEXT_PRIMARY,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    width: '100%',
    marginBottom: 6,
  },
  featuresFormContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  featuresFormLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_SECONDARY,
    marginBottom: 6,
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
    marginTop: 10,
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
  gymPostCard: {
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
  postGymName: {
    fontSize: 32,
    fontWeight: '900',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  postLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  postLocationText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },
  postDescription: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  postInfoGrid: {
    gap: 10,
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  postInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postInfoLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '700',
    width: 65,
  },
  postInfoValue: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  sectionTitle: {
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
    marginBottom: 24,
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
  noDataText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontStyle: 'italic',
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
  /* ── Global Alert Popup Modal ── */
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
