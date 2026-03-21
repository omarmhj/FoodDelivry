import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users database...');

  // Clear existing data
  await prisma.avatars.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Cleared existing data');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@snackrapido.com',
      password: hashedPassword,
      phone_number: 1000000000,
      address: '123 Admin Street, Tunis',
      role: 'Admin',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Create 2 known test users (easy to login with)
  const testUser1 = await prisma.user.create({
    data: {
      name: 'Omar Test',
      email: 'omar@test.com',
      password: hashedPassword,
      phone_number: 2000000001,
      address: '10 Avenue Habib Bourguiba, Tunis',
      role: 'User',
    },
  });

  const testUser2 = await prisma.user.create({
    data: {
      name: 'Sara Test',
      email: 'sara@test.com',
      password: hashedPassword,
      phone_number: 2000000002,
      address: '25 Rue de Marseille, Tunis',
      role: 'User',
    },
  });
  console.log(`✅ Test users: ${testUser1.email}, ${testUser2.email}`);

  // Create 15 random users with faker
  const users = [];
  for (let i = 0; i < 15; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        phone_number: parseFloat(faker.string.numeric(10)),
        address: faker.location.streetAddress({ useFullAddress: true }),
        role: 'User',
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} random users`);

  // Add avatars to some users
  const usersWithAvatars = [admin, testUser1, testUser2, ...users.slice(0, 5)];
  for (const user of usersWithAvatars) {
    await prisma.avatars.create({
      data: {
        public_id: `avatar_${user.id}`,
        url: faker.image.avatar(),
        userId: user.id,
      },
    });
  }
  console.log(`✅ Added avatars to ${usersWithAvatars.length} users`);

  const total = await prisma.user.count();
  console.log(`\n🎉 Seeding complete! Total users: ${total}`);
  console.log('\n📋 Login credentials (all use password: Password123!):');
  console.log('   admin@snackrapido.com  (Admin)');
  console.log('   omar@test.com          (User)');
  console.log('   sara@test.com          (User)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
