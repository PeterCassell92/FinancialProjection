/**
 * API Tests for CSV Format Auto-Detection
 *
 * Tests the auto-detection mechanism in POST /api/transaction-records/check-csv-validity
 * When no dataFormatId is provided, the backend should auto-detect the format from CSV headers.
 *
 * IMPORTANT: Requires the Next.js dev server to be running
 */

import { apiClient } from '../utils/api-client';
import { buildCsvUploadFormData } from '../utils/csv-test-helpers';

describe('CSV Format Auto-Detection', () => {
  describe('POST /api/transaction-records/check-csv-validity (auto-detect)', () => {

    it('should auto-detect Halifax CSV format from headers', async () => {
      const formData = buildCsvUploadFormData('halifax-valid-5rows.csv');
      // No dataFormatId — should auto-detect

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.validityCheck).toBe('PASSED');
      expect(data.data?.detectedFormat).toBe('halifax_csv_v1');
    });

    it('should auto-detect Mettle CSV format from headers', async () => {
      const formData = buildCsvUploadFormData('mettle-valid-5rows.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.validityCheck).toBe('PASSED');
      expect(data.data?.detectedFormat).toBe('mettle_csv_v1');
    });

    it('should return error for unknown CSV format', async () => {
      const formData = buildCsvUploadFormData('unknown-format.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unable to detect CSV format');
    });

    it('should still work when dataFormatId is explicitly provided', async () => {
      const formData = buildCsvUploadFormData('halifax-valid-5rows.csv', 'halifax_csv_v1');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.validityCheck).toBe('PASSED');
    });

    it('should return error when file is missing', async () => {
      const formData = new FormData();
      // No file appended

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('file');
    });
  });
});
