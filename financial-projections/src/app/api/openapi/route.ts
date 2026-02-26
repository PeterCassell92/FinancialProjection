import generateOpenApiSpec from '@omer-x/next-openapi-json-generator';
import { cleanSchemas } from '@/lib/openapi-utils';
import {
  // Bank Accounts
  BankAccountDataSchema,
  BankAccountsGetResponseSchema,
  BankAccountCreateRequestSchema,
  BankAccountCreateResponseSchema,
  BankAccountGetResponseSchema,
  BankAccountUpdateRequestSchema,
  BankAccountUpdateResponseSchema,
  BankAccountDeleteResponseSchema,
  // Settings
  SettingsGetResponseSchema,
  SettingsPutRequestSchema,
  SettingsPutResponseSchema,
  SettingsPatchRequestSchema,
  SettingsPatchResponseSchema,
  // Spending Types
  SpendingTypesGetResponseSchema,
  SpendingTypeCreateRequestSchema,
  SpendingTypeCreateResponseSchema,
  SpendingTypeGetResponseSchema,
  SpendingTypeUpdateRequestSchema,
  SpendingTypeUpdateResponseSchema,
  SpendingTypeDeleteResponseSchema,
  // Decision Paths
  DecisionPathsGetResponseSchema,
  DecisionPathCreateRequestSchema,
  DecisionPathCreateResponseSchema,
  DecisionPathGetResponseSchema,
  DecisionPathUpdateRequestSchema,
  DecisionPathUpdateResponseSchema,
  DecisionPathDeleteResponseSchema,
  // Daily Balance
  DailyBalancesGetResponseSchema,
  DailyBalanceSetActualRequestSchema,
  DailyBalanceSetActualResponseSchema,
  DailyBalanceClearActualResponseSchema,
  // Calculate & Compute Balances
  CalculateBalancesRequestSchema,
  CalculateBalancesResponseSchema,
  ComputeBalancesRequestSchema,
  ComputeBalancesResponseSchema,
  // Projection Events
  ProjectionEventsGetResponseSchema,
  ProjectionEventCreateRequestSchema,
  ProjectionEventCreateResponseSchema,
  ProjectionEventGetResponseSchema,
  ProjectionEventUpdateRequestSchema,
  ProjectionEventPutResponseSchema,
  ProjectionEventDeleteResponseSchema,
  // Recurring Event Rules
  RecurringEventRulesGetResponseSchema,
  RecurringEventRuleCreateRequestSchema,
  RecurringEventRuleCreateResponseSchema,
  RecurringEventRuleGetResponseSchema,
  RecurringEventRuleUpdateRequestSchema,
  RecurringEventRuleUpdateResponseSchema,
  RecurringEventRuleDeleteResponseSchema,
  RecurringEventRuleRevisionCreateRequestSchema,
  RecurringEventRuleRevisionCreateResponseSchema,
  // Scenario Sets
  ScenarioSetsGetResponseSchema,
  ScenarioSetCreateRequestSchema,
  ScenarioSetCreateResponseSchema,
  ScenarioSetGetResponseSchema,
  ScenarioSetUpdateRequestSchema,
  ScenarioSetUpdateResponseSchema,
  ScenarioSetDeleteResponseSchema,
  // Transaction Records
  TransactionRecordsGetResponseSchema,
  TransactionRecordUpdateRequestSchema,
  TransactionRecordUpdateResponseSchema,
  TransactionRecordDeleteResponseSchema,
  TransactionRecordsBulkDeleteResponseSchema,
  CsvValidityCheckResponseSchema,
  CsvUploadResponseSchema,
  DateOverlapCheckResponseSchema,
  // Transaction Coverage
  TransactionCoverageResponseSchema,
} from '@/lib/schemas';

/**
 * GET /api/openapi
 * Generate and return the OpenAPI 3.1.0 specification.
 * Only routes using defineRoute are included; standard handlers are skipped.
 *
 * Usage:
 *   curl http://localhost:3000/api/openapi | jq . > openapi.json
 */
