import { useUserStore } from './useUserStore';

export function useHabits() {
  const store = useUserStore();

  return {
    habits: store.habits,
    addHabit: store.addHabit,
    toggleHabitDay: store.toggleHabitDay,
    updateHabit: store.updateHabit,
    deleteHabit: store.deleteHabit
  };
}
