import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '../constants/Session';

/* ── Backend Config ── */
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5000';
const ERROR_RED = '#EF4444';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isUnapprovedAdmin, setIsUnapprovedAdmin] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; title: string; message: string; type: 'error' | 'success' | 'info' }>({
    visible: false, title: '', message: '', type: 'info',
  });

  const showPopup = (title: string, message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setPopup({ visible: true, title, message, type });
  };

  const dismissPopup = () => {
    setPopup({ visible: false, title: '', message: '', type: 'info' });
    if (isUnapprovedAdmin) {
      setEmail('');
      setPassword('');
      setIsUnapprovedAdmin(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      showPopup('Validation Error', 'Please enter your email address.', 'error');
      return;
    }
    if (!password) {
      showPopup('Validation Error', 'Please enter your password.', 'error');
      return;
    }

    setIsLoggingIn(true);

    const endpoints = [
      {
        roleName: 'User',
        loginUrl: `${BACKEND_URL}/api/user/user-login`,
        roleUrl: `${BACKEND_URL}/api/user/user-role`,
        route: '/userpage'
      },
      {
        roleName: 'Gym',
        loginUrl: `${BACKEND_URL}/api/gym/gym-login`,
        roleUrl: `${BACKEND_URL}/api/gym/gym-role`,
        route: '/gympage'
      },
      {
        roleName: 'Coach',
        loginUrl: `${BACKEND_URL}/api/coach/coach-login`,
        roleUrl: `${BACKEND_URL}/api/coach/coach-role`,
        route: '/coachpage'
      },
      {
        roleName: 'Admin',
        loginUrl: `${BACKEND_URL}/api/admin/admin-login`,
        roleUrl: `${BACKEND_URL}/api/admin/admin-role`,
        route: '/adminpage'
      }
    ];

    try {
      // 1. Try to login via all controllers in parallel
      const loginPromises = endpoints.map(async (ep) => {
        try {
          const res = await fetch(ep.loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email.trim(), Password: password })
          });
          const data = await res.json();
          return { status: res.status, data, endpoint: ep };
        } catch (err) {
          return { status: 500, error: err, endpoint: ep };
        }
      });

      const results = await Promise.all(loginPromises);

      // Check if Admin endpoint returned unapproved error
      const unapprovedAdminResult = results.find(
        r => r.endpoint.roleName === 'Admin' && r.status === 400 && r.data?.message === 'Admin is not approved yet'
      );

      if (unapprovedAdminResult) {
        setIsUnapprovedAdmin(true);
        showPopup('Approval Pending', 'Admin is not approved yet', 'error');
        return;
      }

      // Find successful authentication
      const successResult = results.find(r => r.status === 200);

      if (successResult) {
        const ep = successResult.endpoint;
        const token = successResult.data?.token;
        if (token) {
          Session.setToken(token);
        }

        try {
          const roleRes = await fetch(ep.roleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: email.trim() })
          });

          if (roleRes.status === 200) {
            const roleData = await roleRes.json();
            const retrievedRole = roleData.role;

            // Perform Role-Based Navigation
            if (retrievedRole === 'User') {
              const loggedInUser = successResult.data?.user;
              if (loggedInUser) {
                Session.setUserId(loggedInUser._id);
                Session.setUserEmail(loggedInUser.Email);
              }
              router.push({ pathname: '/userpage', params: { userId: loggedInUser?._id } } as any);
            } else if (retrievedRole === 'Gym') {
              const loggedInGym = successResult.data?.gym;
              if (loggedInGym) {
                Session.setUserId(loggedInGym._id);
                Session.setUserEmail(loggedInGym.Email);
              }
              router.push({ pathname: '/gympage', params: { userId: loggedInGym?._id } } as any);
            } else if (retrievedRole === 'Coach') {
              const loggedInCoach = successResult.data?.coach;
              if (loggedInCoach) {
                Session.setUserId(loggedInCoach._id);
                Session.setUserEmail(loggedInCoach.Email);
              }
              router.push({ pathname: '/coachpage', params: { userId: loggedInCoach?._id } } as any);
            } else if (retrievedRole === 'Admin') {
              const loggedInAdmin = successResult.data?.admin;
              if (loggedInAdmin) {
                Session.setUserId(loggedInAdmin._id);
                Session.setUserEmail(loggedInAdmin.Email);
                Session.setAdminApproved(loggedInAdmin.Approve);
              }
              router.push({ pathname: '/adminpage', params: { userId: loggedInAdmin?._id } } as any);
            } else {
              showPopup('Role Error', `Unknown user role: ${retrievedRole}`, 'error');
            }
          } else {
            const errData = await roleRes.json();
            showPopup('Role Error', errData.message || 'Failed to retrieve user role.', 'error');
          }
        } catch (roleErr) {
          console.error('Role retrieval error:', roleErr);
          showPopup('Role Error', 'Could not retrieve user role from server.', 'error');
        }
        return;
      }

      // If not successful, check if there was a wrong password error
      const wrongPasswordResult = results.find(r => r.status === 400 && r.data?.message === 'Invalid password');

      if (wrongPasswordResult) {
        showPopup('Login Failed', 'Invalid password. Please try again.', 'error');
      } else {
        showPopup('Login Failed', 'Invalid email address or account not found.', 'error');
      }

    } catch (error) {
      console.error('Login error:', error);
      showPopup('Network Error', 'Could not connect to the server. Please try again.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Glow accent (decorative) ── */}
          <View style={styles.glowCircle} />

          {/* ── Logo Image ── */}
          <Image
            source={require('../assets/images/aurafit-logo.png')}
            style={[
              styles.logoImage,
              keyboardOpen && styles.logoImageSmall,
            ]}
            resizeMode="contain"
          />

          {/* ── Sub-heading ── */}
          <Text style={styles.subHeading}>Welcome to AuraFit</Text>

          {/* ── Input Fields ── */}
          <View style={styles.inputContainer}>
            {/* Email */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#666"
                style={styles.inputIconLeft}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="sentences"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#666"
                style={styles.inputIconLeft}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#555"
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
                  color="#888"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Login Button ── */}
          <TouchableOpacity
            style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <ActivityIndicator size="small" color="#0D0D0D" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Login</Text>
                <Ionicons name="arrow-forward" size={20} color="#0D0D0D" />
              </>
            )}
          </TouchableOpacity>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Register Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

