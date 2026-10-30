import { SkillNode, SkillProgress } from '../types/engine';

/**
 * Returns UTC midnight timestamp for a given millisecond timestamp.
 */
function getUtcDayStart(timestamp: number): number {
  const d = new Date(timestamp);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Evaluates whether a skill node can be unlocked.
 * Prerequisite (if any) must be unlocked and verified.
 * User must possess sufficient unspent SP.
 */
export function canUnlockNode(
  node: SkillNode,
  progress: Record<string, SkillProgress>,
  availableSP: number
): boolean {
  // If already unlocked, cannot unlock again
  if (progress[node.id]?.unlocked) {
    return false;
  }

  // Check SP cost
  if (availableSP < node.spCost) {
    return false;
  }

  // If node has prerequisite, check that it's unlocked AND verified
  if (node.prerequisite) {
    const prereqProgress = progress[node.prerequisite];
    if (!prereqProgress || !prereqProgress.unlocked || !prereqProgress.verified) {
      return false;
    }
  }

  return true;
}

/**
 * Unlocks a skill node, deducting spCost from available SP.
 */
export function unlockNode(
  node: SkillNode,
  progress: Record<string, SkillProgress>,
  availableSP: number,
  now: number
): { progress: Record<string, SkillProgress>; remainingSP: number } {
  if (!canUnlockNode(node, progress, availableSP)) {
    throw new Error(`Cannot unlock skill node "${node.id}"`);
  }

  const updatedProgress: Record<string, SkillProgress> = {
    ...progress,
    [node.id]: {
      nodeId: node.id,
      unlocked: true,
      verified: false,
      unlockedAt: now,
      verifiedAt: null,
    },
  };

  return {
    progress: updatedProgress,
    remainingSP: availableSP - node.spCost,
  };
}

/**
 * Checks whether a node can be verified.
 * Requires:
 * 1. Node is unlocked.
 * 2. Node is not already verified.
 * 3. Logged performance satisfies verification target.
 * 4. Verification must occur on a day AFTER the unlock day.
 */
export function canVerifyNode(
  node: SkillNode,
  nodeProgress: SkillProgress | undefined,
  achievedCount: number,
  logTimestamp: number
): boolean {
  if (!nodeProgress || !nodeProgress.unlocked || nodeProgress.verified) {
    return false;
  }

  if (achievedCount < node.verification.target) {
    return false;
  }

  if (nodeProgress.unlockedAt === null) {
    return false;
  }

  // Must be on a calendar day strictly after the unlock day
  const unlockDay = getUtcDayStart(nodeProgress.unlockedAt);
  const logDay = getUtcDayStart(logTimestamp);

  return logDay > unlockDay;
}

/**
 * Verifies a skill node.
 */
export function verifyNode(
  node: SkillNode,
  nodeProgress: SkillProgress,
  achievedCount: number,
  logTimestamp: number
): SkillProgress {
  if (!canVerifyNode(node, nodeProgress, achievedCount, logTimestamp)) {
    throw new Error(`Cannot verify skill node "${node.id}"`);
  }

  return {
    ...nodeProgress,
    verified: true,
    verifiedAt: logTimestamp,
  };
}
