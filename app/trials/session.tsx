import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNextRank, getRankDefinition } from '../../src/engine/ranks';
import { validateTrialAttempt } from '../../src/engine/trials';
import { useTrialStore } from '../../src/store/useTrialStore';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, fonts, radius, spacing } from '../../src/theme/tokens';
import { TrialDefinition } from '../../src/types/engine';

type SessionStatus = 'active' | 'failed';

export default function TrialSessionScreen() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const recordAttempt = useTrialStore((state) => state.recordAttempt);
  const nextRank = getNextRank(user.rank);
  const trial = nextRank ? getRankDefinition(nextRank).trial : undefined;
  const [startedAt] = useState(() => Date.now());
  const [remainingSec, setRemainingSec] = useState(trial?.timeLimitSec ?? 0);
  const [objectives, setObjectives] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<SessionStatus>('active');
  const [failureReason, setFailureReason] = useState('');
  const [customObjectiveId, setCustomObjectiveId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!trial || status !== 'active') return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setRemainingSec(Math.max(0, trial.timeLimitSec - elapsed));
      if (elapsed >= trial.timeLimitSec) {
        submitTrial(Date.now(), trial);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [objectives, startedAt, status, trial]);

  useEffect(() => {
    if (status !== 'failed') return;
    const timeout = setTimeout(() => router.replace('/(tabs)/trials'), 1600);
    return () => clearTimeout(timeout);
  }, [router, status]);

  if (!trial || !nextRank) {
    return null;
  }

  const addObjective = (exerciseId: string, amount: number) => {
    if (status !== 'active') return;
    setObjectives((current) => ({
      ...current,
      [exerciseId]: (current[exerciseId] ?? 0) + amount,
    }));
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const submitCustomAmount = () => {
    if (!customObjectiveId) return;
    const amount = Number.parseInt(customAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) return;

    addObjective(customObjectiveId, amount);
    setCustomAmount('');
    setCustomObjectiveId(null);
  };

  function submitTrial(completedAt: number, trialDefinition: TrialDefinition) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    recordAttempt(completedAt);

    const result = validateTrialAttempt(
      trialDefinition,
      {
        trialId: trialDefinition.id,
        rank: trialDefinition.rank,
        startedAt,
        completedAt,
        objectives,
      },
      completedAt
    );

    if (!result.passed) {
      setFailureReason(result.reason ?? 'Objectives unmet');
      setStatus('failed');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    router.replace({
      pathname: '/(ceremony)/arise',
      params: { toRank: nextRank },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {status === 'failed' ? (
        <View style={styles.failureView}>
          <Ionicons name="close-circle-outline" size={72} color={colors.danger} />
          <Text style={styles.failureTitle}>GATE CLOSED</Text>
          <Text style={styles.failureReason}>{failureReason.toUpperCase()}</Text>
          <Text style={styles.failureCopy}>The System will permit another attempt in 24 hours.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.systemLabel}>LIVE TRIAL // {nextRank}-RANK</Text>
              <Text style={styles.title}>THE GATE IS OPEN</Text>
            </View>
            <Text style={[styles.timer, remainingSec <= 60 && styles.timerDanger]}>
              {formatTimer(remainingSec)}
            </Text>
          </View>

          <Text style={styles.instruction}>Complete every objective before the countdown expires.</Text>

          <View style={styles.objectivesList}>
            {trial.objectives.map((objective) => {
              const achieved = objectives[objective.exerciseId] ?? 0;
              const complete = achieved >= objective.target;
              const isDistance = isDistanceObjective(objective.exerciseId, objective.metric);
              return (
                <View key={objective.exerciseId} style={[styles.objectiveRow, complete && styles.objectiveComplete]}>
                  <View style={styles.objectiveCopy}>
                    <Text style={styles.objectiveName}>{formatExercise(objective.exerciseId)}</Text>
                    <Text style={styles.objectiveCount}>
                      {achieved.toLocaleString()} / {objective.target.toLocaleString()} {objective.metric.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.controls}>
                    <View style={styles.quickButtonRow}>
                      {(isDistance ? [100, 500] : [1, 5, 10]).map((amount) => (
                        <Pressable
                          key={amount}
                          style={({ pressed }) => [styles.plusButton, pressed && styles.buttonPressed]}
                          onPress={() => addObjective(objective.exerciseId, amount)}
                        >
                          <Text style={styles.plusText}>+{amount}{isDistance ? 'm' : ''}</Text>
                        </Pressable>
                      ))}
                      {isDistance && (
                        <Pressable
                          style={({ pressed }) => [styles.plusButton, pressed && styles.buttonPressed]}
                          onPress={() => setCustomObjectiveId(objective.exerciseId)}
                        >
                          <Text style={styles.customText}>CUSTOM</Text>
                        </Pressable>
                      )}
                    </View>
                    {customObjectiveId === objective.exerciseId && (
                      <View style={styles.customInputRow}>
                        <TextInput
                          autoFocus
                          value={customAmount}
                          onChangeText={setCustomAmount}
                          keyboardType="number-pad"
                          placeholder="METERS"
                          placeholderTextColor={colors.textMuted}
                          style={styles.customInput}
                          returnKeyType="done"
                          onSubmitEditing={submitCustomAmount}
                        />
                        <Pressable
                          style={({ pressed }) => [styles.applyButton, pressed && styles.buttonPressed]}
                          onPress={submitCustomAmount}
                        >
                          <Text style={styles.applyText}>ADD</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.buttonPressed]}
            onPress={() => submitTrial(Date.now(), trial)}
          >
            <Text style={styles.submitButtonText}>SUBMIT TRIAL</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.bgAbyss} />
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatExercise(exerciseId: string): string {
  const labels: Record<string, string> = { pushup: 'PUSH-UPS', pullup: 'PULL-UPS', squat: 'SQUATS', run: 'RUN', plank: 'PLANK' };
  return labels[exerciseId] ?? exerciseId.toUpperCase();
}

function isDistanceObjective(exerciseId: string, metric: string): boolean {
  return metric.toLowerCase().includes('meter') || exerciseId.toLowerCase().includes('run');
}

function formatTimer(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bgAbyss },
  container: { padding: spacing.lg, paddingBottom: spacing.hero },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  systemLabel: { fontFamily: fonts.jetBrainsMonoBold, color: colors.systemCyanDim, fontSize: 10, letterSpacing: 1.2 },
  title: { fontFamily: fonts.orbitronBold, color: colors.systemCyan, fontSize: 20, letterSpacing: 1.5, marginTop: spacing.xs },
  timer: { fontFamily: fonts.jetBrainsMonoBold, color: colors.gold, fontSize: 20 },
  timerDanger: { color: colors.danger },
  instruction: { fontFamily: fonts.interRegular, color: colors.textMuted, fontSize: 13, marginBottom: spacing.xl },
  objectivesList: { gap: spacing.md },
  objectiveRow: { minHeight: 86, padding: spacing.lg, backgroundColor: colors.bgPanel, borderWidth: 1, borderColor: colors.systemCyanDim, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center' },
  objectiveComplete: { borderColor: colors.success },
  objectiveCopy: { flex: 1 },
  objectiveName: { fontFamily: fonts.orbitronSemiBold, color: colors.textPrimary, fontSize: 15, letterSpacing: 1 },
  objectiveCount: { fontFamily: fonts.jetBrainsMonoBold, color: colors.systemCyan, fontSize: 13, marginTop: spacing.sm },
  controls: { alignItems: 'flex-end', marginLeft: spacing.sm, maxWidth: '58%' },
  quickButtonRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.xs },
  plusButton: { minWidth: 45, height: 38, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.systemCyan, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  plusText: { fontFamily: fonts.jetBrainsMonoBold, color: colors.systemCyan, fontSize: 13 },
  customText: { fontFamily: fonts.orbitronSemiBold, color: colors.systemCyan, fontSize: 9, letterSpacing: 0.5 },
  customInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  customInput: { width: 92, height: 36, borderWidth: 1, borderColor: colors.gold, borderRadius: radius.sm, paddingHorizontal: spacing.sm, color: colors.textPrimary, fontFamily: fonts.jetBrainsMonoBold, fontSize: 12, textAlign: 'right' },
  applyButton: { height: 36, paddingHorizontal: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.gold, justifyContent: 'center', alignItems: 'center' },
  applyText: { fontFamily: fonts.orbitronBold, color: colors.bgAbyss, fontSize: 10 },
  submitButton: { minHeight: 58, backgroundColor: colors.gold, borderRadius: radius.md, marginTop: spacing.hero, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  submitButtonText: { fontFamily: fonts.orbitronBold, color: colors.bgAbyss, fontSize: 14, letterSpacing: 1.5 },
  buttonPressed: { opacity: 0.75 },
  failureView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  failureTitle: { fontFamily: fonts.orbitronBold, color: colors.danger, fontSize: 28, letterSpacing: 2, marginTop: spacing.lg },
  failureReason: { fontFamily: fonts.jetBrainsMonoBold, color: colors.textPrimary, fontSize: 12, marginTop: spacing.md, textAlign: 'center' },
  failureCopy: { fontFamily: fonts.interRegular, color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
});