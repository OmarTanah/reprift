import { ExerciseDifficulty, StatFocus } from '../types/engine';

export const DAILY_QUEST_BONUS_XP = 50;
export const PERFECT_WEEK_BONUS_XP = 200;

export const DIFFICULTY_MULTIPLIERS: Record<ExerciseDifficulty, number> = {
  beginner: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
  elite: 3.0,
};

/**
 * Calculates XP required to advance from the given level to the next level.
 * Formula: floor(100 * level^1.5)
 */
export function xpRequired(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(100 * Math.pow(safeLevel, 1.5));
}

export interface ExerciseXPRule {
  baseXP: number;
  statFocus: StatFocus;
  unit: 'rep' | 'seconds' | 'meters';
  unitValue: number; // e.g. 5 for 5 seconds, 10 for 10 meters, 1 for 1 rep
}

export const BASE_EXERCISE_RULES: Record<string, ExerciseXPRule> = {
  pushup: { baseXP: 1, statFocus: 'str', unit: 'rep', unitValue: 1 },
  pullup: { baseXP: 3, statFocus: 'str', unit: 'rep', unitValue: 1 },
  situp: { baseXP: 1, statFocus: 'vit', unit: 'rep', unitValue: 1 },
  squat: { baseXP: 1, statFocus: 'str', unit: 'rep', unitValue: 1 },
  plank: { baseXP: 1, statFocus: 'vit', unit: 'seconds', unitValue: 5 },
  run: { baseXP: 1, statFocus: 'agi', unit: 'meters', unitValue: 10 },
};

/**
 * Calculates XP awarded for an exercise action.
 */
export function calculateExerciseXP(
  exerciseKey: string,
  amount: number,
  difficulty: ExerciseDifficulty = 'beginner',
  isVerifiedRun = false
): { xp: number; statFocus: StatFocus } {
  if (amount <= 0) {
    return { xp: 0, statFocus: 'str' };
  }

  // Find matching rule by key prefix or exact match
  const ruleKey = Object.keys(BASE_EXERCISE_RULES).find((key) =>
    exerciseKey.toLowerCase().includes(key)
  ) ?? 'pushup';

  const rule = BASE_EXERCISE_RULES[ruleKey];
  const units = Math.floor(amount / rule.unitValue);
  const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
  let rawXP = units * rule.baseXP * diffMultiplier;

  if (ruleKey === 'run' && isVerifiedRun) {
    rawXP *= 1.1; // +10% bonus for verified runs
  }

  return {
    xp: Math.floor(rawXP),
    statFocus: rule.statFocus,
  };
}
