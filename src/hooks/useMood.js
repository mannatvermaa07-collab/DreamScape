import { useUserStore } from './useUserStore';

export function useMood() {
  const store = useUserStore();
  const todayStr = new Date().toISOString().split('T')[0];

  const todayMood = (store.moodHistory || []).find((m) => m.date === todayStr) || null;

  return {
    todayMood,
    moodHistory: store.moodHistory || [],
    setTodayMood: store.setTodayMood
  };
}
