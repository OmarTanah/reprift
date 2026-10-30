import {
  canUnlockNode,
  canVerifyNode,
  unlockNode,
  verifyNode,
} from '../../src/engine/skills';
import { SkillNode, SkillProgress } from '../../src/types/engine';

describe('Gamification Engine — Skill Trees', () => {
  const rootNode: SkillNode = {
    id: 'push_standard',
    tree: 'push',
    name: 'Standard Push-up',
    tier: 1,
    spCost: 1,
    prerequisite: null,
    verification: { type: 'reps', target: 10 },
    statReward: { str: 1 },
  };

  const childNode: SkillNode = {
    id: 'push_diamond',
    tree: 'push',
    name: 'Diamond Push-up',
    tier: 2,
    spCost: 2,
    prerequisite: 'push_standard',
    verification: { type: 'reps', target: 5 },
    statReward: { str: 2 },
  };

  describe('canUnlockNode() & unlockNode()', () => {
    it('allows unlocking root node if SP is sufficient', () => {
      expect(canUnlockNode(rootNode, {}, 1)).toBe(true);
      expect(canUnlockNode(rootNode, {}, 0)).toBe(false); // Insufficient SP
    });

    it('prevents unlocking child node if prerequisite is unverified or locked', () => {
      // 1. Prerequisite not unlocked at all
      expect(canUnlockNode(childNode, {}, 5)).toBe(false);

      // 2. Prerequisite unlocked but NOT verified
      const progressUnverified: Record<string, SkillProgress> = {
        push_standard: {
          nodeId: 'push_standard',
          unlocked: true,
          verified: false,
          unlockedAt: 1000000,
          verifiedAt: null,
        },
      };
      expect(canUnlockNode(childNode, progressUnverified, 5)).toBe(false);

      // 3. Prerequisite unlocked AND verified -> allowed!
      const progressVerified: Record<string, SkillProgress> = {
        push_standard: {
          nodeId: 'push_standard',
          unlocked: true,
          verified: true,
          unlockedAt: 1000000,
          verifiedAt: 1086400000,
        },
      };
      expect(canUnlockNode(childNode, progressVerified, 2)).toBe(true);
      expect(canUnlockNode(childNode, progressVerified, 1)).toBe(false); // Not enough SP
    });

    it('unlocks node cleanly, records timestamp, and returns remaining SP', () => {
      const now = 1700000000000;
      const result = unlockNode(rootNode, {}, 3, now);

      expect(result.remainingSP).toBe(2);
      expect(result.progress.push_standard).toEqual({
        nodeId: 'push_standard',
        unlocked: true,
        verified: false,
        unlockedAt: now,
        verifiedAt: null,
      });
    });

    it('throws when attempting an illegal unlock', () => {
      expect(() => {
        unlockNode(childNode, {}, 5, 1000000);
      }).toThrow(/Cannot unlock skill node "push_diamond"/);
    });
  });

  describe('canVerifyNode() & verifyNode()', () => {
    const unlockTimestamp = Date.UTC(2026, 9, 25, 10, 0, 0); // Oct 25, 2026 10:00 UTC

    const unlockedProgress: SkillProgress = {
      nodeId: 'push_standard',
      unlocked: true,
      verified: false,
      unlockedAt: unlockTimestamp,
      verifiedAt: null,
    };

    it('rejects verification on the same calendar day as unlock (anti-cheat rule)', () => {
      const sameDayLog = Date.UTC(2026, 9, 25, 18, 0, 0); // Oct 25, 2026 18:00 UTC
      expect(canVerifyNode(rootNode, unlockedProgress, 10, sameDayLog)).toBe(false);
    });

    it('rejects verification if proof reps fall short of target', () => {
      const nextDayLog = Date.UTC(2026, 9, 26, 10, 0, 0); // Oct 26, 2026
      expect(canVerifyNode(rootNode, unlockedProgress, 9, nextDayLog)).toBe(false); // target is 10
    });

    it('approves verification on a subsequent calendar day with target met', () => {
      const nextDayLog = Date.UTC(2026, 9, 26, 10, 0, 0); // Oct 26, 2026
      expect(canVerifyNode(rootNode, unlockedProgress, 10, nextDayLog)).toBe(true);
    });

    it('verifies node and records verification timestamp', () => {
      const nextDayLog = Date.UTC(2026, 9, 26, 12, 0, 0);
      const verified = verifyNode(rootNode, unlockedProgress, 12, nextDayLog);

      expect(verified.verified).toBe(true);
      expect(verified.verifiedAt).toBe(nextDayLog);
    });

    it('throws when attempting an invalid verification', () => {
      const sameDayLog = Date.UTC(2026, 9, 25, 12, 0, 0);
      expect(() => {
        verifyNode(rootNode, unlockedProgress, 10, sameDayLog);
      }).toThrow(/Cannot verify skill node "push_standard"/);
    });
  });
});
