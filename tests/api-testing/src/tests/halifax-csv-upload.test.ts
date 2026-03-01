/**
 * API Tests for Halifax CSV Validity Check & Upload
 *
 * Regression tests for the Halifax CSV upload pipeline:
 * 1. Validity check (preflight) — header validation, metadata extraction
 * 2. Full upload — transaction import, database insertion
 *
 * IMPORTANT: Requires the Next.js dev server to be running
 */

import { apiClient } from '../utils/api-client';
import { buildCsvUploadFormData } from '../utils/csv-test-helpers';

describe('Halifax CSV Upload', () => {

  describe('Validity Check - Valid CSVs', () => {

    it('should validate a valid 5-row Halifax CSV and return correct metadata', async () => {
      const formData = buildCsvUploadFormData('halifax-valid-5rows.csv', 'halifax_csv_v1');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.validityCheck).toBe('PASSED');
      expect(data.data?.accountNumber).toBe('12345678');
      expect(data.data?.sortCode).toBe('11-22-33');
      expect(data.data?.transactionCount).toBe(5);

      // Verify date range
      const earliest = new Date(data.data?.earliestDate);
      const latest = new Date(data.data?.latestDate);
      expect(earliest.getFullYear()).toBe(2026);
      expect(latest.getFullYear()).toBe(2026);
      expect(earliest <= latest).toBe(true);

      // Verify we get an upload operation ID
      expect(data.data?.uploadOperationId).toBeDefined();
      expect(typeof data.data?.uploadOperationId).toBe('string');
    });
  });

  describe('Validity Check - Invalid CSVs', () => {

    it('should reject CSV with malformed headers', async () => {
      const formData = buildCsvUploadFormData('halifax-malformed-headers.csv', 'halifax_csv_v1');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required headers');
    });

    it('should reject empty CSV (headers only, no data)', async () => {
      const formData = buildCsvUploadFormData('halifax-empty.csv', 'halifax_csv_v1');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('Full Upload Pipeline', () => {
    let uploadOperationId: string;

    it('should pass validity check for a valid Halifax CSV', async () => {
      const formData = buildCsvUploadFormData('halifax-valid-5rows.csv', 'halifax_csv_v1');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.uploadOperationId).toBeDefined();
      uploadOperationId = data.data!.uploadOperationId!;
    });

    it('should successfully upload after validity check passes', async () => {
      // This test depends on the previous test
      expect(uploadOperationId).toBeDefined();

      const { status, data } = await apiClient.post(
        '/api/transaction-records/upload-csv',
        {
          uploadOperationId,
          deleteOverlapping: true,
        }
      );

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.recordsImported).toBe(5);
      expect(data.data?.recordsFailed).toBe(0);
      expect(data.data?.bankAccountId).toBeDefined();
      expect(data.data?.bankAccountName).toBeDefined();
    });

    it('should reject upload with invalid uploadOperationId', async () => {
      const { status, data } = await apiClient.post(
        '/api/transaction-records/upload-csv',
        {
          uploadOperationId: 'nonexistent-id-12345',
        }
      );

      expect(status).toBe(404);
      expect(data.success).toBe(false);
    });
  });
});
