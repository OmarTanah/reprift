import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRankDefinition, promoteRank } from '../../src/engine/ranks';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { RankTier } from '../../src/types/engine';

export default function AriseCeremonyScreen() {
  const router = useRouter();
  const { toRank } = useLocalSearchParams<{ toRank?: string }>();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const targetRank = isRankTier(toRank) ? toRank : user.rank;
  const targetDefinition = getRankDefinition(targetRank);
  const intro = useSharedValue(0);
  const ring = useSharedValue(0);
  const rank = useSharedValue(0);
  const continueButton = useSharedValue(0);

  useEffect(() => {
    intro.value = withDelay(300, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    ring.value = withDelay(800, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    rank.value = withDelay(1700, withSequence(withSpring(1.12, { damping: 7, stiffness: 120 }), withSpring(1, { damping: 10, stiffness: 90 })));
    continueButton.value = withDelay(2800, withTiming(1, { duration: 500 }));
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, [continueButton, intro, rank, ring]);

  const introStyle = useAnimatedStyle(() => ({ opacity: intro.value, transform: [{ translateX: interpolate(intro.value, [0, 1], [-18, 0]) }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: interpolate(ring.value, [0, 0.3, 1], [0, 1, 0]), transform: [{ scale: interpolate(ring.value, [0, 1], [0.2, 2.2]) }] }));
  const rankStyle = useAnimatedStyle(() => ({ opacity: rank.value, transform: [{ scale: interpolate(rank.value, [0, 1], [0.25, 1]) }] }));
  const continueStyle = useAnimatedStyle(() => ({ opacity: continueButton.value, transform: [{ translateY: interpolate(continueButton.value, [0, 1], [18, 0]) }] }));

  const handleContinue = () => {
    setUser(promoteRank(user, targetRank));
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={[styles.recognition, introStyle]}>
          <Text style={styles.recognitionText}>[ RANK PROMOTION DETECTED ]</Text>
          <Text style={styles.recognitionSub}>SYSTEM AUTHORITY: VERIFIED</Text>
        </Animated.View>

        <View style={styles.centerStage}>
          <Animated.View style={[styles.shockwave, ringStyle]} />
          <Animated.View style={[styles.rankGlow, rankStyle]} />
          <Animated.Text style={[styles.rankLetter, rankStyle]}>{targetRank}</Animated.Text>
          <Animated.Text style={[styles.rankName, rankStyle]}>{targetDefinition.displayName.toUpperCase()} RANK</Animated.Text>
        </View>

        <Animated.View style={[styles.continueWrap, continueStyle]}>
          <Text style={styles.subtitle}>YOU HAVE BEEN RECOGNIZED AS {targetRank}-RANK.</Text>
          <Pressable style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]} onPress={handleContinue}>
            <Text style={styles.continueText}>CONTINUE</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function isRankTier(value: string | undefined): value is RankTier {
  return value === 'E' || value === 'D' || value === 'C' || value === 'B' || value === 'A' || value === 'S' || value === 'SS' || value === 'SSS';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl },
  recognition: { alignItems: 'center', marginTop: spacing.hero },
  recognitionText: { fontFamily: fonts.jetBrainsMonoBold, color: colors.systemCyan, fontSize: 13, letterSpacing: 1.5, textAlign: 'center' },
  recognitionSub: { fontFamily: fonts.interMedium, color: colors.textMuted, fontSize: 11, letterSpacing: 1, marginTop: spacing.sm },
  centerStage: { width: 260, height: 260, justifyContent: 'center', alignItems: 'center' },
  shockwave: { position: 'absolute', width: 150, height: 150, borderWidth: 2, borderColor: colors.systemCyan, borderRadius: 75 },
  rankGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: colors.gold, opacity: 0.12 },
  rankLetter: { fontFamily: fonts.jetBrainsMonoBold, color: colors.gold, fontSize: 138, lineHeight: 150, textShadowColor: colors.gold, textShadowRadius: 24 },
  rankName: { fontFamily: fonts.orbitronBold, color: colors.textPrimary, fontSize: 13, letterSpacing: 3, marginTop: spacing.sm },
  continueWrap: { width: '100%', alignItems: 'center', marginBottom: spacing.lg },
  subtitle: { fontFamily: fonts.interMedium, color: colors.textMuted, fontSize: 11, letterSpacing: 1, textAlign: 'center', marginBottom: spacing.lg },
  continueButton: { width: '100%', minHeight: 56, borderWidth: 1, borderColor: colors.gold, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  continueText: { fontFamily: fonts.orbitronBold, color: colors.gold, fontSize: 14, letterSpacing: 2 },
  buttonPressed: { opacity: 0.7 },
});