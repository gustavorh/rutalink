import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError } from "@/lib/server-api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyRequest("/api/operations/batch-upload", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const backendData = await response.json();

    if (backendData.success && backendData.data) {
      return NextResponse.json(backendData.data, { status: response.status });
    }

    return NextResponse.json(backendData, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

