import { Platform } from 'react-native';

let currentUserId: string | null = null;
let currentUserEmail: string | null = null;
let adminApproved: boolean | null = null;

export const Session = {
  setUserId: (id: string | null) => {
    currentUserId = id;
    if (Platform.OS === 'web') {
      if (id) {
        localStorage.setItem('gym_app_user_id', id);
      } else {
        localStorage.removeItem('gym_app_user_id');
      }
    }
  },
  getUserId: (): string | null => {
    if (Platform.OS === 'web') {
      return currentUserId || localStorage.getItem('gym_app_user_id');
    }
    return currentUserId;
  },
  setUserEmail: (email: string | null) => {
    currentUserEmail = email;
    if (Platform.OS === 'web') {
      if (email) {
        localStorage.setItem('gym_app_user_email', email);
      } else {
        localStorage.removeItem('gym_app_user_email');
      }
    }
  },
  getUserEmail: (): string | null => {
    if (Platform.OS === 'web') {
      return currentUserEmail || localStorage.getItem('gym_app_user_email');
    }
    return currentUserEmail;
  },
  setAdminApproved: (approved: boolean | null) => {
    adminApproved = approved;
    if (Platform.OS === 'web') {
      if (approved !== null) {
        localStorage.setItem('gym_app_admin_approved', String(approved));
      } else {
        localStorage.removeItem('gym_app_admin_approved');
      }
    }
  },
  getAdminApproved: (): boolean | null => {
    if (Platform.OS === 'web') {
      const val = localStorage.getItem('gym_app_admin_approved');
      return adminApproved !== null ? adminApproved : (val ? val === 'true' : null);
    }
    return adminApproved;
  },
  clear: () => {
    currentUserId = null;
    currentUserEmail = null;
    adminApproved = null;
    if (Platform.OS === 'web') {
      localStorage.removeItem('gym_app_user_id');
      localStorage.removeItem('gym_app_user_email');
      localStorage.removeItem('gym_app_admin_approved');
    }
  }
};
