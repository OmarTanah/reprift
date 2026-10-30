import {
  applyWorkoutLogToQuest,
  isDailyQuestComplete,
  isSoftCappedLog,
  mergeWorkoutLogs,
  SOFT_CAP_REPS_PER_ENTRY,
} from '../../src/engine/quests';
import { DailyQuest, WorkoutLog } from '../../src/types/engine';

export function createBaseDailyQuest(overrides?: Partial<DailyQuest>): DailyQuest {
  return {
    id: 'quest_2026-10-30',
    date: '2026-10-30',
    exercises: {
      pushups: { current: 0, target: 100, xpPerUnit: 1, statFocus: 'str' },
      situps: { current: 0, target: 100, xpPerUnit: 1, statFocus: 'vit' },
      squats: { current: 0, target: 100, xpPerUnit: 1, statFocus: 'str' },
      run: { current: 0, target: 5000, xpPerUnit: 1, statFocus: 'agi' },
    },
    completed: false,
    bonusXpAwarded: false,
    shielded: false,
    ...overrides,
  };
}

describe('Gamification Engine — Daily Quests & Additive Logging', () => {
  describe('applyWorkoutLogToQuest()', () => {
    it('applies workout logs additively and never overwrites existing counts', () => {
      const initialQuest = createBaseDailyQuest();

      const log1: WorkoutLog = {
        id: 'log_1',
        exerciseId: 'pushup_standard',
        reps: 40,
        statFocus: 'str',
        xpAwarded: 40,
        source: 'manual',
        loggedAt: 1000,
      };

      const q1 = applyWorkoutLogToQuest(initialQuest, log1);
      expect(q1.exercises.pushups.current).toBe(40);

      const log2: WorkoutLog = {
        id: 'log_2',
        exerciseId: 'pushup_diamond',
        reps: 35,
        statFocus: 'str',
        xpAwarded: 35,
        source: 'manual',
        loggedAt: 2000,
      };

      const q2 = applyWorkoutLogToQuest(q1, log2);
      expect(q2.exercises.pushups.current).toBe(75); // 40 + 35 (summed, not overwritten!)
    });

    it('sets quest.completed to true once all 4 targets are satisfied', () => {
      let quest = createBaseDailyQuest();

      quest = applyWorkoutLogToQuest(quest, {
        id: 'l1',
        exerciseId: 'pushup',
        reps: 100,
        statFocus: 'str',
        xpAwarded: 100,
        source: 'manual',
        loggedAt: 1000,
      });
      expect(quest.completed).toBe(false);

      quest = applyWorkoutLogToQuest(quest, {
        id: 'l2',
        exerciseId: 'situp',
        reps: 100,
        statFocus: 'vit',
        xpAwarded: 100,
        source: 'manual',
        loggedAt: 2000,
      });
      expect(quest.completed).toBe(false);

      quest = applyWorkoutLogToQuest(quest, {
        id: 'l3',
        exerciseId: 'squat',
        reps: 100,
        statFocus: 'str',
        xpAwarded: 100,
        source: 'manual',
        loggedAt: 3000,
      });
      expect(quest.completed).toBe(false);

      quest = applyWorkoutLogToQuest(quest, {
        id: 'l4',
        exerciseId: 'run',
        reps: 5000,
        statFocus: 'agi',
        xpAwarded: 500,
        source: 'health',
        loggedAt: 4000,
      });

      expect(quest.completed).toBe(true);
      expect(isDailyQuestComplete(quest)).toBe(true);
    });
  });

  describe('Soft Cap Detection', () => {
    it('flags logs that exceed the 500-rep single-entry threshold', () => {
      expect(SOFT_CAP_REPS_PER_ENTRY).toBe(500);
      expect(isSoftCappedLog(500)).toBe(false);
      expect(isSoftCappedLog(501)).toBe(true);
      expect(isSoftCappedLog(10000)).toBe(true);
    });
  });

  describe('mergeWorkoutLogs()', () => {
    it('deduplicates logs and sorts chronologically', () => {
      const logA: WorkoutLog = {
        id: 'log_a',
        exerciseId: 'pushup',
        reps: 20,
        statFocus: 'str',
        xpAwarded: 20,
        source: 'manual',
        loggedAt: 200,
      };

      const logB: WorkoutLog = {
        id: 'log_b',
        exerciseId: 'pullup',
        reps: 10,
        statFocus: 'str',
        xpAwarded: 30,
        source: 'manual',
        loggedAt: 100,
      };

      const logDuplicate: WorkoutLog = { ...logA };

      const merged = mergeWorkoutLogs([logA], [logB, logDuplicate]);

      expect(merged).toHaveLength(2);
      expect(merged[0].id).toBe('log_b'); // Earlier timestamp (100)
      expect(merged[1].id).toBe('log_a'); // Later timestamp (200)
    });
  });
});
