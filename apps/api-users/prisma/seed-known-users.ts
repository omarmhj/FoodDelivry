/**
 * Creates 3 known test users — one per available role in the users service.
 * Note: The users DB only has Admin and User roles.
 *       Owner/Staff roles exist only in the restaurants DB.
 *
 * Does NOT wipe existing users — safe to run anytime.
 *
 * Run from Food-Delivery-WebApp/:
 *   DATABASE_URL="mongodb://localhost:27019/snackrapido_users?replicaSet=rs0&directConnection=true" \
 *   npx ts-node --compiler-options '{"module":"commonjs"}' apps/api-users/prisma/seed-known-users.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USERS = [
  {
    name: 'Admin User',
    email: 'admin@snackrapido.com',
    password: 'Admin123!',
    role: 'Admin' as const,
    phone_number: 10000000001,
    address: '1 Admin Street, Tunis',
  },
  {
    name: 'Regular User',
    email: 'user@snackrapido.com',
    password: 'User123!',
    role: 'User' as const,
    phone_number: 10000000002,
    address: '2 User Street, Tunis',
  },
  {
    name: 'Omar Test',
    email: 'omar@snackrapido.com',
    password: 'Omar123!',
    role: 'User' as const,
    phone_number: 10000000003,
    address: '3 Test Street, Tunis',
  },
];

async function main() {
  console.log('🌱 Creating/updating known test users...\n');

  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const existing = await prisma.user.findUnique({ where: { email: u.email } });

    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { password: hashed, role: u.role },
      });
      console.log(`🔄 Updated : ${u.email}  →  password reset to "${u.password}"`);
    } else {
      const created = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashed,
          role: u.role,
          phone_number: u.phone_number,
          address: u.address,
        },
      });
      console.log(`✅ Created : ${created.email}  (id: ${created.id})`);
    }
  }

  console.log('\n📋 Credentials summary:');
  console.log('┌─────────────────────────────┬────────────┬───────┐');
  console.log('│ Email                       │ Password   │ Role  │');
  console.log('├─────────────────────────────┼────────────┼───────┤');
  for (const u of USERS) {
    console.log(`│ ${u.email.padEnd(27)} │ ${u.password.padEnd(10)} │ ${u.role.padEnd(5)} │`);
  }
  console.log('└─────────────────────────────┴────────────┴───────┘');
  console.log('\n⚠️  Note: Owner/Staff roles only exist in the restaurants DB.');
  console.log('   Use the restaurants service to register/login as a restaurant owner.');
}

main()
  .catch((e) => { console.error('❌ Failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
