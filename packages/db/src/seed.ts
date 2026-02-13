import { prisma } from './client';

async function main() {
  console.info('🌱 Starting database seed...');

  // Add your seed data here
  // Example:
  // await prisma.user.upsert({
  //   where: { email: 'admin@example.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@example.com',
  //     name: 'Admin User',
  //   },
  // });

  console.info('✅ Database seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
