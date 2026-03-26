/**
 * Reservations Seed Script
 * Uses Prisma clients to read users and restaurants, then seeds tables and reservations.
 *
 * Run from Food-Delivery-WebApp/:
 *   DATABASE_URL="mongodb://localhost:27019/snackrapido_reservations?replicaSet=rs0&directConnection=true" \
 *   npx ts-node --compiler-options '{"module":"commonjs"}' apps/api-reservations/prisma/seed.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient: ReservationsPrismaClient } = require('../../../node_modules/.prisma/reservations-client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient: SharedPrismaClient } = require('@prisma/client');

const reservationsPrisma = new ReservationsPrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const usersPrisma = new SharedPrismaClient({
  datasources: { db: { url: 'mongodb://localhost:27019/snackrapido_users?replicaSet=rs0&directConnection=true' } },
});

const restaurantsPrisma = new SharedPrismaClient({
  datasources: { db: { url: 'mongodb://localhost:27019/snackrapido_restaurants?replicaSet=rs0&directConnection=true' } },
});

async function main() {
  console.log('🌱 Seeding reservations database...');

  await reservationsPrisma.reservation.deleteMany();
  await reservationsPrisma.table.deleteMany();
  console.log('🗑️  Cleared existing reservations data');

  const users: any[] = await usersPrisma.user.findMany({ take: 6 });
  if (users.length === 0) throw new Error('No users found. Run the users seed first.');
  console.log(`✅ Found ${users.length} users`);

  const restaurants: any[] = await restaurantsPrisma.restaurant.findMany();
  if (restaurants.length === 0) throw new Error('No restaurants found. Run the restaurants seed first.');
  console.log(`✅ Found ${restaurants.length} restaurants`);

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const tableLayouts = [
    { tableNumber: 'T-1', capacity: 2, location: 'indoor' },
    { tableNumber: 'T-2', capacity: 2, location: 'indoor' },
    { tableNumber: 'T-3', capacity: 4, location: 'indoor' },
    { tableNumber: 'T-4', capacity: 4, location: 'indoor' },
    { tableNumber: 'T-5', capacity: 6, location: 'outdoor' },
    { tableNumber: 'T-6', capacity: 6, location: 'outdoor' },
    { tableNumber: 'T-7', capacity: 8, location: 'private' },
    { tableNumber: 'T-8', capacity: 10, location: 'private' },
  ];

  const timeSlots = [
    { start: '12:00', end: '14:00' },
    { start: '14:30', end: '16:30' },
    { start: '19:00', end: '21:00' },
    { start: '21:30', end: '23:00' },
  ];

  const statuses = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'];
  const dateOffsets = [-7, -3, -1, 1, 3];

  let reservationCount = 0;

  for (const restaurant of restaurants) {
    // Create tables
    const tables: any[] = [];
    for (const layout of tableLayouts) {
      const table = await reservationsPrisma.table.create({
        data: {
          restaurantId: restaurant.id,
          tableNumber: layout.tableNumber,
          capacity: layout.capacity,
          location: layout.location,
          isActive: true,
        },
      });
      tables.push(table);
    }
    console.log(`✅ Created ${tables.length} tables for ${restaurant.name}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 5; i++) {
      const customer: any = pick(users);
      const table: any = pick(tables.filter((t: any) => t.capacity >= 2));
      const slot = timeSlots[i % timeSlots.length];
      const status = statuses[i % statuses.length];

      const reservationDate = new Date(today);
      reservationDate.setDate(reservationDate.getDate() + dateOffsets[i]);

      const reservationNumber = `RES-${Date.now()}-${String(reservationCount).padStart(3, '0')}`;

      await reservationsPrisma.reservation.create({
        data: {
          reservationNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          tableId: table.id,
          date: reservationDate,
          startTime: slot.start,
          endTime: slot.end,
          partySize: Math.min(table.capacity, Math.floor(Math.random() * 4) + 2),
          status,
          specialRequests: i % 3 === 0 ? 'Window seat preferred' : null,
          cancelledBy: status === 'CANCELLED' ? customer.id : null,
          cancellationReason: status === 'CANCELLED' ? 'Change of plans' : null,
        },
      });

      reservationCount++;
    }
    console.log(`✅ Created 5 reservations for ${restaurant.name}`);
  }

  const totalTables = await reservationsPrisma.table.count();
  const totalReservations = await reservationsPrisma.reservation.count();
  console.log(`\n🎉 Seeding complete! Tables: ${totalTables}, Reservations: ${totalReservations}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => {
    await reservationsPrisma.$disconnect();
    await usersPrisma.$disconnect();
    await restaurantsPrisma.$disconnect();
  });
