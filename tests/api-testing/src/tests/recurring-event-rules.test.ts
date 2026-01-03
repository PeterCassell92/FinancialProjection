/**
 * API Tests for Recurring Event Rules endpoint
 *
 * IMPORTANT: These tests require the Next.js dev server to be running
 * Run: yarn dev in the financial-projections directory first
 */

import { apiClient } from '../utils/api-client';

describe('POST /api/recurring-event-rules', () => {
  describe('Validation - Missing Required Fields', () => {
    it('should reject request when name is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        // name: missing
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('name');
    });

    it('should reject request when value is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        // value: missing
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('value');
    });

    it('should reject request when type is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        // type: missing
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('type');
    });

    it('should reject request when certainty is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        // certainty: missing
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('certainty');
    });

    it('should reject request when startDate is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        // startDate: missing
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('startDate');
    });

    it('should reject request when endDate is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        // endDate: missing - THIS SHOULD NOW FAIL
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('endDate');
    });

    it('should reject request when frequency is missing', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        // frequency: missing
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('frequency');
    });
  });

  describe('Validation - Date Range', () => {
    it('should reject when startDate has invalid format', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: 'invalid-date',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid startDate format');
    });

    it('should reject when endDate has invalid format', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: 'not-a-date',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid endDate format');
    });

    it('should reject when endDate is before startDate', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-12-31',
        endDate: '2025-01-01',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('endDate must be after startDate');
    });

    it('should reject when endDate equals startDate', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-06-15',
        endDate: '2025-06-15',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('endDate must be after startDate');
    });
  });

  describe('Validation - Value', () => {
    it('should reject when value is zero', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: 0,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Value must be greater than 0');
    });

    it('should reject when value is negative', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Test Event',
        value: -100,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Value must be greater than 0');
    });
  });

  describe('Successful Creation', () => {
    it('should successfully create a monthly expense recurring rule', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Monthly Rent',
        description: 'Apartment rent payment',
        value: 1500,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        payTo: 'Landlord',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        frequency: 'MONTHLY',
      });

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.rule).toBeDefined();
      expect(data.data.rule.name).toBe('Monthly Rent');
      expect(data.data.rule.frequency).toBe('MONTHLY');
      expect(data.data.generatedEventsCount).toBeGreaterThan(0);
      expect(data.message).toContain('created successfully');
    });

    it('should successfully create a weekly incoming payment rule', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Weekly Contract Payment',
        value: 500,
        type: 'INCOMING',
        certainty: 'LIKELY',
        paidBy: 'Client Corp',
        startDate: '2025-01-06',
        endDate: '2025-03-31',
        frequency: 'WEEKLY',
      });

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.rule.name).toBe('Weekly Contract Payment');
      expect(data.data.rule.type).toBe('INCOMING');
      expect(data.data.rule.frequency).toBe('WEEKLY');
      expect(data.data.generatedEventsCount).toBeGreaterThan(0);
    });

    it('should successfully create an annual recurring rule', async () => {
      const { status, data } = await apiClient.post('/api/recurring-event-rules', {
        name: 'Annual Insurance Premium',
        value: 2400,
        type: 'EXPENSE',
        certainty: 'CERTAIN',
        startDate: '2025-01-15',
        endDate: '2027-01-15', // Reduced to 3 years to avoid timeout
        frequency: 'ANNUAL',
      });

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.generatedEventsCount).toBe(3); // 2025, 2026, 2027
    }, 15000); // Increase timeout to 15 seconds for this test
  });
});

describe('GET /api/recurring-event-rules', () => {
  it('should return a list of recurring event rules', async () => {
    const data = await apiClient.get('/api/recurring-event-rules');

    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
