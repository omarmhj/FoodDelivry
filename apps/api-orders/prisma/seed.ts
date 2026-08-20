/**
 * Orders Seed Script
 * Uses Prisma clients to read users and restaurants, then seeds orders.
 *
 * Run from Food-Delivery-WebApp/:
 *   DATABASE_URL="mongodb://localhost:27019/snackrapido_orders?replicaSet=rs0&directConnection=true" \
 *   npx ts-node --compiler-options '{"module":"commonjs"}' apps/api-orders/prisma/seed.ts
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient: OrdersPrismaClient } = require('../../../node_modules/.prisma/orders-client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient: UsersPrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient: RestaurantsPrismaClient } = require('@prisma/client');

const ordersPrisma = new OrdersPrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const usersPrisma = new UsersPrismaClient({
  datasources: { db: { url: 'mongodb://localhost:27019/snackrapido_users?replicaSet=rs0&directConnection=true' } },
});

const restaurantsPrisma = new RestaurantsPrismaClient({
  datasources: { db: { url: 'mongodb://localhost:27019/snackrapido_restaurants?replicaSet=rs0&directConnection=true' } },
});

async function main() {
  console.log('🌱 Seeding orders database...');

  // Clear existing data
  await ordersPrisma.orderReview.deleteMany();
  await ordersPrisma.orderStatusHistory.deleteMany();
  await ordersPrisma.orderItem.deleteMany();
  await ordersPrisma.order.deleteMany();
  console.log('🗑️  Cleared existing orders data');

  // Fetch users
  const users: any[] = await usersPrisma.user.findMany({ take: 5 });
  if (users.length === 0) throw new Error('No users found. Run the users seed first.');
  console.log(`✅ Found ${users.length} users`);

  // Fetch restaurants
  const restaurants: any[] = await restaurantsPrisma.restaurant.findMany();
  if (restaurants.length === 0) throw new Error('No restaurants found. Run the restaurants seed first.');
  console.log(`✅ Found ${restaurants.length} restaurants`);

  // Fetch menu items
  const menuItems: any[] = await restaurantsPrisma.menuItem.findMany();
  console.log(`✅ Found ${menuItems.length} menu items`);

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
  const deliveryTypes = ['DELIVERY', 'PICKUP', 'DINE_IN'];

  let orderCount = 0;

  for (const restaurant of restaurants) {
    const items = menuItems.filter((m: any) => m.restaurantId === restaurant.id);
    if (items.length === 0) continue;

    for (let i = 0; i < 4; i++) {
      const customer: any = pick(users);
      const status = statuses[i % statuses.length];
      const deliveryType = deliveryTypes[i % deliveryTypes.length];

      // Pick 1-3 random items, resolving each to a fully priced line so the
      // order's subtotal and its lines cannot disagree.
      const orderLines = Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => pick(items),
      ).map((item: any) => {
        const unitPrice: number = (item.price as number) || 10;
        const quantity = Math.floor(Math.random() * 2) + 1;
        return {
          menuItemId: item.id,
          menuItemName: item.name,
          menuItemDescription: item.description || '',
          quantity,
          basePrice: unitPrice,
          optionsTotal: 0,
          unitPrice,
          totalPrice: parseFloat((unitPrice * quantity).toFixed(2)),
        };
      });

      const subtotal: number = parseFloat(
        orderLines.reduce((sum: number, line) => sum + line.totalPrice, 0).toFixed(2),
      );
      const tax: number = parseFloat((subtotal * 0.08).toFixed(2));
      const deliveryFee: number = deliveryType === 'DELIVERY' ? 5.99 : 0;
      const total: number = parseFloat((subtotal + tax + deliveryFee).toFixed(2));
      const orderNumber = `ORD-${Date.now()}-${String(orderCount).padStart(3, '0')}`;

      const order = await ordersPrisma.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          status,
          paymentStatus: status === 'DELIVERED' ? 'PAID' : status === 'CANCELLED' ? 'REFUNDED' : 'PENDING',
          deliveryType,
          subtotal,
          tax,
          deliveryFee,
          discount: 0,
          total,
          deliveryAddress: deliveryType === 'DELIVERY' ? '10 Test Street, Tunis' : null,
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
          deliveredAt: status === 'DELIVERED' ? new Date() : null,
          items: {
            create: orderLines,
          },
        },
      });

      await ordersPrisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING',
          previousStatus: null,
          reason: 'Order placed by customer',
          changedByRole: 'CUSTOMER',
        },
      });

      if (status === 'DELIVERED') {
        await ordersPrisma.orderReview.create({
          data: {
            orderId: order.id,
            customerId: customer.id,
            restaurantId: restaurant.id,
            rating: Math.floor(Math.random() * 2) + 4,
            comment: pick(['Great food!', 'Fast delivery!', 'Will order again!', 'Excellent quality.']),
            foodQuality: 5,
            deliverySpeed: 4,
            customerService: 5,
            isPublic: true,
            isVerified: false,
          },
        });
      }

      orderCount++;
    }
    console.log(`✅ Created 4 orders for ${restaurant.name}`);
  }

  const total = await ordersPrisma.order.count();
  console.log(`\n🎉 Seeding complete! Total orders: ${total}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => {
    await ordersPrisma.$disconnect();
    await usersPrisma.$disconnect();
    await restaurantsPrisma.$disconnect();
  });
