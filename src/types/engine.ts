export type RankTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type StatFocus = 'str' | 'vit' | 'agi';

export interface UserStats {
  str: number;
  vit: number;
  agi: number;
}

export interface HunterProfile {
  uid: string;
  displayName: string;
  avatarId: string;
  timezone: string;
  level: number;
  xp: number; // XP into current level
  rank: RankTier;
  statPoints: number; // Unspent SP
  stats: UserStats;
  currentStreak: number;
  longestStreak: number;
  streakShields: number;
  lastShieldUsedDate: string | null;
  equippedTitle: string | null;
  pendingTrialUnlocked: boolean;
  createdAt: number;
  lastActiveAt: number;
}

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'elite';

export interface AwardXPResult {
  user: HunterProfile;
  levelsGained: number;
  newRankReady: boolean;
  unlockedTrialRank: RankTier | null;
}

export interface TrialObjective {
  exerciseId: string;
  target: number;
  metric: 'reps' | 'seconds' | 'meters';
}

export interface TrialDefinition {
  id: string;
  name: string;
  rank: RankTier;
  timeLimitSec: number;
  objectives: TrialObjective[];
  rewardChoices: string[];
}

export interface RankDefinition {
  rank: RankTier;
  displayName: string;
  minLevel: number;
  trialRequired: boolean;
  trial?: TrialDefinition;
  unlocks: {
    ability?: string;
    auraColor: string;
    shieldCap: number;
    features?: string[];
  };
  rewardChoices: string[];
}

export interface TrialSessionData {
  trialId: string;
  rank: RankTier;
  startedAt: number;
  completedAt: number;
  objectives: Record<string, number>; // exerciseId -> achieved target
}

export interface TrialValidationResult {
  passed: boolean;
  reason?: string;
  elapsedSec: number;
  objectiveResults: Record<string, boolean>;
}

export interface StreakEvaluationInput {
  currentDate: string; // YYYY-MM-DD
  questCompleted: boolean;
  isRestDay?: boolean;
  now: number;
}

export interface StreakEvaluationResult {
  user: HunterProfile;
  streakPreserved: boolean;
  shieldConsumed: boolean;
  streakBroken: boolean;
  shieldAwarded: number;
}

export interface PenaltyResult {
  penaltyXP: number;
  updatedUser: HunterProfile;
}

export interface StatAllocationInput {
  str?: number;
  vit?: number;
  agi?: number;
}

export type ArmorSlot = 'head' | 'chest' | 'shoulders' | 'hands' | 'feet' | 'back' | 'full' | 'aura';

export interface MilestoneArmor {
  id: string;
  name: string;
  slot: ArmorSlot;
  description: string;
}

export interface UserMilestoneMetrics {
  lifetimePullups: number;
  maxPlankSeconds: number;
  lifetimeRunMeters: number;
  passedTrials: RankTier[];
  currentStreak: number;
  longestStreak: number;
  lifetimeMuscleUps: number;
  maxLsitSeconds: number;
  accountAgeDays: number;
  level: number;
}

export type SkillTreeType = 'push' | 'pull' | 'core' | 'legs';

export interface SkillNode {
  id: string;
  tree: SkillTreeType;
  name: string;
  tier: number;
  spCost: number;
  prerequisite: string | null;
  verification: {
    type: 'reps' | 'seconds';
    target: number;
  };
  statReward: Partial<UserStats>;
  cues?: string[];
}

export interface SkillProgress {
  nodeId: string;
  unlocked: boolean;
  verified: boolean;
  unlockedAt: number | null;
  verifiedAt: number | null;
}

export interface QuestExerciseSlot {
  current: number;
  target: number;
  xpPerUnit: number;
  statFocus: StatFocus;
}

export interface DailyQuest {
  id: string;
  date: string;
  exercises: {
    pushups: QuestExerciseSlot;
    situps: QuestExerciseSlot;
    squats: QuestExerciseSlot;
    run: QuestExerciseSlot;
  };
  completed: boolean;
  bonusXpAwarded: boolean;
  shielded: boolean;
}

export interface WorkoutLog {
  id: string;
  exerciseId: string;
  reps: number;
  sets?: number;
  durationSec?: number;
  statFocus: StatFocus;
  xpAwarded: number;
  source: 'manual' | 'health' | 'trial';
  loggedAt: number;
}
