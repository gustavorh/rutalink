/**
 * Shared utilities for Next.js API routes
 * Provides common functions for authentication and backend communication
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Internal backend URL - only accessible from server
export const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

/**
 * Get authentication headers from cookies
 */
export async function getAuthHeaders(): Promise<{
  Authorization: string;
  "Content-Type": string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.error("API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/**
 * Proxy request to backend with authentication
 */
export async function proxyRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  const url = `${INTERNAL_API_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}
