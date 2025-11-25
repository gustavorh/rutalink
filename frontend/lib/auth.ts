/**
 * Authentication utilities for managing user session
 * Now uses HTTP-only cookies instead of localStorage for security
 */

/**
 * Get stored user data from cookie (non-sensitive info)
 */
export function getUser(): any | null {
  if (typeof window === "undefined") return null;

  // Try to get user info from cookie
  const cookies = document.cookie.split(";");
  const userCookie = cookies.find((c) => c.trim().startsWith("user_info="));

  if (!userCookie) return null;

  try {
    const userData = decodeURIComponent(userCookie.split("=")[1]);
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * Note: Token is now in HTTP-only cookie, so we check user_info cookie
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const cookies = document.cookie.split(";");
  return cookies.some((c) => c.trim().startsWith("user_info="));
}

/**
 * Logout user - calls API to clear cookies
 */
export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  window.location.href = "/login";
}

/**
 * Clear authentication data (legacy support)
 * @deprecated Use logout() instead
 */
export function clearAuth(): void {
  logout();
}
