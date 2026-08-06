import { useState, useContext, createContext, useCallback } from 'react';

const USERS_DB_KEY = 'dreamscape_users_db';
const ACTIVE_EMAIL_KEY = 'dreamscape_active_email';

const DEFAULT_DEMO_USER = {
  name: 'Manat',
  age: 19,
  email: 'manat@gmail.com',
  password: 'password123',
  goals: [],
  habits: [],
  journals: [],
  calendarEvents: [],
  settings: {
    theme: 'light',
    notifications: true,
    timelineStart: '07:00',
    timelineEnd: '22:00'
  },
  chatbotHistory: [],
  moodHistory: [],
  tasks: [],
  customCategories: []
};

const DEFAULT_SETTINGS = { theme: 'light', notifications: true, timelineStart: '07:00', timelineEnd: '22:00' };

// Helper to read DB from localStorage
function getUsersDB() {
  try {
    const data = window.localStorage.getItem(USERS_DB_KEY);
    if (data) return JSON.parse(data);
    const initialDB = { [DEFAULT_DEMO_USER.email]: DEFAULT_DEMO_USER };
    window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(initialDB));
    return initialDB;
  } catch (error) {
    console.error('Error reading users DB:', error);
    return { [DEFAULT_DEMO_USER.email]: DEFAULT_DEMO_USER };
  }
}

// Helper to save DB to localStorage
function saveUsersDB(db) {
  try {
    window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error('Error saving users DB:', error);
  }
}

// Helper to get current email from localStorage
function getCurrentEmail() {
  return window.localStorage.getItem(ACTIVE_EMAIL_KEY) || DEFAULT_DEMO_USER.email;
}

// ---- React Context for shared state ----
const UserStoreContext = createContext(null);

