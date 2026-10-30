import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemPanel } from '../../src/components/SystemPanel';
import { xpRequired } from '../../src/engine/xp';
import { useQuestStore } from '../../src/store/useQuestStore';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { StatFocus, WorkoutLog } from '../../src/types/engine';

export default function HomeScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const addXP = useUserStore((state) => state.addXP);
  const dailyQuest = useQuestStore((state) => state.dailyQuest);
  const logExercise = useQuestStore((state) => state.logExercise);

  // Live countdown to local midnight
  const [timeLeft, setTimeLeft] = useState<{ formatted: string; isDanger: boolean }>({
    formatted: '00:00:00',
    isDanger: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diffMs = midnight.getTime() - now.getTime();
      const diffSec = Math.max(0, Math.floor(diffMs / 1000));

      const hours = Math.floor(diffSec / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
        2,
        '0'
      )}:${String(seconds).padStart(2, '0')}`;

      setTimeLeft({
        formatted,
        isDanger: hours < 2,
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickLog = (
    exerciseId: string,
    repsOrMeters: number,
    statFocus: StatFocus,
    xpAward: number
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback on web or simulators
    }

    const log: WorkoutLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      exerciseId,
      reps: repsOrMeters,
      statFocus,
      xpAwarded: xpAward,
      source: 'manual',
      loggedAt: Date.now(),
    };

    logExercise(log);
    const result = addXP(xpAward, statFocus);

    if (result.levelsGained > 0) {
      router.push({
        pathname: '/(ceremony)/level-up',
        params: {
          levelsGained: result.levelsGained.toString(),
          newLevel: result.user.level.toString(),
        },
      });
    }
  };

  const reqXP = xpRequired(user.level);
  const xpPercent = Math.min(100, Math.floor((user.xp / reqXP) * 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Rank & Hunter Info */}
        <View style={styles.header}>
          <View>
            <Text style={styles.systemSubheader}>HUNTER IDENTIFIED</Text>
            <Text style={styles.hunterTitle}>◈ {user.displayName.toUpperCase()}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.levelRankBadge}>
              <Text style={styles.levelText}>LV {user.level}</Text>
              <View style={styles.rankPill}>
                <Text style={styles.rankText}>[ {user.rank} ]</Text>
              </View>
            </View>
            <Pressable style={styles.settingsButton}>
              <Ionicons name="settings-sharp" size={20} color={colors.systemCyan} />
            </Pressable>
          </View>
        </View>

        {/* Hero Daily Quest Panel */}
        <SystemPanel style={styles.questPanel}>
          <View style={styles.questHeader}>
            <View style={styles.questHeaderLeft}>
              <Text style={styles.questBadge}>[ DAILY QUEST ]</Text>
              {dailyQuest.completed && (
                <Text style={styles.clearedBadge}>✓ CLEARED</Text>
              )}
            </View>
            <Text
              style={[
                styles.countdownText,
                timeLeft.isDanger && styles.countdownDanger,
              ]}
            >
              {timeLeft.formatted}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Exercise Slots */}
          <ExerciseRow
            name="PUSH-UPS"
            current={dailyQuest.exercises.pushups.current}
            target={dailyQuest.exercises.pushups.target}
            unit="reps"
          />
          <ExerciseRow
            name="SIT-UPS"
            current={dailyQuest.exercises.situps.current}
            target={dailyQuest.exercises.situps.target}
            unit="reps"
          />
          <ExerciseRow
            name="SQUATS"
            current={dailyQuest.exercises.squats.current}
            target={dailyQuest.exercises.squats.target}
            unit="reps"
          />
          <ExerciseRow
            name="RUN"
            current={dailyQuest.exercises.run.current / 1000}
            target={dailyQuest.exercises.run.target / 1000}
            unit="km"
            isDecimal
          />
        </SystemPanel>

        {/* XP & Stats Progress Panel */}
        <SystemPanel style={styles.statsPanel}>
          <View style={styles.xpHeaderRow}>
            <Text style={styles.xpLabel}>SYSTEM XP</Text>
            <Text style={styles.xpFraction}>
              {user.xp.toLocaleString()} / {reqXP.toLocaleString()} ({xpPercent}%)
            </Text>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${xpPercent}%` },
              ]}
            />
          </View>

          <View style={styles.statBreakdownRow}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>STR</Text>
              <Text style={styles.statItemValue}>{user.stats.str}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>VIT</Text>
              <Text style={styles.statItemValue}>{user.stats.vit}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>AGI</Text>
              <Text style={styles.statItemValue}>{user.stats.agi}</Text>
            </View>
            {user.statPoints > 0 && (
              <Pressable
                style={[styles.statItem, styles.statItemHighlight]}
                onPress={() => router.push('/(modals)/stat-allocation')}
              >
                <Text style={styles.statItemLabel}>SP</Text>
                <Text style={styles.spValue}>+{user.statPoints}</Text>
              </Pressable>
            )}
          </View>
        </SystemPanel>

        {/* Quick Log Action Buttons */}
        <Text style={styles.quickLogHeader}>QUICK LOG WORKOUT</Text>

        <View style={styles.buttonGrid}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleQuickLog('pushup_standard', 1, 'str', 1)}
          >
            <Text style={styles.actionButtonText}>+1 PUSH-UP</Text>
            <Text style={styles.actionButtonSub}>+1 XP · STR</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleQuickLog('pushup_standard', 5, 'str', 5)}
          >
            <Text style={styles.actionButtonText}>+5 PUSH-UPS</Text>
            <Text style={styles.actionButtonSub}>+5 XP · STR</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleQuickLog('situp_standard', 1, 'vit', 1)}
          >
            <Text style={styles.actionButtonText}>+1 SIT-UP</Text>
            <Text style={styles.actionButtonSub}>+1 XP · VIT</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleQuickLog('situp_standard', 5, 'vit', 5)}
          >
            <Text style={styles.actionButtonText}>+5 SIT-UPS</Text>
            <Text style={styles.actionButtonSub}>+5 XP · VIT</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleQuickLog('squat_standard', 5, 'str', 5)}
          >
            <Text style={styles.actionButtonText}>+5 SQUATS</Text>
            <Text style={styles.actionButtonSub}>+5 XP · STR</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleQuickLog('run_outdoor', 500, 'agi', 50)}
          >
            <Text style={styles.actionButtonText}>+500M RUN</Text>
            <Text style={styles.actionButtonSub}>+50 XP · AGI</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ExerciseRowProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  isDecimal?: boolean;
}

