import { HunterProfile, RankDefinition, RankTier } from '../types/engine';

export const RANK_ORDER: readonly RankTier[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;

export const RANK_DEFINITIONS: Record<RankTier, RankDefinition> = {
  E: {
    rank: 'E',
    displayName: 'Unawakened',
    minLevel: 1,
    trialRequired: false,
    unlocks: { auraColor: '#00E5FF', shieldCap: 3, features: ['base_ui'] },
    rewardChoices: [],
  },
  D: {
    rank: 'D',
    displayName: 'Awakened',
    minLevel: 10,
    trialRequired: true,
    trial: {
      id: 'trial_d',
      name: 'Gate of the Awakened',
      rank: 'D',
      timeLimitSec: 2700,
      objectives: [
        { exerciseId: 'pushup', target: 50, metric: 'reps' },
        { exerciseId: 'pullup', target: 10, metric: 'reps' },
        { exerciseId: 'run', target: 2000, metric: 'meters' },
      ],
      rewardChoices: ['aura_violet', 'shield_x2', 'title_unbroken'],
    },
    unlocks: {
      ability: 'shadow_extraction',
      auraColor: '#5A4FF9',
      shieldCap: 3,
      features: ['ability_slot_1'],
    },
    rewardChoices: ['aura_violet', 'shield_x2', 'title_unbroken'],
  },
  C: {
    rank: 'C',
    displayName: 'Raider',
    minLevel: 20,
    trialRequired: true,
    trial: {
      id: 'trial_c',
      name: 'Gate of the Raider',
      rank: 'C',
      timeLimitSec: 3600,
      objectives: [
        { exerciseId: 'pushup', target: 100, metric: 'reps' },
        { exerciseId: 'pullup', target: 25, metric: 'reps' },
        { exerciseId: 'squat', target: 100, metric: 'reps' },
      ],
      rewardChoices: ['aura_emerald', 'shield_x2', 'title_raider'],
    },
    unlocks: {
      auraColor: '#39FF88',
      shieldCap: 3,
      features: ['side_quest_slot_plus_2'],
    },
    rewardChoices: ['aura_emerald', 'shield_x2', 'title_raider'],
  },
  B: {
    rank: 'B',
    displayName: 'Elite',
    minLevel: 35,
    trialRequired: true,
    trial: {
      id: 'trial_b',
      name: 'Gate of the Elite',
      rank: 'B',
      timeLimitSec: 3600,
      objectives: [
        { exerciseId: 'pushup', target: 150, metric: 'reps' },
        { exerciseId: 'pullup', target: 40, metric: 'reps' },
        { exerciseId: 'run', target: 5000, metric: 'meters' },
      ],
      rewardChoices: ['aura_sapphire', 'shield_x3', 'title_elite'],
    },
    unlocks: {
      auraColor: '#0088FF',
      shieldCap: 5,
      features: ['custom_titles', 'shadow_unlock'],
    },
    rewardChoices: ['aura_sapphire', 'shield_x3', 'title_elite'],
  },
  A: {
    rank: 'A',
    displayName: 'Monarch Candidate',
    minLevel: 50,
    trialRequired: true,
    trial: {
      id: 'trial_a',
      name: 'Gate of the Candidate',
      rank: 'A',
      timeLimitSec: 4200,
      objectives: [
        { exerciseId: 'pushup', target: 200, metric: 'reps' },
        { exerciseId: 'pullup', target: 60, metric: 'reps' },
        { exerciseId: 'plank', target: 180, metric: 'seconds' },
      ],
      rewardChoices: ['aura_crimson', 'shield_x3', 'title_monarch_candidate'],
    },
    unlocks: {
      auraColor: '#FF3860',
      shieldCap: 5,
      features: ['leaderboard_flair', 'guild_raid_start'],
    },
    rewardChoices: ['aura_crimson', 'shield_x3', 'title_monarch_candidate'],
  },
  S: {
    rank: 'S',
    displayName: 'Monarch',
    minLevel: 75,
    trialRequired: true,
    trial: {
      id: 'trial_s',
      name: 'Gate of the Monarch',
      rank: 'S',
      timeLimitSec: 4800,
      objectives: [
        { exerciseId: 'pushup', target: 300, metric: 'reps' },
        { exerciseId: 'pullup', target: 100, metric: 'reps' },
        { exerciseId: 'run', target: 10000, metric: 'meters' },
      ],
      rewardChoices: ['aura_gold', 'shield_x3', 'title_monarch'],
    },
    unlocks: {
      auraColor: '#FFC940',
      shieldCap: 5,
      features: ['custom_ui_theme', 'guild_xp_buff'],
    },
    rewardChoices: ['aura_gold', 'shield_x3', 'title_monarch'],
  },
  SS: {
    rank: 'SS',
    displayName: 'Sovereign',
    minLevel: 100,
    trialRequired: true,
    trial: {
      id: 'trial_ss',
      name: 'Gate of the Sovereign',
      rank: 'SS',
      timeLimitSec: 5400,
      objectives: [
        { exerciseId: 'pushup', target: 400, metric: 'reps' },
        { exerciseId: 'pullup', target: 150, metric: 'reps' },
        { exerciseId: 'run', target: 15000, metric: 'meters' },
      ],
      rewardChoices: ['aura_sovereign', 'shield_x3', 'title_sovereign'],
    },
    unlocks: {
      auraColor: '#E040FB',
      shieldCap: 5,
      features: ['exclusive_aura', 'prestige_teaser'],
    },
    rewardChoices: ['aura_sovereign', 'shield_x3', 'title_sovereign'],
  },
  SSS: {
    rank: 'SSS',
    displayName: 'Absolute',
    minLevel: 150,
    trialRequired: true,
    trial: {
      id: 'trial_sss',
      name: 'Gate of the Absolute',
      rank: 'SSS',
      timeLimitSec: 7200,
      objectives: [
        { exerciseId: 'pushup', target: 500, metric: 'reps' },
        { exerciseId: 'pullup', target: 200, metric: 'reps' },
        { exerciseId: 'run', target: 21097, metric: 'meters' },
      ],
      rewardChoices: ['aura_absolute', 'shield_x5', 'title_absolute'],
    },
    unlocks: {
      auraColor: '#FFFFFF',
      shieldCap: 5,
      features: ['prestige_new_game_plus'],
    },
    rewardChoices: ['aura_absolute', 'shield_x5', 'title_absolute'],
  },
};

export function getRankDefinition(rank: RankTier): RankDefinition {
  return RANK_DEFINITIONS[rank];
}

export function getNextRank(rank: RankTier): RankTier | null {
  const currentIndex = RANK_ORDER.indexOf(rank);
  if (currentIndex === -1 || currentIndex === RANK_ORDER.length - 1) {
    return null;
  }
  return RANK_ORDER[currentIndex + 1];
}

export function getMaxShieldsForRank(rank: RankTier): number {
  return RANK_DEFINITIONS[rank]?.unlocks.shieldCap ?? 3;
}

export function isTrialEligible(user: HunterProfile): boolean {
  const nextRank = getNextRank(user.rank);
  if (!nextRank) return false;
  const nextDef = getRankDefinition(nextRank);
  return user.level >= nextDef.minLevel && nextDef.trialRequired;
}

export function promoteRank(user: HunterProfile, toRank: RankTier): HunterProfile {
  return {
    ...user,
    rank: toRank,
    pendingTrialUnlocked: false,
  };
}
