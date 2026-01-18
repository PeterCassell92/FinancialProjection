/**
 * Test Environment Seed Data
 *
 * This script creates realistic test data for the Financial Projections app.
 * It includes:
 * - Settings with test initial balance
 * - Multiple bank accounts
 * - Decision paths for scenario planning
 * - Projection events (both one-time and recurring)
 * - Spending types for transaction categorization
 * - Sample transaction records
 */

import { PrismaClient, EventType, CertaintyLevel, RecurrenceFrequency, Currency, DateFormat, BankProvider, TransactionType } from '@prisma/client';
import { addDays, addMonths, startOfMonth, endOfMonth, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test data seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.transactionUploadSource.deleteMany();
  await prisma.transactionSpendingType.deleteMany();
  await prisma.uploadOperation.deleteMany();
  await prisma.dataFormat.deleteMany();
  await prisma.transactionRecord.deleteMany();
  await prisma.spendingType.deleteMany();
  await prisma.scenarioSetDecisionPath.deleteMany();
  await prisma.scenarioSet.deleteMany();
  await prisma.projectionEvent.deleteMany();
  await prisma.recurringProjectionEventRule.deleteMany();
  await prisma.dailyBalance.deleteMany();
  await prisma.decisionPath.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.bankAccount.deleteMany();

  // Create Bank Accounts
  console.log('🏦 Creating bank accounts...');
  const mainAccount = await prisma.bankAccount.create({
    data: {
      name: 'Halifax Current Account',
      description: 'Main current account',
      sortCode: '11-22-33',
      accountNumber: '12345678',
      provider: BankProvider.HALIFAX,
    },
  });

  const savingsAccount = await prisma.bankAccount.create({
    data: {
      name: 'Halifax Savings Account',
      description: 'Emergency savings',
      sortCode: '11-22-33',
      accountNumber: '87654321',
      provider: BankProvider.HALIFAX,
    },
  });

  // Create Settings
  console.log('⚙️  Creating settings...');
  await prisma.settings.create({
    data: {
      initialBankBalance: 5000.00,
      initialBalanceDate: startOfDay(new Date()),
      currency: Currency.GBP,
      dateFormat: DateFormat.UK,
      defaultBankAccountId: mainAccount.id,
    },
  });

  // Create Decision Paths
  console.log('🛤️  Creating decision paths...');
  const jobChangeDecision = await prisma.decisionPath.create({
    data: {
      name: 'Take New Job',
      description: 'Accept job offer at TechCorp with 20% salary increase',
    },
  });

  const houseDecision = await prisma.decisionPath.create({
    data: {
      name: 'Buy House',
      description: 'Purchase first home - requires mortgage',
    },
  });

  const carDecision = await prisma.decisionPath.create({
    data: {
      name: 'Buy New Car',
      description: 'Replace old car with newer model',
    },
  });

  // Create Scenario Sets
  console.log('📊 Creating scenario sets...');
  const baseScenario = await prisma.scenarioSet.create({
    data: {
      name: 'Current Path',
      description: 'Continue with current situation',
      isDefault: true,
      decisionPaths: {
        create: [
          { decisionPathId: jobChangeDecision.id, enabled: false },
          { decisionPathId: houseDecision.id, enabled: false },
          { decisionPathId: carDecision.id, enabled: false },
        ],
      },
    },
  });

  const optimisticScenario = await prisma.scenarioSet.create({
    data: {
      name: 'Optimistic Future',
      description: 'New job + house purchase',
      decisionPaths: {
        create: [
          { decisionPathId: jobChangeDecision.id, enabled: true },
          { decisionPathId: houseDecision.id, enabled: true },
          { decisionPathId: carDecision.id, enabled: false },
        ],
      },
    },
  });

  // Create Recurring Event Rules
  console.log('🔄 Creating recurring event rules...');
  const today = startOfDay(new Date());
  const sixMonthsFromNow = endOfMonth(addMonths(today, 6));

  // Salary - Current Job
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Monthly Salary',
      description: 'Current job salary',
      value: 3500.00,
      type: EventType.INCOMING,
      certainty: CertaintyLevel.CERTAIN,
      paidBy: 'Current Employer Ltd',
      bankAccountId: mainAccount.id,
      startDate: startOfMonth(today),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  // Salary - New Job (decision path)
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'New Job Salary',
      description: 'TechCorp salary (20% increase)',
      value: 4200.00,
      type: EventType.INCOMING,
      certainty: CertaintyLevel.CERTAIN,
      paidBy: 'TechCorp Ltd',
      bankAccountId: mainAccount.id,
      decisionPathId: jobChangeDecision.id,
      startDate: startOfMonth(addMonths(today, 1)),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  // Rent
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Rent Payment',
      description: 'Monthly rent to landlord',
      value: 1200.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Landlord Properties Ltd',
      bankAccountId: mainAccount.id,
      startDate: startOfMonth(today),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  // Mortgage (decision path - replaces rent)
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Mortgage Payment',
      description: 'Monthly mortgage payment',
      value: 1500.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Halifax Mortgages',
      bankAccountId: mainAccount.id,
      decisionPathId: houseDecision.id,
      startDate: startOfMonth(addMonths(today, 2)),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  // Utilities
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Electricity Bill',
      description: 'Monthly electricity',
      value: 120.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'British Gas',
      bankAccountId: mainAccount.id,
      startDate: startOfMonth(today),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Internet & Phone',
      description: 'Broadband and mobile',
      value: 65.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'BT',
      bankAccountId: mainAccount.id,
      startDate: startOfMonth(today),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  // Subscriptions
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Netflix',
      description: 'Streaming subscription',
      value: 15.99,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Netflix',
      bankAccountId: mainAccount.id,
      startDate: startOfMonth(today),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Gym Membership',
      description: 'PureGym membership',
      value: 25.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.LIKELY,
      payTo: 'PureGym',
      bankAccountId: mainAccount.id,
      startDate: startOfMonth(today),
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.MONTHLY,
    },
  });

  // Car Expenses
  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Car Insurance',
      description: 'Annual car insurance',
      value: 650.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Admiral Insurance',
      bankAccountId: mainAccount.id,
      startDate: addMonths(today, 3),
      endDate: addMonths(today, 3),
      frequency: RecurrenceFrequency.ANNUAL,
    },
  });

  await prisma.recurringProjectionEventRule.create({
    data: {
      name: 'Petrol',
      description: 'Weekly fuel costs',
      value: 50.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.LIKELY,
      payTo: 'Various Petrol Stations',
      bankAccountId: mainAccount.id,
      startDate: today,
      endDate: sixMonthsFromNow,
      frequency: RecurrenceFrequency.WEEKLY,
    },
  });

  // Create One-time Projection Events
  console.log('📅 Creating one-time projection events...');

  // Upcoming Birthday
  await prisma.projectionEvent.create({
    data: {
      name: 'Birthday Gift Budget',
      description: "Friend's birthday present",
      value: 75.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Various Shops',
      date: addDays(today, 15),
      bankAccountId: mainAccount.id,
    },
  });

  // Tax Refund
  await prisma.projectionEvent.create({
    data: {
      name: 'Tax Refund',
      description: 'HMRC tax rebate',
      value: 450.00,
      type: EventType.INCOMING,
      certainty: CertaintyLevel.LIKELY,
      paidBy: 'HMRC',
      date: addMonths(today, 2),
      bankAccountId: mainAccount.id,
    },
  });

  // House Deposit (decision path)
  await prisma.projectionEvent.create({
    data: {
      name: 'House Deposit',
      description: 'Down payment for house purchase',
      value: 15000.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Solicitor',
      date: addMonths(today, 2),
      bankAccountId: mainAccount.id,
      decisionPathId: houseDecision.id,
    },
  });

  // Car Purchase (decision path)
  await prisma.projectionEvent.create({
    data: {
      name: 'New Car Purchase',
      description: 'Down payment for new car',
      value: 5000.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.CERTAIN,
      payTo: 'Car Dealership',
      date: addMonths(today, 1),
      bankAccountId: mainAccount.id,
      decisionPathId: carDecision.id,
    },
  });

  // Christmas Shopping
  await prisma.projectionEvent.create({
    data: {
      name: 'Christmas Shopping',
      description: 'Holiday gifts and celebrations',
      value: 800.00,
      type: EventType.EXPENSE,
      certainty: CertaintyLevel.POSSIBLE,
      payTo: 'Various Retailers',
      date: addMonths(today, 5),
      bankAccountId: mainAccount.id,
    },
  });

  // Possible Bonus
  await prisma.projectionEvent.create({
    data: {
      name: 'Annual Bonus',
      description: 'Potential year-end bonus',
      value: 2000.00,
      type: EventType.INCOMING,
      certainty: CertaintyLevel.POSSIBLE,
      paidBy: 'Current Employer Ltd',
      date: addMonths(today, 5),
      bankAccountId: mainAccount.id,
    },
  });

  // Create Spending Types
  console.log('🏷️  Creating spending types...');
  const groceriesType = await prisma.spendingType.create({
    data: {
      name: 'Groceries',
      description: 'Food and household items',
      color: '#10b981',
    },
  });

  const transportType = await prisma.spendingType.create({
    data: {
      name: 'Transport',
      description: 'Fuel, parking, public transport',
      color: '#3b82f6',
    },
  });

  const entertainmentType = await prisma.spendingType.create({
    data: {
      name: 'Entertainment',
      description: 'Dining out, movies, events',
      color: '#f59e0b',
    },
  });

  const billsType = await prisma.spendingType.create({
    data: {
      name: 'Bills',
      description: 'Utilities, subscriptions, insurance',
      color: '#ef4444',
    },
  });

  const shoppingType = await prisma.spendingType.create({
    data: {
      name: 'Shopping',
      description: 'Clothes, electronics, general retail',
      color: '#8b5cf6',
    },
  });

  // Create Data Format
  console.log('📋 Creating data formats...');
  const halifaxFormat = await prisma.dataFormat.create({
    data: {
      name: 'Halifax CSV Export',
      description: 'Standard Halifax account export format',
    },
  });

  // Create Sample Transaction Records
  console.log('💳 Creating transaction records...');
  const thirtyDaysAgo = addDays(today, -30);

  const transactions = [
    // Day -30
    { date: thirtyDaysAgo, type: TransactionType.CR, desc: 'SALARY PAYMENT', debit: null, credit: 3500.00, balance: 4200.00, spendingTypes: [] },

    // Day -28
    { date: addDays(thirtyDaysAgo, 2), type: TransactionType.DD, desc: 'RENT PAYMENT', debit: 1200.00, credit: null, balance: 3000.00, spendingTypes: [billsType] },
    { date: addDays(thirtyDaysAgo, 2), type: TransactionType.DD, desc: 'BRITISH GAS', debit: 120.00, credit: null, balance: 2880.00, spendingTypes: [billsType] },

    // Day -25
    { date: addDays(thirtyDaysAgo, 5), type: TransactionType.DEB, desc: 'TESCO STORES', debit: 65.50, credit: null, balance: 2814.50, spendingTypes: [groceriesType] },

    // Day -23
    { date: addDays(thirtyDaysAgo, 7), type: TransactionType.DEB, desc: 'SHELL PETROL', debit: 52.00, credit: null, balance: 2762.50, spendingTypes: [transportType] },

    // Day -20
    { date: addDays(thirtyDaysAgo, 10), type: TransactionType.DEB, desc: 'AMAZON UK', debit: 34.99, credit: null, balance: 2727.51, spendingTypes: [shoppingType] },

    // Day -18
    { date: addDays(thirtyDaysAgo, 12), type: TransactionType.DEB, desc: 'SAINSBURYS', debit: 48.75, credit: null, balance: 2678.76, spendingTypes: [groceriesType] },

    // Day -16
    { date: addDays(thirtyDaysAgo, 14), type: TransactionType.DD, desc: 'NETFLIX', debit: 15.99, credit: null, balance: 2662.77, spendingTypes: [billsType] },
    { date: addDays(thirtyDaysAgo, 14), type: TransactionType.DEB, desc: 'COSTA COFFEE', debit: 4.50, credit: null, balance: 2658.27, spendingTypes: [entertainmentType] },

    // Day -14
    { date: addDays(thirtyDaysAgo, 16), type: TransactionType.DEB, desc: 'SHELL PETROL', debit: 50.00, credit: null, balance: 2608.27, spendingTypes: [transportType] },

    // Day -12
    { date: addDays(thirtyDaysAgo, 18), type: TransactionType.DEB, desc: 'ASDA STORES', debit: 72.30, credit: null, balance: 2535.97, spendingTypes: [groceriesType] },

    // Day -10
    { date: addDays(thirtyDaysAgo, 20), type: TransactionType.DEB, desc: 'RESTAURANT', debit: 45.00, credit: null, balance: 2490.97, spendingTypes: [entertainmentType] },

    // Day -7
    { date: addDays(thirtyDaysAgo, 23), type: TransactionType.DD, desc: 'BT BILL', debit: 65.00, credit: null, balance: 2425.97, spendingTypes: [billsType] },

    // Day -5
    { date: addDays(thirtyDaysAgo, 25), type: TransactionType.DEB, desc: 'TESCO STORES', debit: 58.20, credit: null, balance: 2367.77, spendingTypes: [groceriesType] },

    // Day -3
    { date: addDays(thirtyDaysAgo, 27), type: TransactionType.DEB, desc: 'CINEMA TICKETS', debit: 28.00, credit: null, balance: 2339.77, spendingTypes: [entertainmentType] },

    // Day -1
    { date: addDays(thirtyDaysAgo, 29), type: TransactionType.DEB, desc: 'SHELL PETROL', debit: 51.50, credit: null, balance: 2288.27, spendingTypes: [transportType] },
  ];

  for (const tx of transactions) {
    const transaction = await prisma.transactionRecord.create({
      data: {
        transactionDate: tx.date,
        transactionType: tx.type,
        transactionDescription: tx.desc,
        debitAmount: tx.debit,
        creditAmount: tx.credit,
        balance: tx.balance,
        bankAccountId: mainAccount.id,
      },
    });

    // Link spending types
    for (const spendingType of tx.spendingTypes) {
      await prisma.transactionSpendingType.create({
        data: {
          transactionRecordId: transaction.id,
          spendingTypeId: spendingType.id,
        },
      });
    }
  }

  // Create Upload Operation for transactions
  const uploadOp = await prisma.uploadOperation.create({
    data: {
      filename: 'halifax_export_2024_12.csv',
      fileType: '.csv',
      operationStatus: 'COMPLETED',
      fileSize: 2048,
      numberOfRecords: transactions.length,
      localFileLocation: '/tmp/test_uploads/halifax_export_2024_12.csv',
      earliestDate: thirtyDaysAgo,
      latestDate: addDays(thirtyDaysAgo, 29),
      detectedAccountNumber: '12345678',
      detectedSortCode: '11-22-33',
      dataFormatId: halifaxFormat.id,
      bankAccountId: mainAccount.id,
    },
  });

  console.log('✅ Test data seeding complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - ${2} bank accounts created`);
  console.log(`   - ${3} decision paths created`);
  console.log(`   - ${2} scenario sets created`);
  console.log(`   - ${11} recurring event rules created`);
  console.log(`   - ${6} one-time projection events created`);
  console.log(`   - ${5} spending types created`);
  console.log(`   - ${transactions.length} transaction records created`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
