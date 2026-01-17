import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Starting database seed...');

  // Seed DataFormats
  console.log('Seeding data formats...');

  const dataFormats = [
    {
      name: 'halifax_csv_v1',
      description: 'Halifax Bank CSV export format - standard account statement export',
    },
    // Add more formats here as they are supported in the future
    // {
    //   name: 'barclays_csv_v1',
    //   description: 'Barclays Bank CSV export format',
    // },
  ];

  for (const format of dataFormats) {
    await prisma.dataFormat.upsert({
      where: { name: format.name },
      update: { description: format.description },
      create: format,
    });
    console.log(`✓ Data format "${format.name}" seeded`);
  }

  console.log('Database seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