/* ── Colour Tokens ── */
const ACCENT = '#8A2BE2'; // Aura Violet
const ACCENT_EMERALD = '#00FF87'; // Neon Emerald
const BG = '#08080C'; // Deep Obsidian
const CARD = '#12121A'; // Deep Charcoal
const BORDER = '#241C35'; // Deep Violet Border
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#B3AEC6'; // Soft purple-gray

const styles = StyleSheet.create({
  /* ── Screen ── */
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 0,
    paddingBottom: 40,
  },

  /* ── Decorative glow ── */
  glowCircle: {
    position: 'absolute',
    top: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: ACCENT,
    opacity: 0.08,
  },

  /* ── Logo ── */
  logoImage: {
    width: 180,
    height: 180,
    marginTop: 40,
    marginBottom: 10,
  },
  logoImageSmall: {
    width: 100,
    height: 100,
    marginTop: 20,
    marginBottom: 5,
  },
  subHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT_EMERALD,
    marginBottom: 40,
    letterSpacing: 0.6,
    textAlign: 'center',
  },

  /* ── Inputs ── */
  inputContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 28,
    alignItems: 'center',
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
  inputIconLeft: {
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

  /* ── Login Button ── */
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 56,
    backgroundColor: ACCENT,
    borderRadius: 16,
    gap: 8,
    // shadow
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },

  /* ── Footer ── */
  footer: {
    flexDirection: 'row',
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT_EMERALD,
  },
  loginButtonDisabled: {
    opacity: 0.6,
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
  modalIconError: {
    backgroundColor: '#EF4444',
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
  modalButtonError: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
});
