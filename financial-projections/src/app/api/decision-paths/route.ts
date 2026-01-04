import { NextRequest, NextResponse } from 'next/server';
import {
  getAllDecisionPaths,
  createDecisionPath,
  getDecisionPathsWithUsage,
} from '@/lib/dal/decision-paths';
import { ApiResponse } from '@/types';

/**
 * GET /api/decision-paths
 * Get all decision paths with optional usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get('includeUsage') === 'true';

    let decisionPaths;
    if (includeUsage) {
      decisionPaths = await getDecisionPathsWithUsage();
    } else {
      decisionPaths = await getAllDecisionPaths();
    }

    const response: ApiResponse = {
      success: true,
      data: decisionPaths,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching decision paths:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch decision paths',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/decision-paths
 * Create a new decision path
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      const response: ApiResponse = {
        success: false,
        error: 'name is required and must be a string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const decisionPath = await createDecisionPath(
      body.name,
      body.description
    );

    const response: ApiResponse = {
      success: true,
      data: decisionPath,
      message: 'Decision path created successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating decision path:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create decision path',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
