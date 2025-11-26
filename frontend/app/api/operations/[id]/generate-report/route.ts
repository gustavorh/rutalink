import { NextRequest, NextResponse } from "next/server";
import { handleApiError, getAuthHeaders, INTERNAL_API_URL } from "@/lib/server-api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = await getAuthHeaders();
    const body = await request.json();

    const response = await fetch(`${INTERNAL_API_URL}/api/operations/${id}/generate-report`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    // Return blob for PDF
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

