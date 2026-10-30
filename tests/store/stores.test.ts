import { useQuestStore } from '../../src/store/useQuestStore';
import { useUserStore } from '../../src/store/useUserStore';

describe('Store Integration — User & Quest Stores', () => {
  beforeEach(() => {
    useUserStore.getState().resetUser();
    useQuestStore.getState().resetQuest();
  });

  it('updates quest and awards XP when logging push-ups', () => {
    const userStore = useUserStore.getState();
    const questStore = useQuestStore.getState();

    expect(userStore.user.level).toBe(1);
    expect(userStore.user.xp).toBe(0);
    expect(questStore.dailyQuest.exercises.pushups.current).toBe(0);

    // Simulate pressing "+1 Push-up"
    questStore.logExercise({
      id: 'log_test_1',
      exerciseId: 'pushup_standard',
      reps: 1,
      statFocus: 'str',
      xpAwarded: 1,
      source: 'manual',
      loggedAt: 1000,
    });

    userStore.addXP(1, 'str');

    const updatedUser = useUserStore.getState().user;
    const updatedQuest = useQuestStore.getState().dailyQuest;

    expect(updatedQuest.exercises.pushups.current).toBe(1);
    expect(updatedUser.xp).toBe(1);
    expect(updatedUser.level).toBe(1);
  });

  it('triggers level up and stat point reward when accumulated XP reaches threshold', () => {
    const userStore = useUserStore.getState();

    // Award 100 XP (Level 1 threshold)
    userStore.addXP(100, 'str');

    const updatedUser = useUserStore.getState().user;
    expect(updatedUser.level).toBe(2);
    expect(updatedUser.statPoints).toBe(3);
    expect(updatedUser.stats.str).toBe(6); // 5 + 1 auto-tick
  });
});
