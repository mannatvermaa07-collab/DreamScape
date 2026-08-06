import { useEffect } from 'react';
import { useUserStore } from './useUserStore';
import { useLocalStorage } from './useLocalStorage';

export function useTheme() {
  const store = useUserStore();
  const [localTheme, setLocalTheme] = useLocalStorage('dreamscape_theme', 'light');

  const currentTheme = store.user?.settings?.theme || localTheme || 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (newTheme) => {
    setLocalTheme(newTheme);
    if (store.updateSettings) {
      store.updateSettings({ theme: newTheme });
    }
  };

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: currentTheme,
    setTheme,
    toggleTheme
  };
}
