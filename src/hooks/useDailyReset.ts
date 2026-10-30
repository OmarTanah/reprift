import { AppState, Alert } from 'react-native';
import { useEffect } from 'react';
import { evaluateDailyStreak } from '../engine/streaks';
import { calculateMissedQuestPenalty } from '../engine/penalties';
import { createDefaultDailyQuest, useQuestStore } from '../store/useQuestStore';
import { useUserStore } from '../store/useUserStore';

const GRACE_WINDOW_HOURS = 2;

function getLocalDateString(timezone: string, date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getLocalHour(timezone: string, date: Date): number {
  const hour = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).find((part) => part.type === 'hour')?.value;

  return hour ? Number(hour) : date.getHours();
}

export function useDailyReset(): void {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const dailyQuest = useQuestStore((state) => state.dailyQuest);
  const setQuest = useQuestStore((state) => state.setQuest);

  useEffect(() => {
    const processDailyReset = () => {
      const now = new Date();
      const today = getLocalDateString(user.timezone, now);

      if (dailyQuest.date === today) return;

      if (getLocalHour(user.timezone, now) < GRACE_WINDOW_HOURS) return;

      const streakResult = evaluateDailyStreak(user, {
        currentDate: today,
        questCompleted: dailyQuest.completed,
        isRestDay: false,
        now: now.getTime(),
      });

      let updatedUser = streakResult.user;
      let penaltyXP = 0;

      if (streakResult.streakBroken) {
        const penaltyResult = calculateMissedQuestPenalty(updatedUser);
        updatedUser = penaltyResult.updatedUser;
        penaltyXP = penaltyResult.penaltyXP;
      }

      setUser(updatedUser);
      setQuest(createDefaultDailyQuest(today));

      if (streakResult.shieldConsumed) {
        Alert.alert(
          '[ SHIELD CONSUMED ]',
          'One shield was expended. Your streak endures.',
          [{ text: 'UNDERSTOOD', style: 'default' }]
        );
      } else if (streakResult.streakBroken) {
        Alert.alert(
          '[ STREAK TERMINATED ]',
          `Your chain has been broken. The System awaits your return. XP penalty: -${penaltyXP}.`,
          [{ text: 'ACKNOWLEDGE', style: 'cancel' }]
        );
      }
    };

    processDailyReset();

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') processDailyReset();
    });
    const resetCheck = setInterval(processDailyReset, 60 * 1000);

    return () => {
      appStateSubscription.remove();
      clearInterval(resetCheck);
    };
  }, [dailyQuest, setQuest, setUser, user]);
}