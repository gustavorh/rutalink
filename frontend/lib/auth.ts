/**
 * Authentication utilities for managing user session
 */

import { AuthResponse } from "./api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

/**
 * Store authentication data in localStorage
 */
export function storeAuth(authData: AuthResponse): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, authData.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
}

/**
 * Get stored token
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user data
 */
export function getUser(): AuthResponse["user"] | null {
  if (typeof window === "undefined") return null;

  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Clear authentication data
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Logout user
 */
export function logout(): void {
  clearAuth();
  window.location.href = "/login";
}
