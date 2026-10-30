import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyWorkoutLogToQuest } from '../engine/quests';
import { DailyQuest, WorkoutLog } from '../types/engine';
import { mmkvStorage } from './storage';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultDailyQuest(dateStr: string = getTodayDateString()): DailyQuest {
  return {
    id: `quest_${dateStr}`,
    date: dateStr,
    exercises: {
      pushups: { current: 0, target: 100, xpPerUnit: 1, statFocus: 'str' },
      situps: { current: 0, target: 100, xpPerUnit: 1, statFocus: 'vit' },
      squats: { current: 0, target: 100, xpPerUnit: 1, statFocus: 'str' },
      run: { current: 0, target: 5000, xpPerUnit: 1, statFocus: 'agi' },
    },
    completed: false,
    bonusXpAwarded: false,
    shielded: false,
  };
}

interface QuestState {
  dailyQuest: DailyQuest;
  logExercise: (log: WorkoutLog) => DailyQuest;
  setQuest: (quest: DailyQuest) => void;
  resetQuest: (dateStr?: string) => void;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      dailyQuest: createDefaultDailyQuest(),

      logExercise: (log: WorkoutLog): DailyQuest => {
        const currentQuest = get().dailyQuest;
        const updatedQuest = applyWorkoutLogToQuest(currentQuest, log);
        set({ dailyQuest: updatedQuest });
        return updatedQuest;
      },

      setQuest: (quest: DailyQuest) => {
        set({ dailyQuest: quest });
      },

      resetQuest: (dateStr?: string) => {
        set({ dailyQuest: createDefaultDailyQuest(dateStr) });
      },
    }),
    {
      name: 'reprift-quest-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
