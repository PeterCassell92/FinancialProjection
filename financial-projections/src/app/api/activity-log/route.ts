import defineRoute from '@omer-x/next-openapi-route-handler';
import { z } from 'zod';
import { getActivityLogs, getRecentActivityLogs } from '@/lib/dal/activity-log';
import type { ActivityType, ActivityStatus } from '@prisma/client';

/**
 * GET /api/activity-log
 * Retrieves activity logs with optional filtering
 */
export const { GET } = defineRoute({
  operationId: 'getActivityLogs',
  method: 'GET',
  summary: 'Get activity logs',
  description: 'Retrieves activity logs with optional filtering by user, activity type, status, date range, and pagination. Supports a "recent" mode for quick access to latest activities.',
  tags: ['Activity Log'],
  queryParams: z.object({
    userId: z.string().optional(),
    activityType: z.string().optional(),
    status: z.string().optional(),
    startTimeFrom: z.string().optional(),
    startTimeTo: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
    recent: z.string().optional(),
  }),
  action: async ({ queryParams }) => {
    try {
      // Check if requesting recent activities
      const isRecentRequest = queryParams?.recent === 'true';

      if (isRecentRequest) {
        const limit = Math.min(
          parseInt(queryParams?.limit || '50', 10),
          200
        );

        const activities = await getRecentActivityLogs(limit);

        return Response.json({
          success: true,
          data: activities,
          count: activities.length,
        });
      }

      // Parse query parameters
      const userId = queryParams?.userId || undefined;
      const activityType = (queryParams?.activityType as ActivityType) || undefined;
      const status = (queryParams?.status as ActivityStatus) || undefined;
      const startTimeFromStr = queryParams?.startTimeFrom;
      const startTimeToStr = queryParams?.startTimeTo;
      const limit = Math.min(
        parseInt(queryParams?.limit || '50', 10),
        200
      );
      const offset = parseInt(queryParams?.offset || '0', 10);

      // Parse dates
      const startTimeFrom = startTimeFromStr ? new Date(startTimeFromStr) : undefined;
      const startTimeTo = startTimeToStr ? new Date(startTimeToStr) : undefined;

      // Validate dates
      if (startTimeFrom && isNaN(startTimeFrom.getTime())) {
        return Response.json(
          {
            success: false,
            error: 'Invalid startTimeFrom date format',
          },
          { status: 400 }
        );
      }

      if (startTimeTo && isNaN(startTimeTo.getTime())) {
        return Response.json(
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

      return Response.json({
        success: true,
        data: activities,
        count: activities.length,
        limit,
        offset,
      });
    } catch (error: unknown) {
      console.error('Error fetching activity logs:', error);

      return Response.json(
        {
          success: false,
          error: 'Failed to fetch activity logs',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  },
  responses: {
    200: { description: 'Activity logs retrieved successfully' },
    400: { description: 'Invalid date format in query parameters' },
    500: { description: 'Server error' },
  },
});
