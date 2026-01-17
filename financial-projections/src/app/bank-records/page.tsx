'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CSVUploadStepper from '@/components/CSVUploadStepper';

export default function BankRecordsPage() {
  const router = useRouter();

  const handleUploadComplete = () => {
    router.push('/bank-records/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800"
              data-testid="back-to-dashboard"
            >
              ← Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Import Bank Statement
          </h1>
          <p className="text-gray-600 mt-2">
            Upload your bank statement CSV file to import transaction records
          </p>
        </div>

        {/* Upload Stepper */}
        <CSVUploadStepper onComplete={handleUploadComplete} />

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <strong>Validity Check:</strong> Upload your CSV file and we'll verify it has the correct format
            </li>
            <li>
              <strong>Confirm:</strong> Review the account details and date range, and check for any overlapping records
            </li>
            <li>
              <strong>Upload:</strong> We'll import your transactions into the database
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-600">
              <strong>Supported Formats:</strong> Halifax CSV exports
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>Note:</strong> If you upload a CSV with dates that overlap existing records, those existing records
              will be deleted and replaced with the new data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
