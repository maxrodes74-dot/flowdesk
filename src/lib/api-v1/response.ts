import { NextResponse } from 'next/server';

/**
 * API v1 response helpers
 * All responses wrapped in { data: ... } for success or { error: string, details?: ... } for errors
 */

export interface SuccessResponse<T = unknown> {
  data: T;
}

export interface ErrorResponse {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Return a successful API response
 */
export function apiSuccess<T = unknown>(
  data: T,
  status = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Return an error API response
 */
export function apiError(
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  const response: ErrorResponse = { error: message };
  if (details !== undefined) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Return a paginated API response
 */
export function apiPaginatedResponse<T = unknown>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
}
