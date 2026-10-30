import { AwardXPResult, HunterProfile, RankTier, StatFocus } from '../types/engine';
import { getNextRank, getRankDefinition } from './ranks';
import { xpRequired } from './xp';

/**
 * Pure function: Awards XP to a hunter, handles single or multi-level progression,
 * awards stat points (3 per level), auto-increments the chosen statFocus (+1 per level),
 * and checks for rank trial readiness.
 */
export function awardXP(
  user: HunterProfile,
  xpToAdd: number,
  statFocus: StatFocus
): AwardXPResult {
  const safeXPToAdd = Math.max(0, Math.floor(xpToAdd));
  let currentLevel = user.level;
  let currentXP = user.xp + safeXPToAdd;
  let levelsGained = 0;
  const updatedStats = { ...user.stats };

  while (currentXP >= xpRequired(currentLevel)) {
    currentXP -= xpRequired(currentLevel);
    currentLevel += 1;
    levelsGained += 1;
    updatedStats[statFocus] = (updatedStats[statFocus] ?? 0) + 1;
  }

  const statPointsGained = levelsGained * 3;
  const newStatPoints = user.statPoints + statPointsGained;

  // Evaluate rank promotion / trial readiness
  let pendingTrialUnlocked = user.pendingTrialUnlocked;
  let newRankReady = false;
  let unlockedTrialRank: RankTier | null = null;

  const nextRank = getNextRank(user.rank);
  if (nextRank) {
    const nextRankDef = getRankDefinition(nextRank);
    if (currentLevel >= nextRankDef.minLevel) {
      if (nextRankDef.trialRequired) {
        pendingTrialUnlocked = true;
        newRankReady = true;
        unlockedTrialRank = nextRank;
      }
    }
  }

  const updatedUser: HunterProfile = {
    ...user,
    level: currentLevel,
    xp: currentXP,
    statPoints: newStatPoints,
    stats: updatedStats,
    pendingTrialUnlocked,
  };

  return {
    user: updatedUser,
    levelsGained,
    newRankReady,
    unlockedTrialRank,
  };
}
