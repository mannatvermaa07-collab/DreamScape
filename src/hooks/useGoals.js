import { useUserStore } from './useUserStore';

export function useGoals() {
  const store = useUserStore();

  return {
    goals: store.goals,
    addGoal: store.addGoal,
    updateGoal: store.updateGoal,
    toggleGoal: store.toggleGoal,
    deleteGoal: store.deleteGoal
  };
}
