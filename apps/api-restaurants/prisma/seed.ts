import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding restaurants database...');

  // Clear existing data (order matters due to relations)
  await prisma.images.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.category.deleteMany();
  await prisma.operatingHours.deleteMany();
  await prisma.restaurant.deleteMany();
  console.log('🗑️  Cleared existing data');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // ==================== RESTAURANT 1: Pizza Palace ====================
  const pizzaPalace = await prisma.restaurant.create({
    data: {
      name: 'Pizza Palace',
      country: 'Tunisia',
      city: 'Tunis',
      address: '123 Avenue Habib Bourguiba, Tunis',
      email: 'pizzapalace@snackrapido.com',
      phone_number: 21612345678,
      password: hashedPassword,
      coordinates: { type: 'Point', coordinates: [10.1815, 36.8065] },
    },
  });
  console.log(`✅ Restaurant: ${pizzaPalace.name} (${pizzaPalace.id})`);

  // Menu
  const pizzaMenu = await prisma.menu.create({
    data: { name: 'Main Menu', restaurantId: pizzaPalace.id },
  });

  // Categories
  const pizzasCat = await prisma.category.create({
    data: { name: 'Pizzas', description: 'Wood-fired pizzas', restaurantId: pizzaPalace.id },
  });
  const pastasCat = await prisma.category.create({
    data: { name: 'Pastas', description: 'Fresh pasta dishes', restaurantId: pizzaPalace.id },
  });
  const drinksCat1 = await prisma.category.create({
    data: { name: 'Drinks', description: 'Beverages', restaurantId: pizzaPalace.id },
  });

  // Menu Items
  const pizzaItems = [
    { name: 'Margherita', description: 'Tomato sauce, mozzarella, fresh basil', price: 12.99 },
    { name: 'Pepperoni', description: 'Tomato sauce, mozzarella, pepperoni', price: 14.99 },
    { name: 'BBQ Chicken', description: 'BBQ sauce, chicken, red onion, mozzarella', price: 15.99 },
    { name: 'Quattro Formaggi', description: 'Four cheese blend pizza', price: 16.99 },
  ];
  for (const item of pizzaItems) {
    await prisma.menuItem.create({
      data: { ...item, estimatedPrice: item.price + 2, categoryId: pizzasCat.id, menuId: pizzaMenu.id, restaurantId: pizzaPalace.id },
    });
  }

  const pastaItems = [
    { name: 'Spaghetti Carbonara', description: 'Eggs, pancetta, parmesan, black pepper', price: 11.99 },
    { name: 'Penne Arrabbiata', description: 'Spicy tomato sauce, garlic, chili', price: 10.99 },
  ];
  for (const item of pastaItems) {
    await prisma.menuItem.create({
      data: { ...item, categoryId: pastasCat.id, menuId: pizzaMenu.id, restaurantId: pizzaPalace.id },
    });
  }

  await prisma.menuItem.create({
    data: { name: 'Coca-Cola', description: '330ml can', price: 2.50, categoryId: drinksCat1.id, restaurantId: pizzaPalace.id },
  });

  // Operating Hours
  for (const day of days) {
    await prisma.operatingHours.create({
      data: {
        restaurantId: pizzaPalace.id,
        dayOfWeek: day,
        openTime: '11:00',
        closeTime: '23:00',
        isClosed: day === 'Sunday',
      },
    });
  }

  // ==================== RESTAURANT 2: Burger House ====================
  const burgerHouse = await prisma.restaurant.create({
    data: {
      name: 'Burger House',
      country: 'Tunisia',
      city: 'Sfax',
      address: '45 Rue Mongi Slim, Sfax',
      email: 'burgerhouse@snackrapido.com',
      phone_number: 21698765432,
      password: hashedPassword,
      coordinates: { type: 'Point', coordinates: [10.7603, 34.7406] },
    },
  });
  console.log(`✅ Restaurant: ${burgerHouse.name} (${burgerHouse.id})`);

  const burgerMenu = await prisma.menu.create({
    data: { name: 'Burger Menu', restaurantId: burgerHouse.id },
  });

  const burgersCat = await prisma.category.create({
    data: { name: 'Burgers', description: 'Handcrafted burgers', restaurantId: burgerHouse.id },
  });
  const sidesCat = await prisma.category.create({
    data: { name: 'Sides', description: 'Fries, onion rings and more', restaurantId: burgerHouse.id },
  });
  const drinksCat2 = await prisma.category.create({
    data: { name: 'Drinks', description: 'Beverages', restaurantId: burgerHouse.id },
  });

  const burgerItems = [
    { name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, pickles, ketchup', price: 8.99 },
    { name: 'Double Smash', description: 'Double smashed beef patty, american cheese, special sauce', price: 12.99 },
    { name: 'Crispy Chicken', description: 'Crispy fried chicken, coleslaw, mayo', price: 10.99 },
    { name: 'Veggie Burger', description: 'Plant-based patty, avocado, lettuce, tomato', price: 9.99 },
  ];
  for (const item of burgerItems) {
    await prisma.menuItem.create({
      data: { ...item, categoryId: burgersCat.id, menuId: burgerMenu.id, restaurantId: burgerHouse.id },
    });
  }

  const sidesItems = [
    { name: 'French Fries', description: 'Crispy golden fries', price: 3.50 },
    { name: 'Onion Rings', description: 'Beer-battered onion rings', price: 4.00 },
    { name: 'Coleslaw', description: 'Creamy homemade coleslaw', price: 2.50 },
  ];
  for (const item of sidesItems) {
    await prisma.menuItem.create({
      data: { ...item, categoryId: sidesCat.id, menuId: burgerMenu.id, restaurantId: burgerHouse.id },
    });
  }

  await prisma.menuItem.create({
    data: { name: 'Milkshake', description: 'Vanilla, chocolate or strawberry', price: 5.99, categoryId: drinksCat2.id, restaurantId: burgerHouse.id },
  });

  for (const day of days) {
    await prisma.operatingHours.create({
      data: {
        restaurantId: burgerHouse.id,
        dayOfWeek: day,
        openTime: '10:00',
        closeTime: '22:00',
        isClosed: false,
      },
    });
  }

  // ==================== RESTAURANT 3: Sushi Garden ====================
  const sushiGarden = await prisma.restaurant.create({
    data: {
      name: 'Sushi Garden',
      country: 'Tunisia',
      city: 'Sousse',
      address: '8 Boulevard de la Corniche, Sousse',
      email: 'sushigarden@snackrapido.com',
      phone_number: 21655544433,
      password: hashedPassword,
      coordinates: { type: 'Point', coordinates: [10.6412, 35.8256] },
    },
  });
  console.log(`✅ Restaurant: ${sushiGarden.name} (${sushiGarden.id})`);

  const sushiMenu = await prisma.menu.create({
    data: { name: 'Sushi Menu', restaurantId: sushiGarden.id },
  });

  const rollsCat = await prisma.category.create({
    data: { name: 'Rolls', description: 'Maki and specialty rolls', restaurantId: sushiGarden.id },
  });
  const nigiriCat = await prisma.category.create({
    data: { name: 'Nigiri & Sashimi', description: 'Fresh fish over rice', restaurantId: sushiGarden.id },
  });
  const drinksCat3 = await prisma.category.create({
    data: { name: 'Drinks', description: 'Japanese beverages', restaurantId: sushiGarden.id },
  });

  const rollItems = [
    { name: 'California Roll', description: 'Crab, avocado, cucumber (8 pcs)', price: 9.99 },
    { name: 'Spicy Tuna Roll', description: 'Tuna, spicy mayo, cucumber (8 pcs)', price: 12.99 },
    { name: 'Dragon Roll', description: 'Shrimp tempura, avocado, eel sauce (8 pcs)', price: 14.99 },
    { name: 'Rainbow Roll', description: 'California roll topped with assorted fish (8 pcs)', price: 16.99 },
  ];
  for (const item of rollItems) {
    await prisma.menuItem.create({
      data: { ...item, categoryId: rollsCat.id, menuId: sushiMenu.id, restaurantId: sushiGarden.id },
    });
  }

  const nigiriItems = [
    { name: 'Salmon Nigiri', description: 'Fresh salmon over seasoned rice (2 pcs)', price: 6.99 },
    { name: 'Tuna Sashimi', description: 'Fresh tuna slices (5 pcs)', price: 11.99 },
  ];
  for (const item of nigiriItems) {
    await prisma.menuItem.create({
      data: { ...item, categoryId: nigiriCat.id, menuId: sushiMenu.id, restaurantId: sushiGarden.id },
    });
  }

  await prisma.menuItem.create({
    data: { name: 'Green Tea', description: 'Hot or iced Japanese green tea', price: 3.00, categoryId: drinksCat3.id, restaurantId: sushiGarden.id },
  });

  for (const day of days) {
    await prisma.operatingHours.create({
      data: {
        restaurantId: sushiGarden.id,
        dayOfWeek: day,
        openTime: '12:00',
        closeTime: '22:30',
        isClosed: day === 'Monday',
      },
    });
  }

  // Summary
  const totalRestaurants = await prisma.restaurant.count();
  const totalMenuItems = await prisma.menuItem.count();
  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Restaurants: ${totalRestaurants}`);
  console.log(`   Menu items:  ${totalMenuItems}`);
  console.log('\n📋 Restaurant login credentials (password: Password123!):');
  console.log(`   pizzapalace@snackrapido.com  → id: ${pizzaPalace.id}`);
  console.log(`   burgerhouse@snackrapido.com  → id: ${burgerHouse.id}`);
  console.log(`   sushigarden@snackrapido.com  → id: ${sushiGarden.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
