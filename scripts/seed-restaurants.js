/*
 * Seed script: creates realistic restaurants around Tunis for the customer app.
 * Uses the generated restaurants Prisma client + bcrypt.
 * Run: DATABASE_URL="..." node scripts/seed-restaurants.js
 */
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '..', 'node_modules', '.prisma', 'restaurants-client'));
const bcrypt = require(path.join(__dirname, '..', 'node_modules', 'bcrypt'));

const prisma = new PrismaClient();

// Tunis center: [longitude, latitude]
const CENTER = [10.1815, 36.8065];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 7 restaurants scattered ~1-8km around Tunis center.
const RESTAURANTS = [
  {
    name: 'La Goulette Grill',
    address: 'Avenue Habib Bourguiba 12, La Goulette',
    email: 'lagoulette.grill@snackrapido.test',
    phone_number: 21671000101,
    coordinates: [10.1900, 36.8180],
    category: { name: 'Grilled & BBQ', description: 'Charcoal-grilled meats and seafood' },
    menuName: 'Main Menu',
    items: [
      { name: 'Mixed Grill Platter', description: 'Lamb chops, merguez, and chicken skewers with harissa', price: 24.5, available: true },
      { name: 'Grilled Sea Bass', description: 'Whole sea bass grilled with lemon and olive oil', price: 29.0, available: true },
      { name: 'Merguez Sandwich', description: 'Spicy lamb sausage in fresh baguette with slata', price: 8.5, available: true },
      { name: 'Chicken Shawarma', description: 'Marinated chicken with garlic sauce and fries', price: 11.0, available: true },
      { name: 'Grilled Calamari', description: 'Tender calamari with chermoula', price: 18.0, available: true },
      { name: 'Seasonal Truffle Special', description: 'Chef special, availability varies', price: 42.0, available: false },
    ],
  },
  {
    name: 'Medina Tajine House',
    address: 'Rue Jamaa Ez Zitouna 5, Medina',
    email: 'medina.tajine@snackrapido.test',
    phone_number: 21671000102,
    coordinates: [10.1710, 36.7995],
    category: { name: 'Traditional Tunisian', description: 'Home-style Tunisian classics' },
    menuName: 'Traditional Menu',
    items: [
      { name: 'Tajine Malsouka', description: 'Baked egg and cheese tajine with parsley', price: 12.0, available: true },
      { name: 'Couscous Royal', description: 'Semolina with lamb, chicken, and vegetables', price: 16.5, available: true },
      { name: 'Ojja Merguez', description: 'Spicy tomato and egg stew with merguez', price: 10.5, available: true },
      { name: 'Brik a l\'Oeuf', description: 'Crispy pastry with egg, tuna, and capers', price: 4.5, available: true },
      { name: 'Lablabi', description: 'Chickpea soup with cumin, harissa, and bread', price: 6.0, available: true },
      { name: 'Slow-cooked Osban', description: 'Traditional stuffed dish, weekends only', price: 19.0, available: false },
    ],
  },
  {
    name: 'Carthage Cafe & Pizza',
    address: 'Avenue de Carthage 44, Tunis',
    email: 'carthage.cafe@snackrapido.test',
    phone_number: 21671000103,
    coordinates: [10.2100, 36.8300],
    category: { name: 'Pizza & Italian', description: 'Wood-fired pizzas and pasta' },
    menuName: 'Pizza Menu',
    items: [
      { name: 'Margherita Pizza', description: 'San Marzano tomato, mozzarella, basil', price: 13.0, available: true },
      { name: 'Tunisian Thon Pizza', description: 'Tuna, olives, capers, harissa drizzle', price: 15.0, available: true },
      { name: 'Quattro Formaggi', description: 'Four cheese blend on thin crust', price: 16.0, available: true },
      { name: 'Penne Arrabbiata', description: 'Spicy tomato sauce with garlic and chili', price: 12.5, available: true },
      { name: 'Tiramisu', description: 'Classic mascarpone and espresso dessert', price: 7.0, available: true },
      { name: 'Truffle Pizza Bianca', description: 'Limited seasonal white pizza', price: 22.0, available: false },
    ],
  },
  {
    name: 'Bardo Bites Burgers',
    address: 'Rue du Bardo 8, Le Bardo',
    email: 'bardo.bites@snackrapido.test',
    phone_number: 21671000104,
    coordinates: [10.1350, 36.8090],
    category: { name: 'Burgers & Fast Food', description: 'Smash burgers and loaded fries' },
    menuName: 'Burger Menu',
    items: [
      { name: 'Classic Smash Burger', description: 'Double beef patty, cheddar, house sauce', price: 12.0, available: true },
      { name: 'Spicy Harissa Burger', description: 'Beef patty with harissa mayo and pickles', price: 13.5, available: true },
      { name: 'Crispy Chicken Burger', description: 'Buttermilk fried chicken with slaw', price: 12.5, available: true },
      { name: 'Loaded Cheese Fries', description: 'Fries with melted cheddar and jalapenos', price: 7.5, available: true },
      { name: 'Veggie Bean Burger', description: 'House bean patty with avocado', price: 11.0, available: true },
      { name: 'Milkshake Trio', description: 'Vanilla, chocolate, strawberry set', price: 9.0, available: true },
    ],
  },
  {
    name: 'Lac Lounge Sushi',
    address: 'Les Berges du Lac 2, Rue du Lac',
    email: 'lac.lounge@snackrapido.test',
    phone_number: 21671000105,
    coordinates: [10.2450, 36.8400],
    category: { name: 'Sushi & Asian', description: 'Fresh sushi and Asian fusion' },
    menuName: 'Sushi Menu',
    items: [
      { name: 'Salmon Nigiri (6pc)', description: 'Fresh salmon over seasoned rice', price: 18.0, available: true },
      { name: 'California Roll (8pc)', description: 'Crab, avocado, cucumber', price: 15.0, available: true },
      { name: 'Spicy Tuna Roll (8pc)', description: 'Tuna, spicy mayo, scallions', price: 17.0, available: true },
      { name: 'Chicken Teriyaki Bowl', description: 'Grilled chicken with steamed rice', price: 14.5, available: true },
      { name: 'Miso Soup', description: 'Tofu, seaweed, and scallions', price: 5.0, available: true },
      { name: 'Omakase Chef Platter', description: 'Reservation only tasting set', price: 65.0, available: false },
    ],
  },
  {
    name: 'Sidi Bou Seafood',
    address: 'Rue Sidi Bou Said 3, Tunis Nord',
    email: 'sidibou.seafood@snackrapido.test',
    phone_number: 21671000106,
    coordinates: [10.2500, 36.8150],
    category: { name: 'Seafood', description: 'Mediterranean seafood specialties' },
    menuName: 'Seafood Menu',
    items: [
      { name: 'Grilled Prawns', description: 'Jumbo prawns with garlic butter', price: 26.0, available: true },
      { name: 'Seafood Couscous', description: 'Fish, shrimp, and calamari over couscous', price: 22.0, available: true },
      { name: 'Fried Calamari', description: 'Lightly battered rings with tartar', price: 16.0, available: true },
      { name: 'Fish Soup', description: 'Rich Mediterranean broth with croutons', price: 9.0, available: true },
      { name: 'Octopus Salad', description: 'Chilled octopus with lemon and olive oil', price: 15.5, available: true },
      { name: 'Fresh Lobster', description: 'Market price, subject to daily catch', price: 55.0, available: false },
    ],
  },
  {
    name: 'Belvedere Breakfast Bar',
    address: 'Avenue Taieb Mhiri 21, Belvedere',
    email: 'belvedere.breakfast@snackrapido.test',
    phone_number: 21671000107,
    coordinates: [10.1700, 36.8210],
    category: { name: 'Breakfast & Cafe', description: 'All-day breakfast and coffee' },
    menuName: 'Breakfast Menu',
    items: [
      { name: 'Tunisian Breakfast Plate', description: 'Eggs, olives, cheese, harissa, and bread', price: 9.5, available: true },
      { name: 'Avocado Toast', description: 'Sourdough with smashed avocado and chili', price: 8.0, available: true },
      { name: 'Fluffy Pancakes', description: 'Stack of three with maple syrup', price: 7.5, available: true },
      { name: 'Cappuccino', description: 'Double shot with steamed milk', price: 3.5, available: true },
      { name: 'Fresh Orange Juice', description: 'Squeezed to order', price: 4.0, available: true },
      { name: 'Croissant Basket', description: 'Assorted butter croissants', price: 6.0, available: true },
    ],
  },
];

