import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStorage } from './storage';

interface TrialState {
  lastAttemptAt: number | null;
  recordAttempt: (timestamp: number) => void;
  reset: () => void;
}

export const useTrialStore = create<TrialState>()(
  persist(
    (set) => ({
      lastAttemptAt: null,
      recordAttempt: (timestamp: number) => set({ lastAttemptAt: timestamp }),
      reset: () => set({ lastAttemptAt: null }),
    }),
    {
      name: 'reprift-trial-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);