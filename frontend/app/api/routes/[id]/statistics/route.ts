import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError } from "@/lib/server-api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await proxyRequest(`/api/routes/${id}/statistics`, {
      next: { revalidate: 300 },
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

