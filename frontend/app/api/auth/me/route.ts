import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optionally verify token with backend
    // For now, we'll return user info from cookie
    const userInfo = cookieStore.get("user_info")?.value;

    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return NextResponse.json({ user });
      } catch {
        // If parsing fails, try to fetch from backend
      }
    }

    // Fetch user info from backend
    const response = await fetch(`${INTERNAL_API_URL}/api/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await response.json();
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

