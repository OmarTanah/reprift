import { MilestoneArmor, RankTier, UserMilestoneMetrics } from '../types/engine';

export const MILESTONE_ARMOR_CATALOG: Record<string, MilestoneArmor> = {
  armor_e_gauntlets: {
    id: 'armor_e_gauntlets',
    name: 'E-Rank Gauntlets',
    slot: 'hands',
    description: '100 lifetime pull-ups',
  },
  armor_e_chestplate: {
    id: 'armor_e_chestplate',
    name: 'E-Rank Chestplate',
    slot: 'chest',
    description: '60s plank hold',
  },
  armor_e_boots: {
    id: 'armor_e_boots',
    name: 'E-Rank Boots',
    slot: 'feet',
    description: '50 km lifetime run',
  },
  armor_d_helm: {
    id: 'armor_d_helm',
    name: 'D-Rank Helm',
    slot: 'head',
    description: 'Pass D trial',
  },
  armor_d_pauldrons: {
    id: 'armor_d_pauldrons',
    name: 'D-Rank Pauldrons',
    slot: 'shoulders',
    description: '30-day streak',
  },
  armor_c_gauntlets: {
    id: 'armor_c_gauntlets',
    name: 'C-Rank Gauntlets',
    slot: 'hands',
    description: '10 clean muscle-ups',
  },
  armor_c_cloak: {
    id: 'armor_c_cloak',
    name: 'C-Rank Cloak',
    slot: 'back',
    description: '500 lifetime pull-ups',
  },
  armor_b_set: {
    id: 'armor_b_set',
    name: 'B-Rank Set',
    slot: 'full',
    description: '100-day streak',
  },
  armor_a_set: {
    id: 'armor_a_set',
    name: 'A-Rank Set',
    slot: 'full',
    description: '1000 lifetime pull-ups + 30s L-sit',
  },
  armor_s_aura: {
    id: 'armor_s_aura',
    name: 'S-Rank Aura',
    slot: 'aura',
    description: '1-year active + level 75',
  },
  armor_sss_monarch: {
    id: 'armor_sss_monarch',
    name: 'SSS Monarch Skin',
    slot: 'full',
    description: 'Level 150 + all trials passed',
  },
};

const ALL_TRIALS: readonly RankTier[] = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;

/**
 * Pure function: Evaluates user metrics against milestone thresholds
 * and returns IDs of newly unlocked armor pieces (excluding pieces already in inventory).
 */
export function evaluateMilestones(
  metrics: UserMilestoneMetrics,
  currentInventory: string[]
): string[] {
  const currentSet = new Set(currentInventory);
  const newlyUnlocked: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !currentSet.has(id)) {
      newlyUnlocked.push(id);
    }
  };

  // 1. 100 lifetime pull-ups
  check('armor_e_gauntlets', metrics.lifetimePullups >= 100);

  // 2. 60s plank hold
  check('armor_e_chestplate', metrics.maxPlankSeconds >= 60);

  // 3. 50 km lifetime run (50,000 meters)
  check('armor_e_boots', metrics.lifetimeRunMeters >= 50000);

  // 4. Pass D trial
  check('armor_d_helm', metrics.passedTrials.includes('D'));

  // 5. 30-day streak
  check(
    'armor_d_pauldrons',
    metrics.currentStreak >= 30 || metrics.longestStreak >= 30
  );

  // 6. 10 clean muscle-ups
  check('armor_c_gauntlets', metrics.lifetimeMuscleUps >= 10);

  // 7. 500 lifetime pull-ups
  check('armor_c_cloak', metrics.lifetimePullups >= 500);

  // 8. 100-day streak
  check('armor_b_set', metrics.currentStreak >= 100 || metrics.longestStreak >= 100);

  // 9. 1000 lifetime pull-ups + 30s L-sit
  check(
    'armor_a_set',
    metrics.lifetimePullups >= 1000 && metrics.maxLsitSeconds >= 30
  );

  // 10. 1-year active (>= 365 days) + level 75
  check(
    'armor_s_aura',
    metrics.accountAgeDays >= 365 && metrics.level >= 75
  );

  // 11. Level 150 + all trials passed
  const passedAll = ALL_TRIALS.every((t) => metrics.passedTrials.includes(t));
  check('armor_sss_monarch', metrics.level >= 150 && passedAll);

  return newlyUnlocked;
}
