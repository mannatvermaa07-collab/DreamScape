import { useUserStore } from './useUserStore';

export function useAuth() {
  const store = useUserStore();

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateAccountInfo: store.updateAccountInfo
  };
}