export async function GET() {
  const spec = await generateOpenApiSpec(
    // Keys MUST match the exact variable names used in route files.
    // The generator strips imports and replaces these names with $ref strings.
    cleanSchemas({
      // Bank Accounts
      BankAccountDataSchema,
      BankAccountsGetResponseSchema,
      BankAccountCreateRequestSchema,
      BankAccountCreateResponseSchema,
      BankAccountGetResponseSchema,
      BankAccountUpdateRequestSchema,
      BankAccountUpdateResponseSchema,
      BankAccountDeleteResponseSchema,
      // Settings
      SettingsGetResponseSchema,
      SettingsPutRequestSchema,
      SettingsPutResponseSchema,
      SettingsPatchRequestSchema,
      SettingsPatchResponseSchema,
      // Spending Types
      SpendingTypesGetResponseSchema,
      SpendingTypeCreateRequestSchema,
      SpendingTypeCreateResponseSchema,
      SpendingTypeGetResponseSchema,
      SpendingTypeUpdateRequestSchema,
      SpendingTypeUpdateResponseSchema,
      SpendingTypeDeleteResponseSchema,
      // Decision Paths
      DecisionPathsGetResponseSchema,
      DecisionPathCreateRequestSchema,
      DecisionPathCreateResponseSchema,
      DecisionPathGetResponseSchema,
      DecisionPathUpdateRequestSchema,
      DecisionPathUpdateResponseSchema,
      DecisionPathDeleteResponseSchema,
      // Daily Balance
      DailyBalancesGetResponseSchema,
      DailyBalanceSetActualRequestSchema,
      DailyBalanceSetActualResponseSchema,
      DailyBalanceClearActualResponseSchema,
      // Calculate & Compute Balances
      CalculateBalancesRequestSchema,
      CalculateBalancesResponseSchema,
      ComputeBalancesRequestSchema,
      ComputeBalancesResponseSchema,
      // Projection Events
      ProjectionEventsGetResponseSchema,
      ProjectionEventCreateRequestSchema,
      ProjectionEventCreateResponseSchema,
      ProjectionEventGetResponseSchema,
      ProjectionEventUpdateRequestSchema,
      ProjectionEventPutResponseSchema,
      ProjectionEventDeleteResponseSchema,
      // Recurring Event Rules
      RecurringEventRulesGetResponseSchema,
      RecurringEventRuleCreateRequestSchema,
      RecurringEventRuleCreateResponseSchema,
      RecurringEventRuleGetResponseSchema,
      RecurringEventRuleUpdateRequestSchema,
      RecurringEventRuleUpdateResponseSchema,
      RecurringEventRuleDeleteResponseSchema,
      RecurringEventRuleRevisionCreateRequestSchema,
      RecurringEventRuleRevisionCreateResponseSchema,
      // Scenario Sets
      ScenarioSetsGetResponseSchema,
      ScenarioSetCreateRequestSchema,
      ScenarioSetCreateResponseSchema,
      ScenarioSetGetResponseSchema,
      ScenarioSetUpdateRequestSchema,
      ScenarioSetUpdateResponseSchema,
      ScenarioSetDeleteResponseSchema,
      // Transaction Records
      TransactionRecordsGetResponseSchema,
      TransactionRecordUpdateRequestSchema,
      TransactionRecordUpdateResponseSchema,
      TransactionRecordDeleteResponseSchema,
      TransactionRecordsBulkDeleteResponseSchema,
      CsvValidityCheckResponseSchema,
      CsvUploadResponseSchema,
      DateOverlapCheckResponseSchema,
      // Transaction Coverage
      TransactionCoverageResponseSchema,
    }),
    {
      info: {
        title: 'Financial Projections API',
        version: '0.1.0',
        description: 'API for the Financial Projections application',
      },
      servers: [{ url: 'http://localhost:3000' }],
    }
  );

  return Response.json(spec);
}
