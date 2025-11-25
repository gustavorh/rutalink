import { NextRequest, NextResponse } from "next/server";
import { handleApiError, getAuthHeaders, INTERNAL_API_URL } from "@/lib/server-api-utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const operatorId = formData.get("operatorId");

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    if (!operatorId) {
      return NextResponse.json(
        { error: "No se proporcionó el ID del operador" },
        { status: 400 }
      );
    }

    // Validate file type
    if (
      !file.type.includes("spreadsheet") &&
      !file.type.includes("excel") &&
      !file.name.endsWith(".xlsx")
    ) {
      return NextResponse.json(
        { error: "El archivo debe ser un archivo Excel (.xlsx)" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for backend
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for backend using native FormData (Node.js 18+)
    const backendFormData = new FormData();
    const blob = new Blob([buffer], {
      type: file.type || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    backendFormData.append("file", blob, file.name);
    backendFormData.append("operatorId", operatorId.toString());

    const headers = await getAuthHeaders();
    // Get the authorization header
    const authHeader = headers.Authorization as string;

    const response = await fetch(
      `${INTERNAL_API_URL}/api/operations/batch-upload/file`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: backendFormData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