export function UserStoreProvider({ children }) {
  const [usersDB, setUsersDBState] = useState(() => getUsersDB());
  const [activeEmail, setActiveEmailState] = useState(() => {
    return window.localStorage.getItem(ACTIVE_EMAIL_KEY) || DEFAULT_DEMO_USER.email;
  });

  const activeUser = usersDB[activeEmail] || {
    name: 'User',
    age: 20,
    email: activeEmail || DEFAULT_DEMO_USER.email,
    password: '',
    goals: [],
    habits: [],
    journals: [],
    calendarEvents: [],
    settings: { ...DEFAULT_SETTINGS },
    chatbotHistory: [],
    moodHistory: [],
    tasks: [],
    customCategories: []
  };

  // Generic helper to update the active user in the DB
  const updateActiveUser = useCallback((updater) => {
    setUsersDBState((prevDB) => {
      const email = getCurrentEmail();
      const current = prevDB[email] || activeUser;
      const updatedUser = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      const nextDB = { ...prevDB, [email]: updatedUser };
      saveUsersDB(nextDB);
      return nextDB;
    });
  }, []);

  // ──────────── Auth ────────────

  const login = useCallback((email, password) => {
    const db = getUsersDB();
    const targetEmail = email ? email.toLowerCase().trim() : DEFAULT_DEMO_USER.email;
    if (!db[targetEmail]) {
      db[targetEmail] = {
        name: targetEmail.split('@')[0] || 'User',
        age: 20,
        email: targetEmail,
        password: password || 'password',
        goals: [],
        habits: [],
        journals: [],
        calendarEvents: [],
        settings: { ...DEFAULT_SETTINGS },
        chatbotHistory: [],
        moodHistory: [],
        tasks: [],
        customCategories: []
      };
      saveUsersDB(db);
    }
    setUsersDBState(db);
    setActiveEmailState(targetEmail);
    window.localStorage.setItem(ACTIVE_EMAIL_KEY, targetEmail);
    return { success: true };
  }, []);

  const register = useCallback((name, age, email, password) => {
    const db = getUsersDB();
    const targetEmail = email ? email.toLowerCase().trim() : DEFAULT_DEMO_USER.email;
    const newUser = {
      name: name || 'User',
      age: Number(age) || 20,
      email: targetEmail,
      password: password || 'password',
      goals: [],
      habits: [],
      journals: [],
      calendarEvents: [],
      settings: { ...DEFAULT_SETTINGS },
      chatbotHistory: [],
      moodHistory: [],
      tasks: [],
      customCategories: [],
      hasCompletedProfile: true
    };
    db[targetEmail] = newUser;
    saveUsersDB(db);
    setUsersDBState(db);
    setActiveEmailState(targetEmail);
    window.localStorage.setItem(ACTIVE_EMAIL_KEY, targetEmail);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setActiveEmailState('');
    window.localStorage.removeItem(ACTIVE_EMAIL_KEY);
  }, []);

  const isAuthenticated = Boolean(activeEmail && usersDB[activeEmail]);

  const updateAccountInfo = useCallback((name, age, newEmail) => {
    updateActiveUser((user) => ({
      ...user,
      name: name || user.name,
      age: Number(age) || user.age,
      email: newEmail || user.email,
      hasCompletedProfile: true
    }));
  }, [updateActiveUser]);

  const updateSettings = useCallback((newSettings) => {
    updateActiveUser((user) => ({
      ...user,
      settings: { ...(user.settings || {}), ...newSettings }
    }));
  }, [updateActiveUser]);

  // ──────────── Goals CRUD ────────────

  const addGoal = useCallback((goalData) => {
    updateActiveUser((user) => {
      const newGoal = {
        id: `goal-${Date.now()}`,
        title: goalData.title,
        description: goalData.description || '',
        category: goalData.category || 'Engineering',
        progress: Number(goalData.progress) || 0,
        targetDate: goalData.targetDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0],
        completed: false
      };
      return { ...user, goals: [newGoal, ...(user.goals || [])] };
    });
  }, [updateActiveUser]);

  const updateGoal = useCallback((id, updates) => {
    updateActiveUser((user) => ({
      ...user,
      goals: (user.goals || []).map((g) =>
        g.id === id ? { ...g, ...updates } : g
      )
    }));
  }, [updateActiveUser]);

  const toggleGoal = useCallback((id) => {
    updateActiveUser((user) => ({
      ...user,
      goals: (user.goals || []).map((g) =>
        g.id === id ? { ...g, completed: !g.completed, progress: !g.completed ? 100 : g.progress } : g
      )
    }));
  }, [updateActiveUser]);

  const deleteGoal = useCallback((id) => {
    updateActiveUser((user) => ({
      ...user,
      goals: (user.goals || []).filter((g) => g.id !== id)
    }));
  }, [updateActiveUser]);

  // ──────────── Habits (To-Do) CRUD ────────────

  const addHabit = useCallback((habitData) => {
    updateActiveUser((user) => {
      const today = new Date();
      const newHabit = {
        id: `habit-${Date.now()}`,
        title: habitData.title,
        category: habitData.category || 'Productivity',
        timeOfDay: habitData.timeOfDay || 'Morning',
        streak: 0,
        bestStreak: 0,
        completedDays: [],
        createdAt: today.toISOString().split('T')[0]
      };
      return { ...user, habits: [newHabit, ...(user.habits || [])] };
    });
  }, [updateActiveUser]);

  const updateHabit = useCallback((id, updates) => {
    updateActiveUser((user) => ({
      ...user,
      habits: (user.habits || []).map((h) =>
        h.id === id ? { ...h, ...updates } : h
      )
    }));
  }, [updateActiveUser]);

  const deleteHabit = useCallback((id) => {
    updateActiveUser((user) => ({
      ...user,
      habits: (user.habits || []).filter((h) => h.id !== id)
    }));
  }, [updateActiveUser]);

  const toggleHabitDay = useCallback((id, dateStr) => {
    updateActiveUser((user) => {
      const habits = (user.habits || []).map((h) => {
        if (h.id !== id) return h;
        const days = h.completedDays || [];
        const alreadyDone = days.includes(dateStr);
        const newDays = alreadyDone
          ? days.filter((d) => d !== dateStr)
          : [...days, dateStr];

        // Recalculate streak
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          if (newDays.includes(ds)) {
            streak++;
          } else {
            break;
          }
        }

        return {
          ...h,
          completedDays: newDays,
          streak,
          bestStreak: Math.max(h.bestStreak || 0, streak)
        };
      });
      return { ...user, habits };
    });
  }, [updateActiveUser]);

  // ──────────── Journal CRUD ────────────

  const addJournal = useCallback((entryData) => {
    updateActiveUser((user) => {
      const now = new Date();
      const newEntry = {
        id: `journal-${Date.now()}`,
        title: entryData.title,
        content: entryData.content || '',
        mood: entryData.mood || 'Great',
        category: entryData.category || 'Engineering',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      return { ...user, journals: [newEntry, ...(user.journals || [])] };
    });
  }, [updateActiveUser]);

  const updateJournal = useCallback((id, updates) => {
    updateActiveUser((user) => ({
      ...user,
      journals: (user.journals || []).map((j) =>
        j.id === id ? { ...j, ...updates } : j
      )
    }));
  }, [updateActiveUser]);

  const deleteJournal = useCallback((id) => {
    updateActiveUser((user) => ({
      ...user,
      journals: (user.journals || []).filter((j) => j.id !== id)
    }));
  }, [updateActiveUser]);

  // ──────────── Timeline Slots ────────────

  const getTimelineSlots = useCallback(() => {
    const startStr = activeUser.settings?.timelineStart || '07:00';
    const endStr = activeUser.settings?.timelineEnd || '22:00';
    const startHour = parseInt(startStr.split(':')[0], 10) || 7;
    const endHour = parseInt(endStr.split(':')[0], 10) || 22;
    
    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots.length > 0 ? slots : ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
  }, [activeUser.settings?.timelineStart, activeUser.settings?.timelineEnd]);

  // ──────────── Context Value ────────────

  const value = {
    user: activeUser,
    isAuthenticated,
    login,
    register,
    logout,
    updateAccountInfo,
    updateSettings,
    updateActiveUser,
    getTimelineSlots,
    // Goals
    goals: activeUser.goals || [],
    addGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    // Habits (To-Do)
    habits: activeUser.habits || [],
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitDay,
    // Journal
    journals: activeUser.journals || [],
    addJournal,
    updateJournal,
    deleteJournal,
    // Misc
    tasks: activeUser.tasks || [],
    customCategories: activeUser.customCategories || []
  };

  return (
    <UserStoreContext.Provider value={value}>
      {children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore() {
  const context = useContext(UserStoreContext);
  if (!context) {
    throw new Error('useUserStore must be used within a UserStoreProvider');
  }
  return context;
}
