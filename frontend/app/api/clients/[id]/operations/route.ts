import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError } from "@/lib/server-api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams(searchParams);

    const response = await proxyRequest(
      `/api/clients/${id}/operations?${queryParams}`,
      {
        next: { revalidate: 60 },
      }
    );

    const backendData = await response.json();
    
    // Transform backend response format
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