async function seedOne(r, hashedPassword) {
  // 1. Restaurant with GeoPoint composite type
  const restaurant = await prisma.restaurant.create({
    data: {
      name: r.name,
      country: 'Tunisia',
      city: 'Tunis',
      address: r.address,
      email: r.email,
      phone_number: r.phone_number,
      password: hashedPassword,
      coordinates: { type: 'Point', coordinates: r.coordinates },
    },
  });

  // 2. Category
  const category = await prisma.category.create({
    data: {
      name: r.category.name,
      description: r.category.description,
      restaurantId: restaurant.id,
    },
  });

  // 3. Menu
  const menu = await prisma.menu.create({
    data: { name: r.menuName, restaurantId: restaurant.id },
  });

  // 4. Menu items
  let itemCount = 0;
  for (const it of r.items) {
    await prisma.menuItem.create({
      data: {
        name: it.name,
        description: it.description,
        price: it.price,
        available: it.available,
        categoryId: category.id,
        menuId: menu.id,
        restaurantId: restaurant.id,
      },
    });
    itemCount++;
  }

  // 5. Operating hours for the week
  for (const day of DAYS) {
    const isWeekend = day === 'Sunday';
    await prisma.operatingHours.create({
      data: {
        restaurantId: restaurant.id,
        dayOfWeek: day,
        openTime: isWeekend ? '10:00' : '09:00',
        closeTime: isWeekend ? '23:00' : '22:30',
        isClosed: false,
      },
    });
  }

  return { id: restaurant.id, itemCount };
}

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  let totalRestaurants = 0;
  let totalItems = 0;

  for (const r of RESTAURANTS) {
    const existing = await prisma.restaurant.findUnique({ where: { email: r.email } });
    if (existing) {
      console.log(`SKIP (already exists): ${r.name} <${r.email}>`);
      continue;
    }
    const res = await seedOne(r, hashedPassword);
    totalRestaurants++;
    totalItems += res.itemCount;
    console.log(`CREATED: ${r.name} (${r.coordinates.join(',')}) -> ${res.itemCount} items`);
  }

  // Ensure 2dsphere index exists (idempotent).
  try {
    await prisma.$runCommandRaw({
      createIndexes: 'Restaurant',
      indexes: [{ key: { coordinates: '2dsphere' }, name: 'coordinates_2dsphere' }],
    });
    console.log('2dsphere index ensured on Restaurant.coordinates');
  } catch (e) {
    console.log('Index ensure note:', e.message);
  }

  console.log(`\nSUMMARY: created ${totalRestaurants} restaurants, ${totalItems} menu items.`);
}

main()
  .catch((e) => {
    console.error('SEED ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
