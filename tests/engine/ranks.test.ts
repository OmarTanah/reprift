import {
  getMaxShieldsForRank,
  getNextRank,
  getRankDefinition,
  isTrialEligible,
  promoteRank,
  RANK_ORDER,
} from '../../src/engine/ranks';
import { createMockHunter } from './leveling.test';

describe('Gamification Engine — Ranks & Tiers', () => {
  it('defines all 8 tiers in strict canonical order', () => {
    expect(RANK_ORDER).toEqual(['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']);
  });

  it('validates minimum levels for each tier according to specification', () => {
    expect(getRankDefinition('E').minLevel).toBe(1);
    expect(getRankDefinition('D').minLevel).toBe(10);
    expect(getRankDefinition('C').minLevel).toBe(20);
    expect(getRankDefinition('B').minLevel).toBe(35);
    expect(getRankDefinition('A').minLevel).toBe(50);
    expect(getRankDefinition('S').minLevel).toBe(75);
    expect(getRankDefinition('SS').minLevel).toBe(100);
    expect(getRankDefinition('SSS').minLevel).toBe(150);
  });

  it('correctly maps sequential rank progression with getNextRank', () => {
    expect(getNextRank('E')).toBe('D');
    expect(getNextRank('D')).toBe('C');
    expect(getNextRank('C')).toBe('B');
    expect(getNextRank('B')).toBe('A');
    expect(getNextRank('A')).toBe('S');
    expect(getNextRank('S')).toBe('SS');
    expect(getNextRank('SS')).toBe('SSS');
    expect(getNextRank('SSS')).toBeNull();
  });

  it('enforces shield capacity scaling by rank (3 for E-C, 5 for B-SSS)', () => {
    expect(getMaxShieldsForRank('E')).toBe(3);
    expect(getMaxShieldsForRank('D')).toBe(3);
    expect(getMaxShieldsForRank('C')).toBe(3);
    expect(getMaxShieldsForRank('B')).toBe(5);
    expect(getMaxShieldsForRank('A')).toBe(5);
    expect(getMaxShieldsForRank('S')).toBe(5);
    expect(getMaxShieldsForRank('SS')).toBe(5);
    expect(getMaxShieldsForRank('SSS')).toBe(5);
  });

  describe('isTrialEligible()', () => {
    it('returns false when hunter level is below next rank minLevel', () => {
      const hunter = createMockHunter({ rank: 'E', level: 9 });
      expect(isTrialEligible(hunter)).toBe(false);
    });

    it('returns true when hunter level meets or exceeds next rank minLevel', () => {
      const hunter = createMockHunter({ rank: 'E', level: 10 });
      expect(isTrialEligible(hunter)).toBe(true);

      const hunterOver = createMockHunter({ rank: 'E', level: 15 });
      expect(isTrialEligible(hunterOver)).toBe(true);
    });

    it('returns false for SSS hunters since no higher rank exists', () => {
      const hunter = createMockHunter({ rank: 'SSS', level: 160 });
      expect(isTrialEligible(hunter)).toBe(false);
    });
  });

  describe('promoteRank()', () => {
    it('promotes hunter rank and clears pending trial status', () => {
      const hunter = createMockHunter({
        rank: 'E',
        level: 10,
        pendingTrialUnlocked: true,
      });

      const promoted = promoteRank(hunter, 'D');

      expect(promoted.rank).toBe('D');
      expect(promoted.pendingTrialUnlocked).toBe(false);
      expect(promoted.level).toBe(10);
      expect(promoted.stats).toEqual(hunter.stats);
    });
  });
});
