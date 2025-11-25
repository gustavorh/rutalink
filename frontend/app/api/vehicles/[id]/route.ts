import { NextRequest, NextResponse } from "next/server";
import { proxyRequest, handleApiError } from "@/lib/server-api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await proxyRequest(`/api/vehicles/${id}`, {
      next: { revalidate: 60 },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await proxyRequest(`/api/vehicles/${id}`, {
      method: "PUT",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await proxyRequest(`/api/vehicles/${id}`, {
      method: "DELETE",
    });

    const backendData = await response.json();
    return NextResponse.json(backendData, { status: response.status });
  } catch (error) {
    return handleApiError(error);
  }
}

