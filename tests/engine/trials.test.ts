import { getRankDefinition } from '../../src/engine/ranks';
import {
  canAttemptTrial,
  TRIAL_RETRY_COOLDOWN_MS,
  validateTrialAttempt,
} from '../../src/engine/trials';
import { TrialSessionData } from '../../src/types/engine';

describe('Gamification Engine — Trials & Gates', () => {
  const trialD = getRankDefinition('D').trial!;

  describe('canAttemptTrial()', () => {
    const now = 1700000000000;

    it('allows attempt if the hunter has never attempted a trial', () => {
      const check = canAttemptTrial(null, now);
      expect(check.allowed).toBe(true);
      expect(check.remainingCooldownMs).toBe(0);
    });

    it('locks out attempt if within 24-hour cooldown window', () => {
      const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
      const check = canAttemptTrial(twelveHoursAgo, now);

      expect(check.allowed).toBe(false);
      expect(check.remainingCooldownMs).toBe(12 * 60 * 60 * 1000);
    });

    it('allows attempt after exactly 24 hours have elapsed', () => {
      const exactTwentyFourHoursAgo = now - TRIAL_RETRY_COOLDOWN_MS;
      const check = canAttemptTrial(exactTwentyFourHoursAgo, now);

      expect(check.allowed).toBe(true);
      expect(check.remainingCooldownMs).toBe(0);
    });

    it('allows attempt when more than 24 hours have passed', () => {
      const thirtyHoursAgo = now - 30 * 60 * 60 * 1000;
      const check = canAttemptTrial(thirtyHoursAgo, now);

      expect(check.allowed).toBe(true);
      expect(check.remainingCooldownMs).toBe(0);
    });
  });

  describe('validateTrialAttempt()', () => {
    const baseAttempt: TrialSessionData = {
      trialId: trialD.id,
      rank: 'D',
      startedAt: 1000000,
      completedAt: 1000000 + 1800 * 1000, // 1800 seconds (limit is 2700)
      objectives: {
        pushup: 50,
        pullup: 10,
        run: 2000,
      },
    };

    it('passes when all objectives are met within time limit', () => {
      const result = validateTrialAttempt(trialD, baseAttempt, baseAttempt.completedAt);

      expect(result.passed).toBe(true);
      expect(result.elapsedSec).toBe(1800);
      expect(result.objectiveResults.pushup).toBe(true);
      expect(result.objectiveResults.pullup).toBe(true);
      expect(result.objectiveResults.run).toBe(true);
    });

    it('fails when even a single objective is unmet', () => {
      const failedAttempt: TrialSessionData = {
        ...baseAttempt,
        objectives: {
          pushup: 49, // 1 rep short
          pullup: 10,
          run: 2000,
        },
      };

      const result = validateTrialAttempt(trialD, failedAttempt, failedAttempt.completedAt);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe('Objectives unmet');
      expect(result.objectiveResults.pushup).toBe(false);
      expect(result.objectiveResults.pullup).toBe(true);
      expect(result.objectiveResults.run).toBe(true);
    });

    it('fails when time limit is exceeded, even if all objectives were completed', () => {
      const timeoutAttempt: TrialSessionData = {
        ...baseAttempt,
        completedAt: baseAttempt.startedAt + 2701 * 1000, // 2701 seconds (limit: 2700)
      };

      const result = validateTrialAttempt(trialD, timeoutAttempt, timeoutAttempt.completedAt);

      expect(result.passed).toBe(false);
      expect(result.reason).toBe('Time limit exceeded');
      expect(result.elapsedSec).toBe(2701);
    });

    it('passes at the exact second boundary of the time limit', () => {
      const boundaryAttempt: TrialSessionData = {
        ...baseAttempt,
        completedAt: baseAttempt.startedAt + 2700 * 1000, // exactly 2700s
      };

      const result = validateTrialAttempt(trialD, boundaryAttempt, boundaryAttempt.completedAt);

      expect(result.passed).toBe(true);
      expect(result.elapsedSec).toBe(2700);
    });
  });
});
