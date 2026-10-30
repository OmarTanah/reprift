import { calculateMissedQuestPenalty } from '../../src/engine/penalties';
import { xpRequired } from '../../src/engine/xp';
import { createMockHunter } from './leveling.test';

describe('Gamification Engine — Penalties', () => {
  it('deducts exactly 10% of current-level required XP', () => {
    // Level 10 requires 3162 XP -> 10% penalty is 316 XP
    const hunter = createMockHunter({ level: 10, xp: 1000 });
    const result = calculateMissedQuestPenalty(hunter);

    expect(result.penaltyXP).toBe(Math.floor(0.1 * xpRequired(10)));
    expect(result.penaltyXP).toBe(316);
    expect(result.updatedUser.xp).toBe(684);
    expect(result.updatedUser.level).toBe(10);
  });

  it('clamps XP to zero and NEVER demotes user level when penalty exceeds current XP', () => {
    // Level 10 hunter with only 50 XP into level
    const hunter = createMockHunter({ level: 10, xp: 50 });
    const result = calculateMissedQuestPenalty(hunter);

    expect(result.penaltyXP).toBe(316);
    expect(result.updatedUser.xp).toBe(0); // Clamped at 0
    expect(result.updatedUser.level).toBe(10); // Strictly preserved!
  });

  it('does not mutate the original user object', () => {
    const hunter = createMockHunter({ level: 2, xp: 100 });
    const copy = { ...hunter };

    const result = calculateMissedQuestPenalty(hunter);

    expect(hunter).toEqual(copy);
    expect(result.updatedUser).not.toBe(hunter);
  });
});
