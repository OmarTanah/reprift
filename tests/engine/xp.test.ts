import {
  calculateExerciseXP,
  DAILY_QUEST_BONUS_XP,
  DIFFICULTY_MULTIPLIERS,
  PERFECT_WEEK_BONUS_XP,
  xpRequired,
} from '../../src/engine/xp';

describe('Gamification Engine — XP Formulas & Rules', () => {
  describe('xpRequired()', () => {
    it('matches exact spec table benchmarks', () => {
      expect(xpRequired(1)).toBe(100);
      expect(xpRequired(2)).toBe(282);
      expect(xpRequired(5)).toBe(1118);
      expect(xpRequired(10)).toBe(3162);
      expect(xpRequired(25)).toBe(12500);
      expect(xpRequired(50)).toBe(35355);
    });

    it('safely handles non-positive and fractional levels', () => {
      expect(xpRequired(0)).toBe(100);
      expect(xpRequired(-10)).toBe(100);
      expect(xpRequired(1.9)).toBe(100); // floored to level 1
      expect(xpRequired(2.4)).toBe(282); // floored to level 2
    });

    it('scales monotonically from level 1 to level 200', () => {
      let previousXP = 0;
      for (let lvl = 1; lvl <= 200; lvl++) {
        const required = xpRequired(lvl);
        expect(required).toBeGreaterThan(previousXP);
        previousXP = required;
      }
    });
  });

  describe('calculateExerciseXP()', () => {
    it('calculates base push-up XP (1 XP / rep, STR focus)', () => {
      const result = calculateExerciseXP('pushup_standard', 20);
      expect(result.xp).toBe(20);
      expect(result.statFocus).toBe('str');
    });

    it('calculates pull-up XP (3 XP / rep, STR focus)', () => {
      const result = calculateExerciseXP('pullup_standard', 10);
      expect(result.xp).toBe(30);
      expect(result.statFocus).toBe('str');
    });

    it('calculates sit-up XP (1 XP / rep, VIT focus)', () => {
      const result = calculateExerciseXP('situp_standard', 30);
      expect(result.xp).toBe(30);
      expect(result.statFocus).toBe('vit');
    });

    it('calculates squat XP (1 XP / rep, STR focus)', () => {
      const result = calculateExerciseXP('squat_standard', 25);
      expect(result.xp).toBe(25);
      expect(result.statFocus).toBe('str');
    });

    it('calculates plank hold XP (1 XP / 5 sec, VIT focus)', () => {
      const result = calculateExerciseXP('plank_standard', 60);
      expect(result.xp).toBe(12);
      expect(result.statFocus).toBe('vit');
    });

    it('calculates run XP (1 XP / 10m, AGI focus)', () => {
      const result = calculateExerciseXP('run_outdoor', 1000);
      expect(result.xp).toBe(100);
      expect(result.statFocus).toBe('agi');
    });

    it('applies difficulty multipliers correctly', () => {
      expect(calculateExerciseXP('pushup', 10, 'beginner').xp).toBe(10);
      expect(calculateExerciseXP('pushup', 10, 'intermediate').xp).toBe(15);
      expect(calculateExerciseXP('pushup', 10, 'advanced').xp).toBe(20);
      expect(calculateExerciseXP('pushup', 10, 'elite').xp).toBe(30);
    });

    it('applies +10% bonus for verified runs', () => {
      // 1000m -> 100 base XP. With +10% -> 110 XP
      const unverified = calculateExerciseXP('run', 1000, 'beginner', false);
      const verified = calculateExerciseXP('run', 1000, 'beginner', true);

      expect(unverified.xp).toBe(100);
      expect(verified.xp).toBe(110);
    });

    it('returns zero XP for non-positive amounts', () => {
      expect(calculateExerciseXP('pushup', 0).xp).toBe(0);
      expect(calculateExerciseXP('pushup', -5).xp).toBe(0);
    });

    it('preserves constants for completion bonuses', () => {
      expect(DAILY_QUEST_BONUS_XP).toBe(50);
      expect(PERFECT_WEEK_BONUS_XP).toBe(200);
    });
  });
});
