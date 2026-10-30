/**
 * S-10 Skill Node Detail Screen
 *
 * Shows:
 *  - Exercise name + tree badge
 *  - Visual state indicator (Locked / Unlockable / Unlocked / Verified)
 *  - SP cost and stat rewards
 *  - Prerequisite info
 *  - Form cues list
 *  - Verification target
 *  - "UNLOCK NODE" button (if unlockable) → deducts SP, updates progress
 *  - "VERIFY" button (if unlocked) → records verified state + awards stat bonus
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { canUnlockNode, canVerifyNode } from '../../src/engine/skills';
import { getNodeById } from '../../src/data/skillTrees';
import { useSkillStore } from '../../src/store/useSkillStore';
import { useUserStore } from '../../src/store/useUserStore';
import { SystemPanel } from '../../src/components/SystemPanel';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { SkillTreeType } from '../../src/types/engine';

// ─── Types ───────────────────────────────────────────────────────────────────

type NodeState = 'locked' | 'unlockable' | 'unlocked' | 'verified';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TREE_LABELS: Record<SkillTreeType, string> = {
  push: 'PUSH',
  pull: 'PULL',
  core: 'CORE',
  legs: 'LEGS',
};

const TREE_COLORS: Record<SkillTreeType, string> = {
  push: colors.systemCyan,
  pull: colors.violetCore,
  core: colors.success,
  legs: colors.gold,
};

function getNodeState(
  nodeId: string,
  progress: Record<string, import('../../src/types/engine').SkillProgress>,
  availableSP: number
): NodeState {
  const node = getNodeById(nodeId);
  if (!node) return 'locked';

  const p = progress[nodeId];
  if (p?.verified) return 'verified';
  if (p?.unlocked) return 'unlocked';

  const isUnlockable = canUnlockNode(node, progress, availableSP);
  if (isUnlockable) return 'unlockable';

  return 'locked';
}

function statLabel(key: string): string {
  return key.toUpperCase();
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NodeDetailScreen() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();

  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const currentUser = useUserStore((s) => s.user);

  const skillProgress = useSkillStore((s) => s.progress);
  const unlockSkillNode = useSkillStore((s) => s.unlockNode);
  const verifySkillNode = useSkillStore((s) => s.verifySkillNode);

  const node = getNodeById(nodeId ?? '');

  if (!node) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>[ NODE NOT FOUND ]</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>GO BACK</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const nodeState = getNodeState(node.id, skillProgress, user.statPoints);
  const prereqNode = node.prerequisite ? getNodeById(node.prerequisite) : null;
  const treeColor = TREE_COLORS[node.tree];

  const statRewardEntries = Object.entries(node.statReward).filter(
    ([, val]) => val !== undefined && val > 0
  );

  // ─── Action Handlers ───────────────────────────────────────────────────────

  const handleUnlock = () => {
    const success = unlockSkillNode(node.id, user.statPoints, () => {
      setUser({
        ...currentUser,
        statPoints: currentUser.statPoints - node.spCost,
      });
    });

    if (success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert(
        '[ NODE UNLOCKED ]',
        `${node.name} is now active. Demonstrate ${node.verification.target} ${node.verification.type} to verify and claim your stat bonus.`,
        [{ text: 'UNDERSTOOD', style: 'default' }]
      );
    } else {
      Alert.alert(
        '[ SYSTEM ERROR ]',
        'Could not unlock node. Check SP and prerequisite requirements.',
        [{ text: 'OK', style: 'cancel' }]
      );
    }
  };

  const handleVerify = () => {
    const target = node.verification.target;
    const success = verifySkillNode(node.id, target);

    if (!success) {
      Alert.alert(
        '[ SYSTEM: FAILED ]',
        `Verification requires ${target} ${node.verification.type}, and must be submitted on a day after the node was unlocked.`,
        [{ text: 'OK', style: 'cancel' }]
      );
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const updatedStats = { ...currentUser.stats };
    for (const [stat, val] of Object.entries(node.statReward)) {
      if (val && stat in updatedStats) {
        updatedStats[stat as keyof typeof updatedStats] =
          (updatedStats[stat as keyof typeof updatedStats] ?? 0) + (val ?? 0);
      }
    }

    setUser({
      ...currentUser,
      stats: updatedStats,
    });

    Alert.alert(
      '[ SYSTEM: VERIFIED ]',
      `${node.name} has been verified. Stat bonus awarded: ${statRewardEntries.map(([k, v]) => `+${v} ${statLabel(k)}`).join(', ')}`,
      [{ text: 'EXCELLENT', style: 'default' }]
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Nav Header */}
      <View style={styles.navHeader}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.systemCyan} />
        </Pressable>
        <View style={[styles.treeBadge, { borderColor: treeColor }]}>
          <Text style={[styles.treeBadgeText, { color: treeColor }]}>
            {TREE_LABELS[node.tree]} TREE
          </Text>
        </View>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>TIER {node.tier}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Node Identity */}
        <View style={styles.identitySection}>
          <Text style={styles.nodeName}>{node.name.toUpperCase()}</Text>
          <NodeStateBadge state={nodeState} />
        </View>

        {/* Cost & Reward Panel */}
        <SystemPanel style={styles.costPanel}>
          <View style={styles.costRow}>
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>UNLOCK COST</Text>
              <Text style={styles.costValue}>{node.spCost} SP</Text>
            </View>
            <View style={styles.costSep} />
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>VERIFY TARGET</Text>
              <Text style={styles.costValue}>
                {node.verification.target} {node.verification.type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.costSep} />
            <View style={styles.costItem}>
              <Text style={styles.costLabel}>STAT REWARD</Text>
              <Text style={styles.costValue}>
                {statRewardEntries.length > 0
                  ? statRewardEntries.map(([k, v]) => `+${v} ${statLabel(k)}`).join(' ')
                  : '—'}
              </Text>
            </View>
          </View>
        </SystemPanel>

        {/* Prerequisite */}
        {prereqNode && (
          <SystemPanel style={styles.prereqPanel}>
            <View style={styles.prereqRow}>
              <Ionicons name="git-branch-outline" size={14} color={colors.systemCyanDim} />
              <Text style={styles.prereqLabel}>PREREQUISITE</Text>
            </View>
            <Text style={styles.prereqName}>{prereqNode.name}</Text>
            <Text style={styles.prereqNote}>
              Must be unlocked AND verified before this node can be accessed.
            </Text>
          </SystemPanel>
        )}

        {/* SP Status */}
        {(nodeState === 'locked' || nodeState === 'unlockable') && (
          <View style={styles.spStatusRow}>
            <Text style={styles.spStatusText}>
              YOUR SP: {user.statPoints} / {node.spCost} REQUIRED
            </Text>
            <Text
              style={[
                styles.spStatusSub,
                user.statPoints >= node.spCost
                  ? styles.spStatusOK
                  : styles.spStatusInsuff,
              ]}
            >
              {user.statPoints >= node.spCost ? '✓ SUFFICIENT' : '✗ INSUFFICIENT'}
            </Text>
          </View>
        )}

        {/* Form Cues */}
        {node.cues && node.cues.length > 0 && (
          <View style={styles.cuesSection}>
            <Text style={styles.cuesHeader}>
              <Ionicons name="information-circle-outline" size={12} color={colors.systemCyan} />
              {' '}FORM CUES
            </Text>
            {node.cues.map((cue, i) => (
              <View key={i} style={styles.cueRow}>
                <Text style={styles.cueBullet}>›</Text>
                <Text style={styles.cueText}>{cue}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Verification Explanation */}
        {nodeState === 'unlocked' && (
          <SystemPanel style={styles.verifyInfoPanel}>
            <Text style={styles.verifyInfoHeader}>[ VERIFICATION REQUIRED ]</Text>
            <Text style={styles.verifyInfoBody}>
              To lock in your stat bonus, demonstrate{' '}
              <Text style={styles.verifyHighlight}>
                {node.verification.target} {node.verification.type}
              </Text>{' '}
              of this exercise in a single session. Verification must be submitted on a
              day after the node was unlocked.
            </Text>
          </SystemPanel>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          {nodeState === 'unlockable' && (
            <Pressable
              style={({ pressed }) => [
                styles.primaryCta,
                pressed && styles.ctaPressed,
              ]}
              onPress={handleUnlock}
            >
              <Ionicons name="lock-open-outline" size={18} color={colors.bgAbyss} />
              <Text style={styles.primaryCtaText}>
                UNLOCK NODE (–{node.spCost} SP)
              </Text>
            </Pressable>
          )}

          {nodeState === 'unlocked' && (
            <Pressable
              style={({ pressed }) => [
                styles.verifyCta,
                pressed && styles.ctaPressed,
              ]}
              onPress={handleVerify}
            >
              <Ionicons name="star-outline" size={18} color={colors.bgAbyss} />
              <Text style={styles.verifyCtaText}>
                SUBMIT VERIFICATION
              </Text>
            </Pressable>
          )}

          {nodeState === 'verified' && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="star" size={20} color={colors.gold} />
              <Text style={styles.verifiedBadgeText}>NODE VERIFIED — STAT BONUS APPLIED</Text>
            </View>
          )}

          {nodeState === 'locked' && (
            <View style={styles.lockedNotice}>
              <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
              <Text style={styles.lockedNoticeText}>
                {node.prerequisite
                  ? 'Unlock and verify the prerequisite node first.'
                  : `You need ${node.spCost} SP to unlock this node.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── NodeStateBadge ────────────────────────────────────────────────────────────

function NodeStateBadge({ state }: { state: NodeState }) {
  const config: Record<NodeState, { label: string; color: string; bg: string }> = {
    locked: { label: 'LOCKED', color: colors.textMuted, bg: colors.bgElevated },
    unlockable: { label: 'UNLOCKABLE', color: colors.systemCyan, bg: '#00181D' },
    unlocked: { label: 'UNLOCKED', color: colors.systemCyan, bg: '#001A20' },
    verified: { label: 'VERIFIED', color: colors.gold, bg: '#1A1200' },
  };
  const c = config[state];

  return (
    <View style={[styles.stateBadge, { backgroundColor: c.bg, borderColor: c.color }]}>
      <Text style={[styles.stateBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgAbyss,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  errorText: {
    fontFamily: fonts.orbitronBold,
    color: colors.danger,
    fontSize: 16,
  },
  backButton: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 12,
    letterSpacing: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
  },
  treeBadge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  treeBadgeText: {
    fontFamily: fonts.orbitronBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  tierBadge: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 'auto',
  },
  tierText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 10,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.hero,
  },
  identitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  nodeName: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 20,
    letterSpacing: 2,
    flex: 1,
    marginRight: spacing.sm,
  },
  stateBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stateBadgeText: {
    fontFamily: fonts.orbitronBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  costPanel: {
    marginBottom: spacing.md,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  costItem: {
    alignItems: 'center',
    flex: 1,
  },
  costLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
    textAlign: 'center',
  },
  costValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
  costSep: {
    width: 1,
    height: 36,
    backgroundColor: colors.systemCyanDim,
    opacity: 0.4,
  },
  prereqPanel: {
    marginBottom: spacing.md,
  },
  prereqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  prereqLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1,
  },
  prereqName: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 2,
  },
  prereqNote: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 11,
  },
  spStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  spStatusText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 11,
  },
  spStatusSub: {
    fontFamily: fonts.orbitronBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  spStatusOK: {
    color: colors.success,
  },
  spStatusInsuff: {
    color: colors.danger,
  },
  cuesSection: {
    marginBottom: spacing.lg,
  },
  cuesHeader: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  cueRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cueBullet: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 14,
    lineHeight: 18,
    width: 12,
  },
  cueText: {
    fontFamily: fonts.interRegular,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  verifyInfoPanel: {
    marginBottom: spacing.lg,
  },
  verifyInfoHeader: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  verifyInfoBody: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  verifyHighlight: {
    color: colors.systemCyan,
    fontFamily: fonts.jetBrainsMonoBold,
  },
  ctaSection: {
    gap: spacing.md,
  },
  primaryCta: {
    backgroundColor: colors.systemCyan,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryCtaText: {
    fontFamily: fonts.orbitronBold,
    color: colors.bgAbyss,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  verifyCta: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  verifyCtaText: {
    fontFamily: fonts.orbitronBold,
    color: colors.bgAbyss,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  verifiedBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#1A1200',
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  verifiedBadgeText: {
    fontFamily: fonts.orbitronBold,
    color: colors.gold,
    fontSize: 12,
    letterSpacing: 1,
  },
  lockedNotice: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: '#1A2138',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  lockedNoticeText: {
    fontFamily: fonts.interMedium,
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
});
