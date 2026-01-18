'use client';

import { useState, useEffect, useRef } from 'react';
import { defineStepper } from '@stepperize/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

const { Scoped, useStepper } = defineStepper(
  { id: 'validity', title: 'Validity Check' },
  { id: 'confirm', title: 'Confirm' },
  { id: 'upload', title: 'Upload' }
);

interface CSVUploadStepperProps {
  onComplete: () => void;
}

export default function CSVUploadStepper({ onComplete }: CSVUploadStepperProps) {
  return (
    <Scoped>
      <StepperContent onComplete={onComplete} />
    </Scoped>
  );
}

function StepperContent({ onComplete }: CSVUploadStepperProps) {
  const stepper = useStepper();
  const [uploadOperationId, setUploadOperationId] = useState<string | null>(null);
  const [validityData, setValidityData] = useState<any>(null);
  const [overlapData, setOverlapData] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {stepper.all.map((step, index) => {
          const isActive = stepper.current.id === step.id;
          const isCompleted = stepper.all.findIndex(s => s.id === step.id) < stepper.all.findIndex(s => s.id === stepper.current.id);
          const isLast = index === stepper.all.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <StepIndicator
                  title={step.title}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  index={index + 1}
                />
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {stepper.switch({
        validity: () => (
          <ValidityCheckStep
            onSuccess={(data) => {
              setUploadOperationId(data.uploadOperationId);
              setValidityData(data);
              stepper.next();
            }}
          />
        ),
        confirm: () => (
          <ConfirmStep
            uploadOperationId={uploadOperationId!}
            validityData={validityData}
            onSuccess={(data) => {
              setOverlapData(data);
              stepper.next();
            }}
            onBack={() => {
              setUploadOperationId(null);
              setValidityData(null);
              stepper.reset();
            }}
          />
        ),
        upload: () => (
          <UploadStep
            uploadOperationId={uploadOperationId!}
            overlapData={overlapData}
            onSuccess={onComplete}
            onBack={() => {
              stepper.prev();
            }}
          />
        ),
      })}
    </div>
  );
}

interface StepIndicatorProps {
  title: string;
  isActive: boolean;
  isCompleted: boolean;
  index: number;
}

function StepIndicator({ title, isActive, isCompleted, index }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
          isCompleted
            ? 'border-green-500 bg-green-50'
            : isActive
            ? 'border-blue-500 bg-blue-500'
            : 'border-gray-300 bg-white'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        ) : isActive ? (
          <span className="text-white font-semibold">{index}</span>
        ) : (
          <span className="text-gray-400">{index}</span>
        )}
      </div>
      <div
        className={`text-sm font-medium ${
          isActive ? 'text-gray-900' : isCompleted ? 'text-green-700' : 'text-gray-500'
        }`}
      >
        {title}
      </div>
    </div>
  );
}

interface ValidityCheckStepProps {
  onSuccess: (data: any) => void;
}

