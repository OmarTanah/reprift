import { awardXP } from '../../src/engine/leveling';
import { xpRequired } from '../../src/engine/xp';
import { HunterProfile } from '../../src/types/engine';

export function createMockHunter(overrides?: Partial<HunterProfile>): HunterProfile {
  return {
    uid: 'hunter_1',
    displayName: 'Sung',
    avatarId: 'avatar_01',
    timezone: 'UTC',
    level: 1,
    xp: 0,
    rank: 'E',
    statPoints: 0,
    stats: { str: 5, vit: 5, agi: 5 },
    currentStreak: 0,
    longestStreak: 0,
    streakShields: 0,
    lastShieldUsedDate: null,
    equippedTitle: null,
    pendingTrialUnlocked: false,
    createdAt: 1700000000000,
    lastActiveAt: 1700000000000,
    ...overrides,
  };
}

describe('Gamification Engine — Leveling & Progression', () => {
  it('guarantees pure immutability of the input user object', () => {
    const original = createMockHunter({ level: 1, xp: 50 });
    const originalCopy = JSON.parse(JSON.stringify(original));

    const result = awardXP(original, 25, 'str');

    expect(original).toEqual(originalCopy);
    expect(result.user).not.toBe(original);
  });

  it('increments XP within the same level when threshold is not reached', () => {
    const hunter = createMockHunter({ level: 1, xp: 10 });
    const result = awardXP(hunter, 50, 'str');

    expect(result.levelsGained).toBe(0);
    expect(result.user.level).toBe(1);
    expect(result.user.xp).toBe(60);
    expect(result.user.statPoints).toBe(0);
    expect(result.user.stats.str).toBe(5);
    expect(result.newRankReady).toBe(false);
  });

  it('handles exact threshold level-up cleanly with zero remainder', () => {
    // Level 1 requires 100 XP
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const result = awardXP(hunter, 100, 'str');

    expect(result.levelsGained).toBe(1);
    expect(result.user.level).toBe(2);
    expect(result.user.xp).toBe(0);
    expect(result.user.statPoints).toBe(3);
    expect(result.user.stats.str).toBe(6);
  });

  it('rolls over excess XP correctly into the next level', () => {
    const hunter = createMockHunter({ level: 1, xp: 80 });
    // Adding 50 XP -> 130 XP total. Level 1 needs 100 -> 30 rollover into Level 2
    const result = awardXP(hunter, 50, 'vit');

    expect(result.levelsGained).toBe(1);
    expect(result.user.level).toBe(2);
    expect(result.user.xp).toBe(30);
    expect(result.user.statPoints).toBe(3);
    expect(result.user.stats.vit).toBe(6);
    expect(result.user.stats.str).toBe(5);
  });

  it('supports massive multi-level jumps in a single transaction', () => {
    // Level 1: needs 100
    // Level 2: needs 282
    // Level 3: needs 519
    // Level 4: needs 800
    // Total for level 1 -> 5: 100 + 282 + 519 + 800 = 1701 XP
    const hunter = createMockHunter({ level: 1, xp: 0 });
    const result = awardXP(hunter, 1750, 'agi');

    expect(result.levelsGained).toBe(4);
    expect(result.user.level).toBe(5);
    expect(result.user.statPoints).toBe(12); // 4 * 3 SP
    expect(result.user.stats.agi).toBe(9); // 5 + 4
    expect(result.user.xp).toBe(1750 - (xpRequired(1) + xpRequired(2) + xpRequired(3) + xpRequired(4)));
  });

  it('unlocks rank trial when hunter crosses the rank minLevel threshold', () => {
    // Hunter at Level 9, 10 XP away from level 10
    const hunter = createMockHunter({ level: 9, xp: xpRequired(9) - 10, rank: 'E' });
    const result = awardXP(hunter, 20, 'str');

    expect(result.user.level).toBe(10);
    expect(result.user.pendingTrialUnlocked).toBe(true);
    expect(result.newRankReady).toBe(true);
    expect(result.unlockedTrialRank).toBe('D');
  });

  it('handles zero or negative XP additions without side effects', () => {
    const hunter = createMockHunter({ level: 5, xp: 120 });
    const zeroResult = awardXP(hunter, 0, 'str');
    const negResult = awardXP(hunter, -50, 'str');

    expect(zeroResult.user.level).toBe(5);
    expect(zeroResult.user.xp).toBe(120);
    expect(zeroResult.levelsGained).toBe(0);

    expect(negResult.user.level).toBe(5);
    expect(negResult.user.xp).toBe(120);
    expect(negResult.levelsGained).toBe(0);
  });
});
