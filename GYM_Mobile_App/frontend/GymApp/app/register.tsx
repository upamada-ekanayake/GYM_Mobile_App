import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 24;
const GRID_GAP = 16;
const BUTTON_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;

export default function RegisterScreen() {
  const router = useRouter();

  const handleUserRegister = () => {
    router.push('/userregister');
  };

  const handleGymRegister = () => {
    router.push('/gymregister');
  };

  const handleCoachRegister = () => {
    router.push('/coachregister');
  };

  const handleAdminRegister = () => {
    router.push('/adminregister');
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
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Glow accent (decorative, matching login) ── */}
        <View style={styles.glowCircle} />

        {/* ── Hero Image ── */}
        <View style={styles.heroContainer}>
          <Image
            source={require('../assets/images/02.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* ── Heading ── */}
        <Text style={styles.heading}>Choose your registration Type</Text>

        {/* ── 2×2 Button Grid ── */}
        <View style={styles.grid}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={handleUserRegister}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/images/03.png')}
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={handleGymRegister}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/images/04.png')}
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              style={styles.gridButton}
              onPress={handleCoachRegister}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/images/05.png')}
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.gridButton}
              onPress={handleAdminRegister}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/images/06.png')}
                style={styles.buttonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ── Colour Tokens ── */
const ACCENT = '#8A2BE2'; // Aura Violet
const BG = '#08080C'; // Obsidian Black
const CARD = '#12121A'; // Deep Charcoal
const BORDER = '#241C35'; // Deep Violet Border

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    overflow: 'hidden',
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

  /* ── Scroll ── */
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 40,
  },

  /* ── Hero Image ── */
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

  heroContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroImage: {
    width: 160,
    height: 160,
  },

  /* ── Heading ── */
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.4,
  },

  /* ── Grid ── */
  grid: {
    width: '100%',
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: GRID_GAP,
  },

  /* ── Grid Button ── */
  gridButton: {
    flex: 1,
    aspectRatio: 2 / 3,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    /* Shadow */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  /* ── Button Image ── */
  buttonImage: {
    width: '80%',
    height: '80%',
  },
});
