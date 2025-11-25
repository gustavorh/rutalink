import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError } from "@/lib/server-api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams(searchParams);

    const response = await proxyRequest(`/api/drivers?${params}`, {
      next: { revalidate: 60 },
    });

    const backendData = await response.json();
    
    if (backendData.success && backendData.data) {
      return NextResponse.json({
        data: backendData.data.items || backendData.data,
        pagination: backendData.data.pagination || backendData.pagination,
      }, { status: response.status });
    }
    
    return NextResponse.json(backendData, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyRequest("/api/drivers", {
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

