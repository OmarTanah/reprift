import { TrialDefinition, TrialSessionData, TrialValidationResult } from '../types/engine';

export const TRIAL_RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks whether a hunter is eligible to attempt a trial based on 24h cooldown.
 */
export function canAttemptTrial(
  lastAttemptAt: number | null,
  now: number
): { allowed: boolean; remainingCooldownMs: number } {
  if (lastAttemptAt === null) {
    return { allowed: true, remainingCooldownMs: 0 };
  }

  const elapsed = now - lastAttemptAt;
  if (elapsed >= TRIAL_RETRY_COOLDOWN_MS) {
    return { allowed: true, remainingCooldownMs: 0 };
  }

  return {
    allowed: false,
    remainingCooldownMs: TRIAL_RETRY_COOLDOWN_MS - elapsed,
  };
}

/**
 * Validates a trial attempt against the trial definition.
 * All objectives are AND-ed and must be completed within the time limit.
 */
export function validateTrialAttempt(
  trialDef: TrialDefinition,
  attempt: TrialSessionData,
  now: number
): TrialValidationResult {
  const elapsedSec = Math.max(0, Math.floor((attempt.completedAt - attempt.startedAt) / 1000));
  const objectiveResults: Record<string, boolean> = {};

  let allObjectivesPassed = true;

  for (const objective of trialDef.objectives) {
    const achieved = attempt.objectives[objective.exerciseId] ?? 0;
    const passed = achieved >= objective.target;
    objectiveResults[objective.exerciseId] = passed;
    if (!passed) {
      allObjectivesPassed = false;
    }
  }

  const withinTimeLimit = elapsedSec <= trialDef.timeLimitSec;

  if (!withinTimeLimit) {
    return {
      passed: false,
      reason: 'Time limit exceeded',
      elapsedSec,
      objectiveResults,
    };
  }

  if (!allObjectivesPassed) {
    return {
      passed: false,
      reason: 'Objectives unmet',
      elapsedSec,
      objectiveResults,
    };
  }

  return {
    passed: true,
    elapsedSec,
    objectiveResults,
  };
}
