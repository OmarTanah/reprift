import { HunterProfile, StatAllocationInput } from '../types/engine';

/**
 * Validates and allocates stat points (STR / VIT / AGI) from unspent SP.
 * Throws an error if allocation exceeds available SP or contains negative values.
 */
export function allocateStatPoints(
  user: HunterProfile,
  allocation: StatAllocationInput
): HunterProfile {
  const strDelta = Math.max(0, Math.floor(allocation.str ?? 0));
  const vitDelta = Math.max(0, Math.floor(allocation.vit ?? 0));
  const agiDelta = Math.max(0, Math.floor(allocation.agi ?? 0));

  // Reject negative input numbers if explicitly passed as negative
  if ((allocation.str ?? 0) < 0 || (allocation.vit ?? 0) < 0 || (allocation.agi ?? 0) < 0) {
    throw new Error('Stat allocations cannot be negative');
  }

  const totalSpent = strDelta + vitDelta + agiDelta;

  if (totalSpent === 0) {
    return user;
  }

  if (totalSpent > user.statPoints) {
    throw new Error(
      `Cannot spend ${totalSpent} stat points; only ${user.statPoints} available`
    );
  }

  return {
    ...user,
    statPoints: user.statPoints - totalSpent,
    stats: {
      str: user.stats.str + strDelta,
      vit: user.stats.vit + vitDelta,
      agi: user.stats.agi + agiDelta,
    },
  };
}
