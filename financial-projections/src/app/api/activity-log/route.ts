import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs, getRecentActivityLogs } from '@/lib/dal/activity-log';
import type { ActivityType, ActivityStatus } from '@prisma/client';

/**
 * GET /api/activity-log
 *
 * Retrieves activity logs with optional filtering
 *
 * Query parameters:
 * - userId: Filter by user ID (optional)
 * - activityType: Filter by activity type enum (optional)
 * - status: Filter by status enum (optional)
 * - startTimeFrom: Filter activities starting from this date (ISO string, optional)
 * - startTimeTo: Filter activities starting before this date (ISO string, optional)
 * - limit: Maximum number of results (default: 50, max: 200)
 * - offset: Number of results to skip for pagination (default: 0)
 * - recent: If 'true', return recent activities (ignores other filters except limit)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Check if requesting recent activities
    const isRecentRequest = searchParams.get('recent') === 'true';

    if (isRecentRequest) {
      const limit = Math.min(
        parseInt(searchParams.get('limit') || '50', 10),
        200
      );

      const activities = await getRecentActivityLogs(limit);

      return NextResponse.json({
        success: true,
        data: activities,
        count: activities.length,
      });
    }

    // Parse query parameters
    const userId = searchParams.get('userId') || undefined;
    const activityType = (searchParams.get('activityType') as ActivityType) || undefined;
    const status = (searchParams.get('status') as ActivityStatus) || undefined;
    const startTimeFromStr = searchParams.get('startTimeFrom');
    const startTimeToStr = searchParams.get('startTimeTo');
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50', 10),
      200
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Parse dates
    const startTimeFrom = startTimeFromStr ? new Date(startTimeFromStr) : undefined;
    const startTimeTo = startTimeToStr ? new Date(startTimeToStr) : undefined;

    // Validate dates
    if (startTimeFrom && isNaN(startTimeFrom.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid startTimeFrom date format',
        },
        { status: 400 }
      );
    }

    if (startTimeTo && isNaN(startTimeTo.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid startTimeTo date format',
        },
        { status: 400 }
      );
    }

    // Fetch activity logs
    const activities = await getActivityLogs({
      userId,
      activityType,
      status,
      startTimeFrom,
      startTimeTo,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: activities,
      count: activities.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activity logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
