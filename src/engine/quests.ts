import { DailyQuest, WorkoutLog } from '../types/engine';

export const SOFT_CAP_REPS_PER_ENTRY = 500;

/**
 * Checks whether an incoming workout log exceeds the single-session soft cap.
 */
export function isSoftCappedLog(reps: number): boolean {
  return reps > SOFT_CAP_REPS_PER_ENTRY;
}

/**
 * Evaluates whether all 4 required daily quest exercises meet or exceed their targets.
 */
export function isDailyQuestComplete(quest: DailyQuest): boolean {
  const { pushups, situps, squats, run } = quest.exercises;
  return (
    pushups.current >= pushups.target &&
    situps.current >= situps.target &&
    squats.current >= squats.target &&
    run.current >= run.target
  );
}

/**
 * Pure function: Applies a logged exercise to the daily quest additively.
 * Never overwrites previous progress; adds newly logged reps to current.
 */
export function applyWorkoutLogToQuest(
  quest: DailyQuest,
  log: WorkoutLog
): DailyQuest {
  const exerciseId = log.exerciseId.toLowerCase();
  const safeReps = Math.max(0, log.reps);

  const updatedExercises = { ...quest.exercises };

  if (exerciseId.includes('pushup')) {
    updatedExercises.pushups = {
      ...updatedExercises.pushups,
      current: updatedExercises.pushups.current + safeReps,
    };
  } else if (exerciseId.includes('situp') || exerciseId.includes('core')) {
    updatedExercises.situps = {
      ...updatedExercises.situps,
      current: updatedExercises.situps.current + safeReps,
    };
  } else if (exerciseId.includes('squat')) {
    updatedExercises.squats = {
      ...updatedExercises.squats,
      current: updatedExercises.squats.current + safeReps,
    };
  } else if (exerciseId.includes('run')) {
    updatedExercises.run = {
      ...updatedExercises.run,
      current: updatedExercises.run.current + safeReps,
    };
  }

  const updatedQuest: DailyQuest = {
    ...quest,
    exercises: updatedExercises,
  };

  updatedQuest.completed = isDailyQuestComplete(updatedQuest);

  return updatedQuest;
}

/**
 * Pure function: Merges workout logs from multiple sources or devices.
 * Prevents duplicate log IDs and ensures chronological ordering.
 */
export function mergeWorkoutLogs(
  existingLogs: readonly WorkoutLog[],
  incomingLogs: readonly WorkoutLog[]
): WorkoutLog[] {
  const logMap = new Map<string, WorkoutLog>();

  for (const log of existingLogs) {
    logMap.set(log.id, log);
  }

  for (const log of incomingLogs) {
    // If log ID already exists, do not duplicate
    if (!logMap.has(log.id)) {
      logMap.set(log.id, log);
    }
  }

  return Array.from(logMap.values()).sort((a, b) => a.loggedAt - b.loggedAt);
}
