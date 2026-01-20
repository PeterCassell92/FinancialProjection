import { EventType, CertaintyLevel } from '@prisma/client';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Settings types
export interface SettingsData {
  id: string;
  initialBankBalance: number;
  initialBalanceDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Projection Event types
export interface ProjectionEventData {
  id: string;
  name: string;
  description?: string;
  value: number;
  type: EventType;
  certainty: CertaintyLevel;
  payTo?: string;
  paidBy?: string;
  date: Date;
  decisionPath?: string;
  recurringRuleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Daily Balance types
export interface DailyBalanceData {
  id: string;
  date: Date;
  expectedBalance: number;
  actualBalance?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Chart data types
export interface MonthlyChartData {
  month: string;
  expenses: number;
  incoming: number;
}

export interface BalanceChartData {
  date: string;
  balance: number;
  isActual: boolean;
}

// Request body types for API routes
export interface CreateProjectionEventRequest {
  name: string;
  description?: string;
  value: number;
  type: EventType;
  certainty: CertaintyLevel;
  payTo?: string;
  paidBy?: string;
  date: string; // ISO date string
  decisionPath?: string;
}

export interface UpdateProjectionEventRequest {
  name?: string;
  description?: string;
  value?: number;
  type?: EventType;
  certainty?: CertaintyLevel;
  payTo?: string;
  paidBy?: string;
  date?: string;
  decisionPath?: string;
}

export interface SetActualBalanceRequest {
  date: string; // ISO date string
  actualBalance: number;
}

export interface CalculateBalancesRequest {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface UpdateSettingsRequest {
  initialBankBalance: number;
  initialBalanceDate?: string; // ISO date string, optional
}

// Transaction Record where clause types
export interface TransactionRecordDateFilter {
  gte?: Date;
  lte?: Date;
}

export interface TransactionRecordFullWhereClause {
  bankAccountId: string;
  transactionDate: TransactionRecordDateFilter;
  transactionDescription?: {
    contains: string;
    mode: 'insensitive';
  };
}

export type TransactionRecordWhereClause = Partial<TransactionRecordFullWhereClause> & {
  bankAccountId: string; // bankAccountId is always required
};
