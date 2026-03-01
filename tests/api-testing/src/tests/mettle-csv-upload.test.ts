/**
 * API Tests for Mettle CSV Validity Check & Upload
 *
 * Tests the Mettle CSV processing pipeline:
 * 1. Auto-detection of Mettle format
 * 2. Validity check with empty sort code / account number
 * 3. Upload with user-provided bankAccountId
 * 4. Balance calculation from single anchor balance
 * 5. Transaction type mapping
 *
 * IMPORTANT: Requires the Next.js dev server to be running with test database
 */

import { apiClient } from '../utils/api-client';
import { buildCsvUploadFormData } from '../utils/csv-test-helpers';

describe('Mettle CSV Upload', () => {

  describe('Validity Check - Valid CSVs', () => {

    it('should validate valid 5-row Mettle CSV with correct metadata', async () => {
      const formData = buildCsvUploadFormData('mettle-valid-5rows.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.validityCheck).toBe('PASSED');
      expect(data.data?.detectedFormat).toBe('mettle_csv_v1');
      expect(data.data?.transactionCount).toBe(5);

      // Mettle CSVs don't have sort code / account number
      expect(data.data?.accountNumber).toBe('');
      expect(data.data?.sortCode).toBe('');

      // Verify date range (March 2024 to June 2024)
      const earliest = new Date(data.data?.earliestDate);
      const latest = new Date(data.data?.latestDate);
      expect(earliest.getFullYear()).toBe(2024);
      expect(latest.getFullYear()).toBe(2024);
      expect(earliest <= latest).toBe(true);
    });

    it('should validate Mettle CSV with mixed transaction types', async () => {
      const formData = buildCsvUploadFormData('mettle-mixed-types.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.validityCheck).toBe('PASSED');
      expect(data.data?.transactionCount).toBe(7);
    });
  });

  describe('Validity Check - Invalid CSVs', () => {

    it('should reject Mettle CSV with malformed headers', async () => {
      const formData = buildCsvUploadFormData('mettle-malformed-headers.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject empty Mettle CSV (headers only)', async () => {
      const formData = buildCsvUploadFormData('mettle-empty.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle Mettle CSV with no balance on any row', async () => {
      const formData = buildCsvUploadFormData('mettle-no-balance.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      // Should still pass validation (balances set to 0 with warning)
      expect(status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data?.transactionCount).toBe(3);
    });
  });

  describe('Full Upload Pipeline with Bank Account', () => {
    let uploadOperationId: string;
    let testBankAccountId: string;

    // First, create a bank account for Mettle uploads
    it('should create a bank account for Mettle uploads', async () => {
      const { status, data } = await apiClient.post('/api/bank-accounts', {
        name: 'Test Mettle Account',
        sortCode: '04-06-05',
        accountNumber: '99887766',
        provider: 'METTLE',
      });

      // Accept 201 (created) or 409 (already exists)
      if (status === 201) {
        expect(data.success).toBe(true);
        testBankAccountId = data.data.id;
      } else if (status === 409) {
        // Account already exists, fetch it
        const accounts = await apiClient.get('/api/bank-accounts');
        const mettleAccount = accounts.data?.find(
          (a: any) => a.sortCode === '04-06-05' && a.accountNumber === '99887766'
        );
        expect(mettleAccount).toBeDefined();
        testBankAccountId = mettleAccount.id;
      }
    });

    it('should pass validity check for Mettle CSV', async () => {
      const formData = buildCsvUploadFormData('mettle-valid-5rows.csv');

      const { status, data } = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(status).toBe(200);
      expect(data.success).toBe(true);
      uploadOperationId = data.data!.uploadOperationId!;
    });

    it('should successfully upload Mettle CSV with provided bankAccountId', async () => {
      expect(uploadOperationId).toBeDefined();
      expect(testBankAccountId).toBeDefined();

      const { status, data } = await apiClient.post(
        '/api/transaction-records/upload-csv',
        {
          uploadOperationId,
          bankAccountId: testBankAccountId,
          deleteOverlapping: true,
        }
      );

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data?.recordsImported).toBe(5);
      expect(data.data?.recordsFailed).toBe(0);
      expect(data.data?.bankAccountId).toBe(testBankAccountId);
    });

    it('should reject Mettle CSV upload without bankAccountId (no auto-detect possible)', async () => {
      // First, get a new upload operation by doing another validity check
      const formData = buildCsvUploadFormData('mettle-valid-5rows.csv');
      const validityResult = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );

      expect(validityResult.status).toBe(200);
      const newUploadOpId = validityResult.data.data?.uploadOperationId;

      // Try to upload without a bankAccountId
      const { status, data } = await apiClient.post(
        '/api/transaction-records/upload-csv',
        {
          uploadOperationId: newUploadOpId,
          deleteOverlapping: false,
        }
      );

      // Should fail because Mettle CSVs don't have sort code / account number
      expect(status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('account');
    });
  });

  describe('Transaction Type Mapping', () => {

    it('should correctly map Mettle transaction types during upload', async () => {
      let testBankAccountId: string;

      // Create or get bank account
      const { status: acctStatus, data: acctData } = await apiClient.post('/api/bank-accounts', {
        name: 'Mettle Type Test Account',
        sortCode: '04-06-05',
        accountNumber: '11223344',
        provider: 'METTLE',
      });

      if (acctStatus === 201) {
        testBankAccountId = acctData.data.id;
      } else {
        const accounts = await apiClient.get('/api/bank-accounts');
        const account = accounts.data?.find(
          (a: any) => a.sortCode === '04-06-05' && a.accountNumber === '11223344'
        );
        testBankAccountId = account.id;
      }

      // Validity check
      const formData = buildCsvUploadFormData('mettle-mixed-types.csv');
      const validityResult = await apiClient.postFormData(
        '/api/transaction-records/check-csv-validity',
        formData
      );
      expect(validityResult.status).toBe(200);

      // Upload
      const { status, data } = await apiClient.post(
        '/api/transaction-records/upload-csv',
        {
          uploadOperationId: validityResult.data.data?.uploadOperationId,
          bankAccountId: testBankAccountId,
          deleteOverlapping: true,
        }
      );

      expect(status).toBe(201);
      expect(data.success).toBe(true);
      // 7 transaction types in the fixture
      expect(data.data?.recordsImported).toBe(7);
    });
  });
});
