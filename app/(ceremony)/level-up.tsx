import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemPanel } from '../../src/components/SystemPanel';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';

export default function LevelUpCeremonyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ levelsGained?: string; newLevel?: string }>();
  const user = useUserStore((state) => state.user);

  const levelsGained = params.levelsGained ? parseInt(params.levelsGained, 10) : 1;
  const newLevel = params.newLevel ? parseInt(params.newLevel, 10) : user.level;
  const statPointsAwarded = levelsGained * 3;

  // Cinematic animations
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [burstAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics fallback
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(burstAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, burstAnim]);

  const handleAllocate = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }
    router.replace('/(modals)/stat-allocation');
  };

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* System Alert Header */}
        <View style={styles.alertHeader}>
          <Text style={styles.alertTag}>[ SYSTEM RECOGNITION ]</Text>
          <Text style={styles.alertTitle}>LEVEL UP DETECTED</Text>
        </View>

        {/* Level Slam-in Display */}
        <SystemPanel style={styles.ceremonyCard}>
          <View style={styles.haloGlow} />

          <Ionicons
            name="flash"
            size={48}
            color={colors.systemCyan}
            style={styles.flashIcon}
          />

          <Text style={styles.levelPrefix}>NEW HUNTER LEVEL</Text>
          <Text style={styles.levelNumber}>{newLevel}</Text>

          {levelsGained > 1 && (
            <View style={styles.stackedPill}>
              <Text style={styles.stackedText}>+{levelsGained} LEVELS GAINED</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Stat Points Granted Notice */}
          <View style={styles.rewardNotice}>
            <Text style={styles.rewardLabel}>REWARD GRANTED</Text>
            <Text style={styles.rewardHighlight}>
              +{statPointsAwarded} STAT POINTS
            </Text>
            <Text style={styles.systemVoiceCopy}>
              "Hunter. The System has registered your physical advancement. Distribute
              your stat points to augment your physical vessel."
            </Text>
          </View>
        </SystemPanel>

        {/* Action CTAs */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleAllocate}
          >
            <Text style={styles.primaryButtonText}>DISTRIBUTE STAT POINTS</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.bgAbyss} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleDismiss}
          >
            <Text style={styles.secondaryButtonText}>RESUME TRAINING</Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05060E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  alertTag: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyanDim,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 4,
  },
  alertTitle: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 22,
    letterSpacing: 3,
  },
  ceremonyCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  haloGlow: {
    position: 'absolute',
    top: 20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.systemCyan,
    opacity: 0.12,
  },
  flashIcon: {
    marginBottom: spacing.xs,
  },
  levelPrefix: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 2,
  },
  levelNumber: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 64,
    lineHeight: 74,
    marginVertical: 4,
  },
  stackedPill: {
    backgroundColor: '#002B33',
    borderWidth: 1,
    borderColor: colors.systemCyan,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  stackedText: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 11,
    letterSpacing: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.systemCyanDim,
    opacity: 0.4,
    marginVertical: spacing.lg,
  },
  rewardNotice: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  rewardLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  rewardHighlight: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 18,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  systemVoiceCopy: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.systemCyan,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  primaryButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.bgAbyss,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  secondaryButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
