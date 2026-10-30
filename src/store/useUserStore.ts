import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { awardXP } from '../engine/leveling';
import { allocateStatPoints } from '../engine/stats';
import { AwardXPResult, HunterProfile, StatAllocationInput, StatFocus } from '../types/engine';
import { mmkvStorage } from './storage';

export const INITIAL_HUNTER_PROFILE: HunterProfile = {
  uid: 'hunter_local_01',
  displayName: 'KAI',
  avatarId: 'avatar_default',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  level: 1,
  xp: 0,
  rank: 'E',
  statPoints: 0,
  stats: { str: 5, vit: 5, agi: 5 },
  currentStreak: 0,
  longestStreak: 0,
  streakShields: 0,
  lastShieldUsedDate: null,
  equippedTitle: 'Unawakened',
  pendingTrialUnlocked: false,
  createdAt: 1700000000000,
  lastActiveAt: 1700000000000,
};

interface UserState {
  user: HunterProfile;
  addXP: (amount: number, statFocus: StatFocus) => AwardXPResult;
  allocateStats: (allocation: StatAllocationInput) => void;
  setUser: (user: HunterProfile) => void;
  resetUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: INITIAL_HUNTER_PROFILE,

      addXP: (amount: number, statFocus: StatFocus) => {
        const currentUser = get().user;
        const result = awardXP(currentUser, amount, statFocus);
        set({ user: result.user });
        return result;
      },

      allocateStats: (allocation: StatAllocationInput) => {
        const currentUser = get().user;
        const updatedUser = allocateStatPoints(currentUser, allocation);
        set({ user: updatedUser });
      },

      setUser: (user: HunterProfile) => {
        set({ user });
      },

      resetUser: () => {
        set({ user: INITIAL_HUNTER_PROFILE });
      },
    }),
    {
      name: 'reprift-user-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
