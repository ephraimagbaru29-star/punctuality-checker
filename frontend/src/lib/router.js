import { writable, get } from 'svelte/store';

export const currentPath = writable(window.location.pathname + window.location.search);

// Navigate programmatically
export const navigate = (path) => {
  window.history.pushState({}, '', path);
  currentPath.set(window.location.pathname + window.location.search);
};

// Handle browser back/forward
window.addEventListener('popstate', () => {
  currentPath.set(window.location.pathname + window.location.search);
});

// Match a route pattern to the current path
// Supports exact paths like '/admin/dashboard'
export const matchRoute = (pattern, path) => {
  // Strip query string for matching
  const cleanPath = path.split('?')[0];
  return cleanPath === pattern;
};
