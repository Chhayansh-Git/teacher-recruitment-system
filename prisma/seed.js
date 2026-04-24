/**
 * ============================================================
 * FILE: prisma/seed.js — Database Seeder
 * ============================================================
 *
 * WHAT: Populates the database with initial data for development/testing.
 *       Creates the admin account and some sample data.
 *
 * HOW TO RUN:
 *       npm run db:seed
 *       or: node prisma/seed.js
 *
 * This runs AFTER migrations (npx prisma migrate dev).
 * It creates the admin account that's defined in .env (ADMIN_EMAIL, etc.)
 * ============================================================
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Create Admin User ---
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourplatform.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminPhone = process.env.ADMIN_PHONE || '+919999999999';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail, role: 'ADMIN' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: adminPhone,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'VERIFIED',
        passwordChanged: true,
      },
    });

    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // --- Initialize free school counter in Redis ---
  // (This would normally be done via Redis, but we log it here as a reminder)
  console.log('✅ Remember to initialize Redis key "school:registration:count" if needed');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
