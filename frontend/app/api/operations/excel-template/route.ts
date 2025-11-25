import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError, getAuthHeaders, INTERNAL_API_URL } from "@/lib/server-api-utils";

export async function GET(request: NextRequest) {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${INTERNAL_API_URL}/api/operations/excel-template`, {
      method: "GET",
      headers: {
        ...headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(error, { status: response.status });
    }

    // Return blob for Excel file
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="plantilla-operaciones.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

