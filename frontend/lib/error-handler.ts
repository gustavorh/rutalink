/**
 * Global error handler utilities
 */

import { ApiError } from "./api";
import { clearAuth } from "./auth";

/**
 * Handle API errors globally
 * This function should be called in catch blocks throughout the app
 */
export function handleApiError(error: unknown): void {
  if (error instanceof ApiError) {
    // Session expired or unauthorized
    if (error.status === 401) {
      handleSessionExpired();
      return;
    }

    // Log other API errors
    console.error(`API Error (${error.status}):`, error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}

/**
 * Handle session expiration
 * Clears auth data and redirects to login
 */
export function handleSessionExpired(): void {
  if (typeof window === "undefined") return;

  clearAuth();

  // Store the current path to redirect back after login
  const currentPath = window.location.pathname;
  if (currentPath !== "/login" && currentPath !== "/register") {
    sessionStorage.setItem("redirectAfterLogin", currentPath);
  }

  window.location.href = "/login";
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Don't show session expired message since we're redirecting
    if (error.status === 401) {
      return "Redirecting to login...";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}