function ValidityCheckStep({ onSuccess }: ValidityCheckStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleCheck = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dataFormatId', 'halifax_csv_v1');

      const response = await fetch('/api/transaction-records/check-csv-validity', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.data);
      } else {
        setError(data.error || 'Validation failed');
      }
    } catch (err) {
      setError('Failed to check CSV validity. Please try again.');
      console.error('Validity check error:', err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={checking}
            data-testid="csv-file-input"
          />
          <p className="text-sm text-gray-500">
            Currently supports Halifax CSV format. Max file size: 10MB
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleCheck}
            disabled={!selectedFile || checking}
            className="flex-1"
            data-testid="check-validity-button"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking Validity...
              </>
            ) : (
              'Check Validity'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmStepProps {
  uploadOperationId: string;
  validityData: any;
  onSuccess: (data: any) => void;
  onBack: () => void;
}

function ConfirmStep({ uploadOperationId, validityData, onSuccess, onBack }: ConfirmStepProps) {
  const [checking, setChecking] = useState(true);
  const [overlapData, setOverlapData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  // Check for date overlap on mount
  useEffect(() => {
    // Prevent duplicate checks (especially in StrictMode)
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkOverlap = async () => {
      try {
        const response = await fetch('/api/transaction-records/check-date-overlap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadOperationId }),
        });

        const data = await response.json();

        if (data.success) {
          setOverlapData(data.data);
        } else {
          setError(data.error || 'Failed to check date overlap');
        }
      } catch (err) {
        setError('Failed to check date overlap. Please try again.');
        console.error('Overlap check error:', err);
      } finally {
        setChecking(false);
      }
    };

    checkOverlap();
  }, [uploadOperationId]); // Add dependency array to prevent re-runs

  const handleContinue = () => {
    onSuccess(overlapData);
  };

  if (checking) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-700">Checking for existing records...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
        <Button onClick={onBack} variant="outline">
          Back to Start
        </Button>
      </div>
    );
  }

  const hasOverlap = overlapData?.hasOverlap;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Upload</h2>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Account Number:</span>
            <span className="text-sm font-medium">{validityData.accountNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Sort Code:</span>
            <span className="text-sm font-medium">{validityData.sortCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Date Range:</span>
            <span className="text-sm font-medium">
              {new Date(validityData.earliestDate).toLocaleDateString()} -{' '}
              {new Date(validityData.latestDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Transactions:</span>
            <span className="text-sm font-medium">{validityData.transactionCount}</span>
          </div>
        </div>

        {hasOverlap ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-orange-900 font-medium mb-1">Existing Records Found</p>
              <p className="text-orange-800">
                Uploading Transaction Records across this date range will delete the existing{' '}
                {overlapData.overlappingRecordCount} transaction record(s) on these days in this account.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 text-sm">No conflicts detected. Ready to upload!</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back to Start
        </Button>
        <Button
          onClick={handleContinue}
          className={`flex-1 ${hasOverlap ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
        >
          {hasOverlap ? 'Continue Upload and Overwrite' : 'Continue Upload'}
        </Button>
      </div>
    </div>
  );
}

interface UploadStepProps {
  uploadOperationId: string;
  overlapData: any;
  onSuccess: () => void;
  onBack: () => void;
}

function UploadStep({ uploadOperationId, overlapData, onSuccess, onBack }: UploadStepProps) {
  const [uploading, setUploading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const hasUploadedRef = useRef(false);

  // Start upload on mount
  useEffect(() => {
    // Prevent duplicate uploads (especially in StrictMode)
    if (hasUploadedRef.current) return;
    hasUploadedRef.current = true;

    const doUpload = async () => {
      try {
        const response = await fetch('/api/transaction-records/upload-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadOperationId,
            deleteOverlapping: overlapData?.hasOverlap || false,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.error || 'Upload failed');
        }
      } catch (err) {
        setError('Failed to upload CSV. Please try again.');
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    };

    doUpload();
  }, [uploadOperationId, overlapData]); // Add dependency array to prevent re-runs

  if (uploading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Upload...</h3>
          <p className="text-sm text-gray-600">Please wait while we import your transactions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium mb-1">Upload Failed</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
        <Button onClick={onBack} variant="outline">
          Back to Start
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Upload Complete!</h3>
          <p className="text-sm text-gray-600">Your transactions have been imported successfully</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Records Imported:</span>
          <span className="text-sm font-medium text-green-600">{result.recordsImported}</span>
        </div>
        {result.recordsFailed > 0 && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Records Failed:</span>
            <span className="text-sm font-medium text-red-600">{result.recordsFailed}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Bank Account:</span>
          <span className="text-sm font-medium">{result.bankAccountName}</span>
        </div>
      </div>

      <Button onClick={onSuccess} className="w-full">
        View Transaction Records
      </Button>
    </div>
  );
}