function ExerciseRow({ name, current, target, unit, isDecimal = false }: ExerciseRowProps) {
  const percent = Math.min(100, Math.floor((current / target) * 100));
  const isComplete = current >= target;

  const currentFormatted = isDecimal ? current.toFixed(1) : Math.floor(current).toString();
  const targetFormatted = isDecimal ? target.toFixed(1) : target.toString();

  return (
    <View style={styles.exerciseRowContainer}>
      <View style={styles.exerciseInfoRow}>
        <Text style={[styles.exerciseName, isComplete && styles.exerciseComplete]}>
          {name}
        </Text>
        <Text style={styles.exerciseCount}>
          {currentFormatted} / {targetFormatted} {unit}
        </Text>
      </View>
      <View style={styles.slotProgressTrack}>
        <View
          style={[
            styles.slotProgressFill,
            { width: `${percent}%` },
            isComplete && styles.slotProgressFillComplete,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgAbyss,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  systemSubheader: {
    fontFamily: fonts.interMedium,
    color: colors.systemCyanDim,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  hunterTitle: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 18,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  levelText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 13,
  },
  rankPill: {
    backgroundColor: '#002B33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  rankText: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 12,
  },
  settingsButton: {
    padding: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    backgroundColor: colors.bgPanel,
  },
  questPanel: {
    marginBottom: spacing.lg,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questBadge: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  clearedBadge: {
    fontFamily: fonts.orbitronBold,
    color: colors.success,
    fontSize: 11,
    letterSpacing: 1,
  },
  countdownText: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  countdownDanger: {
    color: colors.danger,
  },
  divider: {
    height: 1,
    backgroundColor: colors.systemCyanDim,
    opacity: 0.4,
    marginVertical: spacing.md,
  },
  exerciseRowContainer: {
    marginBottom: spacing.md,
  },
  exerciseInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exerciseName: {
    fontFamily: fonts.orbitronBold,
    color: colors.textPrimary,
    fontSize: 12,
    letterSpacing: 1,
  },
  exerciseComplete: {
    color: colors.success,
  },
  exerciseCount: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 12,
  },
  slotProgressTrack: {
    height: 6,
    backgroundColor: '#111427',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  slotProgressFill: {
    height: '100%',
    backgroundColor: colors.systemCyan,
  },
  slotProgressFillComplete: {
    backgroundColor: colors.success,
  },
  statsPanel: {
    marginBottom: spacing.lg,
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpLabel: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 12,
    letterSpacing: 1,
  },
  xpFraction: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 12,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#111427',
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.violetCore,
  },
  statBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
  },
  statItem: {
    alignItems: 'center',
  },
  statItemHighlight: {
    backgroundColor: '#002B33',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statItemLabel: {
    fontFamily: fonts.orbitronSemiBold,
    color: colors.systemCyanDim,
    fontSize: 11,
    letterSpacing: 1,
  },
  statItemValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textPrimary,
    fontSize: 18,
    marginTop: 2,
  },
  spValue: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.systemCyan,
    fontSize: 18,
    marginTop: 2,
  },
  quickLogHeader: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyanDim,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.systemCyanDim,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    borderColor: colors.systemCyan,
    backgroundColor: '#0D142E',
    transform: [{ scale: 0.97 }],
  },
  actionButtonText: {
    fontFamily: fonts.orbitronBold,
    color: colors.systemCyan,
    fontSize: 13,
    letterSpacing: 1,
  },
  actionButtonSub: {
    fontFamily: fonts.jetBrainsMonoBold,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
});
