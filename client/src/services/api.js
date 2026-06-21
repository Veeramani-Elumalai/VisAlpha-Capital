import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
});

// ── Request interceptor: attach token automatically ──────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 (session expired) ──────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all user data and redirect to login
      clearUserSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Session helpers ──────────────────────────────────────────────

/**
 * Store user info after login/register.
 * @param {{ id: string, name: string, email: string, picture?: string }} user
 */
export function storeUserSession(user) {
  localStorage.setItem("userId", user.id);
  localStorage.setItem("userName", user.name);
  if (user.picture) localStorage.setItem("userPicture", user.picture);
}

/**
 * Clear all user-specific localStorage data on logout.
 */
export function clearUserSession() {
  const userId = localStorage.getItem("userId");
  if (userId) {
    // Clear all cache keys for this user
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(userId)) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userPicture");
}

/**
 * Get the current userId from localStorage.
 */
export function getCurrentUserId() {
  return localStorage.getItem("userId");
}

export default api;
