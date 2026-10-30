import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNextRank, getRankDefinition, isTrialEligible } from '../../src/engine/ranks';
import { canAttemptTrial } from '../../src/engine/trials';
import { useTrialStore } from '../../src/store/useTrialStore';
import { useUserStore } from '../../src/store/useUserStore';
import { SystemPanel } from '../../src/components/SystemPanel';
import { colors, fonts } from '../../src/theme/tokens';
import { radius, spacing } from '../../src/theme/tokens';

export default function TrialsScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const lastAttemptAt = useTrialStore((state) => state.lastAttemptAt);
  const nextRank = getNextRank(user.rank);
  const nextDefinition = nextRank ? getRankDefinition(nextRank) : null;
  const trial = nextDefinition?.trial;
  const eligible = isTrialEligible(user) && Boolean(trial);
  const cooldown = canAttemptTrial(lastAttemptAt, Date.now());
  const canEnter = eligible && cooldown.allowed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.systemLabel}>RANK-UP PROTOCOL</Text>
            <Text style={styles.title}>GATE OF TRIALS</Text>
          </View>
          <Ionicons name="shield-half-outline" size={32} color={colors.systemCyan} />
        </View>

        <SystemPanel style={styles.rankPanel}>
          <Text style={styles.panelLabel}>CURRENT RANK</Text>
          <View style={styles.rankRow}>
            <Text style={styles.currentRank}>[ {user.rank} ]</Text>
            <Ionicons name="arrow-forward" size={22} color={colors.systemCyanDim} />
            <Text style={styles.nextRank}>{nextRank ? `[ ${nextRank} ]` : 'MAX'}</Text>
          </View>
          <Text style={styles.rankDescription}>
            {nextDefinition
              ? `${nextDefinition.displayName.toUpperCase()} requires level ${nextDefinition.minLevel}.`
              : 'The highest rank has been attained.'}
          </Text>
        </SystemPanel>

        {trial ? (
          <SystemPanel style={styles.trialPanel}>
            <View style={styles.trialHeader}>
              <View>
                <Text style={styles.panelLabel}>NEXT GATE</Text>
                <Text style={styles.trialName}>{trial.name.toUpperCase()}</Text>
              </View>
              <Text style={styles.timeLimit}>{formatDuration(trial.timeLimitSec)}</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.objectivesLabel}>TRIAL REQUIREMENTS</Text>
            {trial.objectives.map((objective) => (
              <View key={objective.exerciseId} style={styles.objectiveRow}>
                <Ionicons name="radio-button-off" size={15} color={colors.systemCyanDim} />
                <Text style={styles.objectiveName}>{formatExercise(objective.exerciseId)}</Text>
                <Text style={styles.objectiveTarget}>
                  {objective.target.toLocaleString()} {objective.metric.toUpperCase()}
                </Text>
              </View>
            ))}

            {!eligible && (
              <Text style={styles.lockedMessage}>
                REQUIRES LEVEL {nextDefinition?.minLevel ?? '—'} TO ENTER
              </Text>
            )}
            {!cooldown.allowed && (
              <Text style={styles.cooldownMessage}>
                GATE RECHARGING · {formatCooldown(cooldown.remainingCooldownMs)}
              </Text>
            )}

            <Pressable
              disabled={!canEnter}
              style={({ pressed }) => [
                styles.enterButton,
                !canEnter && styles.enterButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push('/trials/session')}
            >
              <Ionicons name="enter-outline" size={22} color={canEnter ? colors.bgAbyss : colors.textMuted} />
              <Text style={[styles.enterButtonText, !canEnter && styles.disabledText]}>ENTER GATE</Text>
            </Pressable>
          </SystemPanel>
        ) : (
          <SystemPanel style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>NO FURTHER GATES</Text>
            <Text style={styles.emptyText}>The System has no higher rank to reveal.</Text>
          </SystemPanel>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatExercise(exerciseId: string): string {
  return exerciseId === 'pushup' ? 'PUSH-UPS' : exerciseId.toUpperCase() + (exerciseId === 'pullup' ? 'S' : '');
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}H ${String(minutes).padStart(2, '0')}M` : `${minutes} MIN`;
}

function formatCooldown(milliseconds: number): string {
  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}H ${String(minutes).padStart(2, '0')}M`;
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
    marginBottom: spacing.xl,
  },
  systemLabel: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyanDim,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 22,
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
  rankPanel: {
    marginBottom: spacing.lg,
  },
  panelLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  currentRank: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 32,
  },
  nextRank: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.gold,
    fontSize: 32,
  },
  rankDescription: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 13,
  },
  trialPanel: {
    marginBottom: spacing.lg,
  },
  trialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trialName: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 15,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  timeLimit: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.gold,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: colors.systemCyanDim,
    opacity: 0.5,
    marginVertical: spacing.lg,
  },
  objectivesLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgElevated,
  },
  objectiveName: {
    flex: 1,
    fontFamily: fonts.interMedium,
    color: colors.textPrimary,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  objectiveTarget: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 12,
  },
  lockedMessage: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  cooldownMessage: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.danger,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  enterButton: {
    minHeight: 58,
    marginTop: spacing.xl,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  enterButtonDisabled: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
  },
  enterButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.bgAbyss,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  emptyPanel: {
    alignItems: 'center',
    paddingVertical: spacing.hero,
  },
  emptyTitle: {
    fontFamily: fonts.orbitronBold,
    color: colors.gold,
    fontSize: 16,
    letterSpacing: 1.5,
  },
  emptyText: {
    fontFamily: fonts.interRegular,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
