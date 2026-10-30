import { allocateStatPoints } from '../../src/engine/stats';
import { createMockHunter } from './leveling.test';

describe('Gamification Engine — Stat Point Allocation', () => {
  it('correctly increments stats and deducts spent stat points', () => {
    const hunter = createMockHunter({
      statPoints: 6,
      stats: { str: 5, vit: 5, agi: 5 },
    });

    const updated = allocateStatPoints(hunter, { str: 2, vit: 1, agi: 1 });

    expect(updated.statPoints).toBe(2); // 6 - 4
    expect(updated.stats.str).toBe(7);
    expect(updated.stats.vit).toBe(6);
    expect(updated.stats.agi).toBe(6);
  });

  it('allows spending all remaining stat points exactly', () => {
    const hunter = createMockHunter({
      statPoints: 3,
      stats: { str: 10, vit: 10, agi: 10 },
    });

    const updated = allocateStatPoints(hunter, { str: 3 });

    expect(updated.statPoints).toBe(0);
    expect(updated.stats.str).toBe(13);
  });

  it('throws an error if attempting to spend more stat points than available', () => {
    const hunter = createMockHunter({
      statPoints: 2,
      stats: { str: 5, vit: 5, agi: 5 },
    });

    expect(() => {
      allocateStatPoints(hunter, { str: 2, vit: 1 });
    }).toThrow(/Cannot spend 3 stat points; only 2 available/);
  });

  it('throws an error if negative allocations are provided', () => {
    const hunter = createMockHunter({ statPoints: 5 });

    expect(() => {
      allocateStatPoints(hunter, { str: -1, vit: 2 });
    }).toThrow(/Stat allocations cannot be negative/);
  });

  it('returns original user state if allocation is empty or zero', () => {
    const hunter = createMockHunter({ statPoints: 3 });
    const emptyResult = allocateStatPoints(hunter, {});
    const zeroResult = allocateStatPoints(hunter, { str: 0, vit: 0, agi: 0 });

    expect(emptyResult.statPoints).toBe(3);
    expect(zeroResult.statPoints).toBe(3);
  });
});
