import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { SystemPanel } from '../../src/components/SystemPanel';
import { evaluateMilestones, MILESTONE_ARMOR_CATALOG } from '../../src/engine/rewards';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { UserMilestoneMetrics } from '../../src/types/engine';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const cardRef = useRef<any>(null);
  const [sharing, setSharing] = useState(false);

  // Evaluate milestones
  const metrics: UserMilestoneMetrics = {
    lifetimePullups: 0,
    maxPlankSeconds: 0,
    lifetimeRunMeters: 0,
    passedTrials: [],
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lifetimeMuscleUps: 0,
    maxLsitSeconds: 0,
    accountAgeDays: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
    level: user.level,
  };

  const unlockedMilestones = evaluateMilestones(metrics, []);

  const handleShareCard = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }

    setSharing(true);
    try {
      let shareUri: string | null = null;
      if (cardRef.current) {
        try {
          shareUri = await captureRef(cardRef, {
            format: 'png',
            quality: 0.95,
          });
        } catch {
          shareUri = null;
        }
      }

      await Share.share({
        message: `[ REPRIFT // SYSTEM RECORD ]\nHunter: ${user.displayName.toUpperCase()}\nLevel: ${user.level} · Rank: [ ${user.rank} ]\nSTR: ${user.stats.str} | VIT: ${user.stats.vit} | AGI: ${user.stats.agi}\nCurrent Streak: ${user.currentStreak} Days\nThe System has recognized me.`,
        url: shareUri ?? undefined,
      });
    } catch {
      Alert.alert('System Notice', 'Could not share Hunter Card at this time.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.systemSub}>SYSTEM ARCHIVE</Text>
            <Text style={styles.headerTitle}>HUNTER CARD</Text>
          </View>
          <Pressable style={styles.shareIconButton} onPress={handleShareCard} disabled={sharing}>
            <Ionicons name="share-outline" size={20} color={colors.systemCyan} />
          </Pressable>
        </View>

        {/* Unspent SP Action Banner */}
        {user.statPoints > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.spNoticeBanner,
              pressed && styles.bannerPressed,
            ]}
            onPress={() => router.push('/(modals)/stat-allocation')}
          >
            <View style={styles.spNoticeLeft}>
              <Ionicons name="alert-circle" size={22} color={colors.systemCyan} />
              <View>
                <Text style={styles.spNoticeTitle}>
                  {user.statPoints} UNALLOCATED STAT POINTS
                </Text>
                <Text style={styles.spNoticeSub}>
                  Tap to enhance STR, VIT, or AGI
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.systemCyan} />
          </Pressable>
        )}

        {/* The Capturable Hunter Card */}
        <View collapsable={false} ref={cardRef}>
          <SystemPanel style={styles.hunterCard}>
            {/* Top Identity Section */}
            <View style={styles.cardIdentityRow}>
              <View style={styles.avatarCircle}>
                <Ionicons name="shield" size={32} color={colors.systemCyan} />
              </View>

              <View style={styles.identityDetails}>
                <Text style={styles.titleText}>
                  {user.equippedTitle ? `« ${user.equippedTitle.toUpperCase()} »` : '« UNAWAKENED »'}
                </Text>
                <Text style={styles.hunterName}>{user.displayName.toUpperCase()}</Text>
                <Text style={styles.hunterUid}>ID: {user.uid}</Text>
              </View>

              <View style={styles.rankBadgeContainer}>
                <Text style={styles.rankBadgeText}>[ {user.rank} ]</Text>
                <Text style={styles.rankTierLabel}>RANK</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Level & Progression Info */}
            <View style={styles.levelRow}>
              <View>
                <Text style={styles.levelLabel}>SYSTEM LEVEL</Text>
                <Text style={styles.levelValue}>{user.level}</Text>
              </View>
              <View style={styles.levelRight}>
                <Text style={styles.xpLabel}>RELOAD / SYNC</Text>
                <Text style={styles.xpValue}>LOCAL-FIRST</Text>
              </View>
            </View>

            {/* Combat Attributes Grid */}
            <Text style={styles.attributesHeader}>COMBAT ATTRIBUTES</Text>
            <View style={styles.attributesGrid}>
              <View style={styles.attributeBox}>
                <Text style={styles.attrTag}>STR</Text>
                <Text style={styles.attrNumber}>{user.stats.str}</Text>
                <Text style={styles.attrDesc}>Muscular Power</Text>
              </View>

              <View style={styles.attributeBox}>
                <Text style={styles.attrTag}>VIT</Text>
                <Text style={styles.attrNumber}>{user.stats.vit}</Text>
                <Text style={styles.attrDesc}>Body Density</Text>
              </View>

              <View style={styles.attributeBox}>
                <Text style={styles.attrTag}>AGI</Text>
                <Text style={styles.attrNumber}>{user.stats.agi}</Text>
                <Text style={styles.attrDesc}>Speed / Velocity</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Streak & Shields */}
            <View style={styles.resilienceRow}>
              <View style={styles.resilienceItem}>
                <Text style={styles.resilienceLabel}>CURRENT STREAK</Text>
                <Text style={styles.resilienceValue}>{user.currentStreak} DAYS</Text>
              </View>

              <View style={styles.resilienceItem}>
                <Text style={styles.resilienceLabel}>LONGEST STREAK</Text>
                <Text style={styles.resilienceValue}>{user.longestStreak} DAYS</Text>
              </View>

              <View style={styles.resilienceItem}>
                <Text style={styles.resilienceLabel}>STREAK SHIELDS</Text>
                <View style={styles.shieldsRow}>
                  <Ionicons name="shield-checkmark" size={16} color={colors.systemCyan} />
                  <Text style={styles.resilienceValue}>{user.streakShields} ACTIVE</Text>
                </View>
              </View>
            </View>
          </SystemPanel>
        </View>

        {/* Milestone Armory Preview */}
        <View style={styles.armorySection}>
          <Text style={styles.armorySectionHeader}>MILESTONE ARMORY (COMPETENCE)</Text>
          <Text style={styles.armorySectionSub}>
            Physical milestone cosmetics bound to demonstrated real-world feats.
          </Text>

          <View style={styles.armoryList}>
            {Object.values(MILESTONE_ARMOR_CATALOG).slice(0, 4).map((armor) => {
              const isUnlocked = unlockedMilestones.includes(armor.id);

              return (
                <SystemPanel key={armor.id} style={styles.armoryItem}>
                  <View style={styles.armoryItemContent}>
                    <View
                      style={[
                        styles.armorIconBox,
                        isUnlocked && styles.armorIconBoxUnlocked,
                      ]}
                    >
                      <Ionicons
                        name={isUnlocked ? 'shield-checkmark' : 'lock-closed'}
                        size={18}
                        color={isUnlocked ? colors.systemCyan : colors.textMuted}
                      />
                    </View>

                    <View style={styles.armorTextCol}>
                      <Text
                        style={[
                          styles.armorName,
                          isUnlocked && styles.armorNameUnlocked,
                        ]}
                      >
                        {armor.name}
                      </Text>
                      <Text style={styles.armorReq}>{armor.description}</Text>
                    </View>

                    <Text
                      style={[
                        styles.armorStatus,
                        isUnlocked && styles.armorStatusUnlocked,
                      ]}
                    >
                      {isUnlocked ? 'ACQUIRED' : 'LOCKED'}
                    </Text>
                  </View>
                </SystemPanel>
              );
            })}
          </View>
        </View>

        {/* Share Button Action */}
        <Pressable
          style={({ pressed }) => [
            styles.exportButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleShareCard}
        >
          <Ionicons name="share-social-outline" size={18} color={colors.bgAbyss} />
          <Text style={styles.exportButtonText}>SHARE HUNTER RECORD</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgAbyss,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.hero,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  systemSub: {
    fontFamily: fonts.interMedium,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: 2,
    marginTop: 2,
  },
  shareIconButton: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
  },
  spNoticeBanner: {
    backgroundColor: '#002B33',
    borderWidth: 1,
    borderColor: colors.systemCyan,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  bannerPressed: {
    opacity: 0.8,
  },
  spNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  spNoticeTitle: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 12,
    letterSpacing: 1,
  },
  spNoticeSub: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  hunterCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#07101E',
    borderWidth: 2,
    borderColor: colors.systemCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityDetails: {
    flex: 1,
  },
  titleText: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1,
  },
  hunterName: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 18,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  hunterUid: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  rankBadgeContainer: {
    alignItems: 'center',
    backgroundColor: '#002B33',
    borderWidth: 1,
    borderColor: colors.systemCyan,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankBadgeText: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 16,
  },
  rankTierLabel: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyanDim,
    fontSize: 8,
    letterSpacing: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.systemCyanDim,
    opacity: 0.35,
    marginVertical: spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  levelLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1,
  },
  levelValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 28,
  },
  levelRight: {
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 9,
    letterSpacing: 1,
  },
  xpValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.success,
    fontSize: 12,
  },
  attributesHeader: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyanDim,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  attributesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attributeBox: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
  },
  attrTag: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 10,
    letterSpacing: 1,
  },
  attrNumber: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 18,
    marginVertical: 2,
  },
  attrDesc: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  resilienceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resilienceItem: {
    alignItems: 'flex-start',
  },
  resilienceLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 9,
    letterSpacing: 1,
  },
  resilienceValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  shieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  armorySection: {
    marginBottom: spacing.xl,
  },
  armorySectionHeader: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  armorySectionSub: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  armoryList: {
    gap: spacing.sm,
  },
  armoryItem: {
    padding: spacing.sm,
  },
  armoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  armorIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  armorIconBoxUnlocked: {
    borderColor: colors.systemCyan,
    backgroundColor: '#002B33',
  },
  armorTextCol: {
    flex: 1,
  },
  armorName: {
    fontFamily: fonts.orbitronBold,
    color: colors.textMuted,
    fontSize: 12,
  },
  armorNameUnlocked: {
    color: colors.textPrimary,
  },
  armorReq: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  armorStatus: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 10,
  },
  armorStatusUnlocked: {
    color: colors.systemCyan,
  },
  exportButton: {
    backgroundColor: colors.systemCyan,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  exportButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.bgAbyss,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
});
