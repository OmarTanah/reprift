import { HunterProfile, StreakEvaluationInput, StreakEvaluationResult } from '../types/engine';
import { getMaxShieldsForRank } from './ranks';

/**
 * Checks if currentDateStr is exactly the day after prevDateStr (format: YYYY-MM-DD).
 */
export function isConsecutiveDay(prevDateStr: string, currentDateStr: string): boolean {
  const [prevYear, prevMonth, prevDay] = prevDateStr.split('-').map(Number);
  const [currYear, currMonth, currDay] = currentDateStr.split('-').map(Number);

  const prevUTC = Date.UTC(prevYear, prevMonth - 1, prevDay);
  const currUTC = Date.UTC(currYear, currMonth - 1, currDay);

  const diffMs = currUTC - prevUTC;
  return diffMs === 24 * 60 * 60 * 1000;
}

/**
 * Pure function: Evaluates daily streak progress, handles shield auto-consumption,
 * rest-day exemptions, streak milestone shield awards, and streak breaks.
 */
export function evaluateDailyStreak(
  user: HunterProfile,
  input: StreakEvaluationInput
): StreakEvaluationResult {
  const shieldCap = getMaxShieldsForRank(user.rank);

  // Case 1: Quest completed today
  if (input.questCompleted) {
    const nextStreak = user.currentStreak + 1;
    const nextLongest = Math.max(user.longestStreak, nextStreak);

    let shieldsToAward = 0;
    if (nextStreak === 7) {
      shieldsToAward = 1;
    } else if (nextStreak === 30) {
      shieldsToAward = 2;
    } else if (nextStreak === 100) {
      shieldsToAward = 3;
    }

    const nextShields = Math.min(shieldCap, user.streakShields + shieldsToAward);

    const updatedUser: HunterProfile = {
      ...user,
      currentStreak: nextStreak,
      longestStreak: nextLongest,
      streakShields: nextShields,
      lastActiveAt: input.now,
    };

    return {
      user: updatedUser,
      streakPreserved: true,
      shieldConsumed: false,
      streakBroken: false,
      shieldAwarded: shieldsToAward,
    };
  }

  // Case 2: Quest NOT completed, but user used Recovery Protocol (Rest Day)
  if (input.isRestDay) {
    return {
      user: { ...user, lastActiveAt: input.now },
      streakPreserved: true,
      shieldConsumed: false,
      streakBroken: false,
      shieldAwarded: 0,
    };
  }

  // Case 3: Quest NOT completed and NOT a rest day. Attempt shield protection.
  const wasShieldedYesterday =
    user.lastShieldUsedDate !== null &&
    isConsecutiveDay(user.lastShieldUsedDate, input.currentDate);

  const canUseShield = user.streakShields > 0 && !wasShieldedYesterday;

  if (canUseShield) {
    const updatedUser: HunterProfile = {
      ...user,
      streakShields: user.streakShields - 1,
      lastShieldUsedDate: input.currentDate,
      lastActiveAt: input.now,
    };

    return {
      user: updatedUser,
      streakPreserved: true,
      shieldConsumed: true,
      streakBroken: false,
      shieldAwarded: 0,
    };
  }

  // Case 4: No shield available or consecutive shielded day -> Streak broken
  const updatedUser: HunterProfile = {
    ...user,
    currentStreak: 0,
    lastActiveAt: input.now,
  };

  return {
    user: updatedUser,
    streakPreserved: false,
    shieldConsumed: false,
    streakBroken: true,
    shieldAwarded: 0,
  };
}
