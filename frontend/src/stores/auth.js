import { writable, derived } from 'svelte/store';

const stored = (() => {
  try {
    const raw = localStorage.getItem('pc_auth');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
})();

export const authStore = writable(stored);

// Persist to localStorage whenever store changes
authStore.subscribe((val) => {
  try {
    if (val) localStorage.setItem('pc_auth', JSON.stringify(val));
    else localStorage.removeItem('pc_auth');
  } catch {}
});

export const isAuthenticated = derived(authStore, ($auth) => !!$auth?.token);
export const currentUser     = derived(authStore, ($auth) => $auth?.user || null);
export const isAdmin         = derived(authStore, ($auth) => $auth?.user?.role === 'admin');
export const isStudent       = derived(authStore, ($auth) => $auth?.user?.role === 'student');

export const login = (token, user) => authStore.set({ token, user });
export const logout = () => authStore.set(null);
