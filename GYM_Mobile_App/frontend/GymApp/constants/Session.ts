import { Platform } from 'react-native';

let currentUserId: string | null = null;
let currentUserEmail: string | null = null;
let adminApproved: boolean | null = null;
let jwtToken: string | null = null;

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
  setToken: (token: string | null) => {
    jwtToken = token;
    if (Platform.OS === 'web') {
      if (token) {
        localStorage.setItem('gym_app_token', token);
      } else {
        localStorage.removeItem('gym_app_token');
      }
    }
  },
  getToken: (): string | null => {
    if (Platform.OS === 'web') {
      return jwtToken || localStorage.getItem('gym_app_token');
    }
    return jwtToken;
  },
  clear: () => {
    currentUserId = null;
    currentUserEmail = null;
    adminApproved = null;
    jwtToken = null;
    if (Platform.OS === 'web') {
      localStorage.removeItem('gym_app_user_id');
      localStorage.removeItem('gym_app_user_email');
      localStorage.removeItem('gym_app_admin_approved');
      localStorage.removeItem('gym_app_token');
    }
  }
};

// Register global fetch interceptor to append JWT Bearer token automatically
if (typeof global !== 'undefined' && global.fetch) {
  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    // Extract URL
    const url = typeof input === 'string' ? input : (input && 'url' in input ? (input as any).url : '');
    
    // Check if call goes to our backend (avoiding external services like Cloudinary)
    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';
    const isBackendCall = url.startsWith(backendUrl) || url.startsWith('/api/');
    
    const token = Session.getToken();
    if (token && isBackendCall) {
      init = init || {};
      init.headers = init.headers || {};
      if (init.headers instanceof Headers) {
        if (!init.headers.has('Authorization')) {
          init.headers.set('Authorization', `Bearer ${token}`);
        }
      } else if (Array.isArray(init.headers)) {
        const hasAuth = init.headers.some(([key]) => key.toLowerCase() === 'authorization');
        if (!hasAuth) {
          init.headers.push(['Authorization', `Bearer ${token}`]);
        }
      } else {
        const headersRecord = init.headers as Record<string, string>;
        if (!headersRecord['Authorization'] && !headersRecord['authorization']) {
          headersRecord['Authorization'] = `Bearer ${token}`;
        }
      }
    }
    return originalFetch(input, init);
  };
}
