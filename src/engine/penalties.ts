import { HunterProfile, PenaltyResult } from '../types/engine';
import { xpRequired } from './xp';

/**
 * Calculates and applies penalty for a missed, unshielded daily quest.
 * Deducts 10% of current-level XP.
 * Hard bounds: XP is clamped at 0; level is never demoted.
 */
export function calculateMissedQuestPenalty(user: HunterProfile): PenaltyResult {
  const reqXP = xpRequired(user.level);
  const penaltyXP = Math.floor(0.1 * reqXP);
  const updatedXP = Math.max(0, user.xp - penaltyXP);

  const updatedUser: HunterProfile = {
    ...user,
    xp: updatedXP,
  };

  return {
    penaltyXP,
    updatedUser,
  };
}
