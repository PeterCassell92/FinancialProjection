'use client';

import { useState, useEffect, useRef } from 'react';
import { defineStepper } from '@stepperize/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Plus } from 'lucide-react';

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
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);

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
            onSuccess={(data, bankAccountId) => {
              setOverlapData(data);
              setSelectedBankAccountId(bankAccountId || null);
              stepper.next();
            }}
            onBack={() => {
              setUploadOperationId(null);
              setValidityData(null);
              setSelectedBankAccountId(null);
              stepper.reset();
            }}
          />
        ),
        upload: () => (
          <UploadStep
            uploadOperationId={uploadOperationId!}
            overlapData={overlapData}
            bankAccountId={selectedBankAccountId}
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
      // No dataFormatId — let backend auto-detect

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
            Supports Halifax and Mettle CSV formats. Format is auto-detected. Max file size: 10MB
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

interface BankAccount {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  provider: string;
}

interface ConfirmStepProps {
  uploadOperationId: string;
  validityData: any;
  onSuccess: (data: any, bankAccountId?: string) => void;
  onBack: () => void;
}

function ConfirmStep({ uploadOperationId, validityData, onSuccess, onBack }: ConfirmStepProps) {
  const hasAccountInfo = validityData.accountNumber && validityData.sortCode;

  const [checking, setChecking] = useState(hasAccountInfo);
  const [overlapData, setOverlapData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  // Account selection state (for formats without account identifiers)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(!hasAccountInfo);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newSortCode, setNewSortCode] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountReady, setAccountReady] = useState(hasAccountInfo);

  // Fetch bank accounts for selection (when account info not in CSV)
  useEffect(() => {
    if (hasAccountInfo) return;

    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/bank-accounts');
        const data = await response.json();
        if (data.success && data.data) {
          setBankAccounts(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch bank accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [hasAccountInfo]);

  // Check for date overlap when account is ready
  useEffect(() => {
    if (!accountReady) return;
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkOverlap = async () => {
      setChecking(true);
      try {
        const body: any = { uploadOperationId };
        if (selectedAccountId) {
          body.bankAccountId = selectedAccountId;
        }

        const response = await fetch('/api/transaction-records/check-date-overlap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
  }, [accountReady, uploadOperationId, selectedAccountId]);

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    setShowNewAccountForm(false);
    setAccountReady(true);
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim() || !newSortCode.trim() || !newAccountNumber.trim()) {
      setError('Please fill in all account fields');
      return;
    }

    setCreatingAccount(true);
    setError(null);

    try {
      const response = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccountName.trim(),
          sortCode: newSortCode.trim(),
          accountNumber: newAccountNumber.trim(),
          provider: 'METTLE',
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setSelectedAccountId(data.data.id);
        setBankAccounts(prev => [data.data, ...prev]);
        setShowNewAccountForm(false);
        setAccountReady(true);
      } else {
        setError(data.error || 'Failed to create bank account');
      }
    } catch (err) {
      setError('Failed to create bank account. Please try again.');
      console.error('Account creation error:', err);
    } finally {
      setCreatingAccount(false);
    }
  };

  const handleContinue = () => {
    onSuccess(overlapData, selectedAccountId || undefined);
  };

  // Show account selection UI when account info is missing
  if (!hasAccountInfo && !accountReady) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Bank Account</h2>

        {validityData.detectedFormat && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              Detected format: <span className="font-medium">{validityData.detectedFormat}</span>.
              This format does not include account identifiers. Please select or create a bank account.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* CSV Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
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

        {loadingAccounts ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading accounts...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Existing accounts */}
            {bankAccounts.length > 0 && (
              <div className="space-y-2">
                <Label>Select an existing account</Label>
                {bankAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSelectAccount(account.id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                    data-testid={`select-account-${account.id}`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{account.name}</p>
                      <p className="text-sm text-gray-500">
                        {account.sortCode} / {account.accountNumber}
                      </p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {account.provider}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            {bankAccounts.length > 0 && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* New account form */}
            {!showNewAccountForm ? (
              <Button
                onClick={() => setShowNewAccountForm(true)}
                variant="outline"
                className="w-full"
                data-testid="add-new-account-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Account
              </Button>
            ) : (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900">New Bank Account</h3>
                <div className="space-y-2">
                  <Label htmlFor="new-account-name">Account Name</Label>
                  <Input
                    id="new-account-name"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="e.g. Mettle Business Account"
                    data-testid="new-account-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-sort-code">Sort Code</Label>
                    <Input
                      id="new-sort-code"
                      value={newSortCode}
                      onChange={(e) => setNewSortCode(e.target.value)}
                      placeholder="e.g. 04-06-05"
                      data-testid="new-sort-code-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-account-number">Account Number</Label>
                    <Input
                      id="new-account-number"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="e.g. 12345678"
                      data-testid="new-account-number-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowNewAccountForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAccount}
                    disabled={creatingAccount || !newAccountName.trim() || !newSortCode.trim() || !newAccountNumber.trim()}
                    className="flex-1"
                    data-testid="create-account-button"
                  >
                    {creatingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create & Select'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <Button onClick={onBack} variant="outline" className="w-full">
            Back to Start
          </Button>
        </div>
      </div>
    );
  }

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
          {validityData.detectedFormat && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Detected Format:</span>
              <span className="text-sm font-medium">{validityData.detectedFormat}</span>
            </div>
          )}
          {hasAccountInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Account Number:</span>
                <span className="text-sm font-medium">{validityData.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sort Code:</span>
                <span className="text-sm font-medium">{validityData.sortCode}</span>
              </div>
            </>
          )}
          {!hasAccountInfo && selectedAccountId && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bank Account:</span>
              <span className="text-sm font-medium">
                {bankAccounts.find(a => a.id === selectedAccountId)?.name || 'Selected'}
              </span>
            </div>
          )}
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
  bankAccountId: string | null;
  onSuccess: () => void;
  onBack: () => void;
}

function UploadStep({ uploadOperationId, overlapData, bankAccountId, onSuccess, onBack }: UploadStepProps) {
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
        const body: any = {
          uploadOperationId,
          deleteOverlapping: overlapData?.hasOverlap || false,
        };
        if (bankAccountId) {
          body.bankAccountId = bankAccountId;
        }

        const response = await fetch('/api/transaction-records/upload-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
  }, [uploadOperationId, overlapData, bankAccountId]);

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
