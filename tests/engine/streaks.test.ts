import { evaluateDailyStreak, isConsecutiveDay } from '../../src/engine/streaks';
import { createMockHunter } from './leveling.test';

describe('Gamification Engine — Streaks & Shields', () => {
  describe('isConsecutiveDay()', () => {
    it('accurately detects contiguous calendar days across months and years', () => {
      expect(isConsecutiveDay('2026-10-30', '2026-10-31')).toBe(true);
      expect(isConsecutiveDay('2026-10-31', '2026-11-01')).toBe(true); // Month rollover
      expect(isConsecutiveDay('2026-12-31', '2027-01-01')).toBe(true); // Year rollover
      expect(isConsecutiveDay('2026-10-28', '2026-10-30')).toBe(false); // Non-contiguous
      expect(isConsecutiveDay('2026-10-30', '2026-10-30')).toBe(false); // Same day
    });
  });

  describe('evaluateDailyStreak()', () => {
    const now = 1700000000000;

    it('increments streak and updates longest streak on completed quest', () => {
      const hunter = createMockHunter({ currentStreak: 3, longestStreak: 3 });
      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: true,
        now,
      });

      expect(result.streakPreserved).toBe(true);
      expect(result.streakBroken).toBe(false);
      expect(result.shieldConsumed).toBe(false);
      expect(result.user.currentStreak).toBe(4);
      expect(result.user.longestStreak).toBe(4);
    });

    it('awards 1 shield upon hitting a 7-day streak', () => {
      const hunter = createMockHunter({ currentStreak: 6, streakShields: 0 });
      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: true,
        now,
      });

      expect(result.user.currentStreak).toBe(7);
      expect(result.shieldAwarded).toBe(1);
      expect(result.user.streakShields).toBe(1);
    });

    it('awards 2 shields upon hitting a 30-day streak', () => {
      const hunter = createMockHunter({ currentStreak: 29, streakShields: 0 });
      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: true,
        now,
      });

      expect(result.user.currentStreak).toBe(30);
      expect(result.shieldAwarded).toBe(2);
      expect(result.user.streakShields).toBe(2);
    });

    it('awards 3 shields upon hitting a 100-day streak', () => {
      const hunter = createMockHunter({ rank: 'B', currentStreak: 99, streakShields: 1 });
      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: true,
        now,
      });

      expect(result.user.currentStreak).toBe(100);
      expect(result.shieldAwarded).toBe(3);
      expect(result.user.streakShields).toBe(4); // 1 + 3
    });

    it('respects the rank shield cap when awarding shields', () => {
      // E-rank cap is 3
      const hunter = createMockHunter({ rank: 'E', currentStreak: 6, streakShields: 3 });
      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: true,
        now,
      });

      expect(result.user.currentStreak).toBe(7);
      expect(result.shieldAwarded).toBe(1);
      expect(result.user.streakShields).toBe(3); // Clamped at 3
    });

    it('preserves streak without consuming shield on recovery protocol (rest day)', () => {
      const hunter = createMockHunter({ currentStreak: 12, streakShields: 2 });
      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: false,
        isRestDay: true,
        now,
      });

      expect(result.streakPreserved).toBe(true);
      expect(result.shieldConsumed).toBe(false);
      expect(result.streakBroken).toBe(false);
      expect(result.user.currentStreak).toBe(12);
      expect(result.user.streakShields).toBe(2);
    });

    it('auto-consumes 1 shield to protect streak on missed day', () => {
      const hunter = createMockHunter({
        currentStreak: 15,
        streakShields: 2,
        lastShieldUsedDate: '2026-10-20', // Not yesterday
      });

      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: false,
        isRestDay: false,
        now,
      });

      expect(result.streakPreserved).toBe(true);
      expect(result.shieldConsumed).toBe(true);
      expect(result.streakBroken).toBe(false);
      expect(result.user.currentStreak).toBe(15);
      expect(result.user.streakShields).toBe(1);
      expect(result.user.lastShieldUsedDate).toBe('2026-10-30');
    });

    it('breaks streak if a shield was already consumed on the immediately preceding day', () => {
      const hunter = createMockHunter({
        currentStreak: 15,
        streakShields: 2,
        lastShieldUsedDate: '2026-10-29', // Was shielded yesterday!
      });

      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: false,
        isRestDay: false,
        now,
      });

      expect(result.streakPreserved).toBe(false);
      expect(result.shieldConsumed).toBe(false);
      expect(result.streakBroken).toBe(true);
      expect(result.user.currentStreak).toBe(0);
      expect(result.user.streakShields).toBe(2); // Shield not consumed because consecutive shield forbidden
    });

    it('breaks streak when no shields are available on a missed day', () => {
      const hunter = createMockHunter({
        currentStreak: 8,
        streakShields: 0,
        lastShieldUsedDate: null,
      });

      const result = evaluateDailyStreak(hunter, {
        currentDate: '2026-10-30',
        questCompleted: false,
        isRestDay: false,
        now,
      });

      expect(result.streakPreserved).toBe(false);
      expect(result.streakBroken).toBe(true);
      expect(result.shieldConsumed).toBe(false);
      expect(result.user.currentStreak).toBe(0);
    });
  });
});
