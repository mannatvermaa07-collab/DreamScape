import { useUserStore } from './useUserStore';

export function useJournal() {
  const store = useUserStore();

  return {
    entries: store.journals,
    addEntry: store.addJournal,
    updateEntry: store.updateJournal,
    deleteEntry: store.deleteJournal
  };
}
