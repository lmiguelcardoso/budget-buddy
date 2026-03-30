import { NextResponse } from "next/server";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  error: string | null;
}

export function ok<T>(data: T, message = "Success"): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, message, data, error: null });
}

export function badRequest(error: string): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, message: "Bad Request", data: null, error },
    { status: 400 }
  );
}

export function notFound(error = "Not found"): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, message: "Not Found", data: null, error },
    { status: 404 }
  );
}

export function serverError(
  error = "Internal server error"
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, message: "Internal Server Error", data: null, error },
    { status: 500 }
  );
}
