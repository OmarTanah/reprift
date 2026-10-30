import { evaluateMilestones, MILESTONE_ARMOR_CATALOG } from '../../src/engine/rewards';
import { UserMilestoneMetrics } from '../../src/types/engine';

export function createBaseMetrics(overrides?: Partial<UserMilestoneMetrics>): UserMilestoneMetrics {
  return {
    lifetimePullups: 0,
    maxPlankSeconds: 0,
    lifetimeRunMeters: 0,
    passedTrials: [],
    currentStreak: 0,
    longestStreak: 0,
    lifetimeMuscleUps: 0,
    maxLsitSeconds: 0,
    accountAgeDays: 0,
    level: 1,
    ...overrides,
  };
}

describe('Gamification Engine — Milestone Armor & Rewards', () => {
  it('contains complete catalog of 11 milestone pieces', () => {
    expect(Object.keys(MILESTONE_ARMOR_CATALOG)).toHaveLength(11);
  });

  it('unlocks E-Rank Gauntlets at 100 lifetime pull-ups', () => {
    const metrics = createBaseMetrics({ lifetimePullups: 100 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_e_gauntlets');
  });

  it('unlocks E-Rank Chestplate at 60s plank hold', () => {
    const metrics = createBaseMetrics({ maxPlankSeconds: 60 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_e_chestplate');
  });

  it('unlocks E-Rank Boots at 50 km lifetime run', () => {
    const metrics = createBaseMetrics({ lifetimeRunMeters: 50000 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_e_boots');
  });

  it('unlocks D-Rank Helm upon passing D Trial', () => {
    const metrics = createBaseMetrics({ passedTrials: ['D'] });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_d_helm');
  });

  it('unlocks D-Rank Pauldrons at 30-day streak', () => {
    const metrics = createBaseMetrics({ currentStreak: 30 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_d_pauldrons');
  });

  it('unlocks C-Rank Gauntlets at 10 clean muscle-ups', () => {
    const metrics = createBaseMetrics({ lifetimeMuscleUps: 10 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_c_gauntlets');
  });

  it('unlocks C-Rank Cloak at 500 lifetime pull-ups', () => {
    const metrics = createBaseMetrics({ lifetimePullups: 500 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_c_cloak');
  });

  it('unlocks B-Rank Set at 100-day streak', () => {
    const metrics = createBaseMetrics({ longestStreak: 100 });
    const unlocked = evaluateMilestones(metrics, []);
    expect(unlocked).toContain('armor_b_set');
  });

  it('unlocks A-Rank Set at 1000 pull-ups and 30s L-sit', () => {
    const partialMetrics = createBaseMetrics({ lifetimePullups: 1000, maxLsitSeconds: 29 });
    expect(evaluateMilestones(partialMetrics, [])).not.toContain('armor_a_set');

    const fullMetrics = createBaseMetrics({ lifetimePullups: 1000, maxLsitSeconds: 30 });
    expect(evaluateMilestones(fullMetrics, [])).toContain('armor_a_set');
  });

  it('unlocks S-Rank Aura at Level 75 and 365 active days', () => {
    const metrics = createBaseMetrics({ level: 75, accountAgeDays: 365 });
    expect(evaluateMilestones(metrics, [])).toContain('armor_s_aura');
  });

  it('unlocks SSS Monarch Skin at Level 150 and all trials passed', () => {
    const metrics = createBaseMetrics({
      level: 150,
      passedTrials: ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'],
    });
    expect(evaluateMilestones(metrics, [])).toContain('armor_sss_monarch');
  });

  it('is strictly idempotent and filters out already-owned inventory items', () => {
    const metrics = createBaseMetrics({ lifetimePullups: 100, maxPlankSeconds: 60 });
    // User already owns armor_e_gauntlets
    const unlocked = evaluateMilestones(metrics, ['armor_e_gauntlets']);

    expect(unlocked).not.toContain('armor_e_gauntlets');
    expect(unlocked).toContain('armor_e_chestplate');
  });
});
