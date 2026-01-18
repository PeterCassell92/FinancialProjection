#!/usr/bin/env tsx

import prisma from '../src/lib/prisma';

async function main() {
  const accounts = await prisma.bankAccount.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log('\n=== Bank Accounts ===');
  accounts.forEach((acc, index) => {
    console.log(`${index + 1}. [${acc.id}]`);
    console.log(`   Name: ${acc.name}`);
    console.log(`   Sort Code: ${acc.sortCode}`);
    console.log(`   Account Number: ${acc.accountNumber}`);
    console.log(`   Provider: ${acc.provider}`);
    console.log('');
  });

  const txCounts = await prisma.transactionRecord.groupBy({
    by: ['bankAccountId'],
    _count: { id: true }
  });

  console.log('=== Transaction Counts ===');
  for (const count of txCounts) {
    const account = accounts.find(a => a.id === count.bankAccountId);
    console.log(`${account?.name || 'Unknown'}: ${count._count.id} transactions`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
