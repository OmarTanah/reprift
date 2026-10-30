import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { canUnlockNode, unlockNode, verifyNode } from '../engine/skills';
import { SkillProgress, SkillTreeType } from '../types/engine';
import { mmkvStorage } from './storage';

interface SkillState {
  /** Map of nodeId → progress */
  progress: Record<string, SkillProgress>;
  /** Extra SP pool specifically tracked for skill spending.
   *  This mirrors user.statPoints but is kept here for local skill store convenience.
   *  The UserStore is the source of truth — this store deducts from it via unlockSkillNode. */
  unlockNode: (nodeId: string, availableSP: number, deductSP: () => void) => boolean;
  verifySkillNode: (nodeId: string, achievedCount: number) => boolean;
  getProgress: (nodeId: string) => SkillProgress | undefined;
  reset: () => void;
}

const INITIAL_PROGRESS: Record<string, SkillProgress> = {};

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      progress: INITIAL_PROGRESS,

      unlockNode: (nodeId: string, availableSP: number, deductSP: () => void) => {
        // Lazy import to avoid circular dependency
        const { getNodeById } = require('../data/skillTrees');
        const node = getNodeById(nodeId);
        if (!node) return false;

        const currentProgress = get().progress;

        // canUnlockNode validates SP and prereqs
        const { canUnlockNode: check } = require('../engine/skills');
        if (!check(node, currentProgress, availableSP)) return false;

        const result = unlockNode(node, currentProgress, availableSP, Date.now());

        // Deduct SP from the user store (caller provides the deduct fn)
        deductSP();

        set({ progress: result.progress });
        return true;
      },

      verifySkillNode: (nodeId: string, achievedCount: number) => {
        const { getNodeById } = require('../data/skillTrees');
        const node = getNodeById(nodeId);
        if (!node) return false;

        const currentProgress = get().progress;
        const nodeProgress = currentProgress[nodeId];
        const now = Date.now();

        const { canVerifyNode: checkV } = require('../engine/skills');
        if (!checkV(node, nodeProgress, achievedCount, now)) return false;

        const updated = verifyNode(node, nodeProgress, achievedCount, now);
        set({
          progress: {
            ...currentProgress,
            [nodeId]: updated,
          },
        });
        return true;
      },

      getProgress: (nodeId: string) => {
        return get().progress[nodeId];
      },

      reset: () => {
        set({ progress: INITIAL_PROGRESS });
      },
    }),
    {
      name: 'reprift-skill-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
