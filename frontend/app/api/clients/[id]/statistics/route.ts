import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError } from "@/lib/server-api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await proxyRequest(`/api/clients/${id}/statistics`, {
      next: { revalidate: 300 }, // Cache statistics for 5 minutes
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

