/*
 * Seeds a Glovo-style restaurant cluster around Sousse Bouhsina so nearby
 * discovery and restaurant-detail work against a real GPS pin in that quarter.
 *
 * Run with:
 *   mongosh "mongodb://localhost:27019/snackrapido_restaurants?replicaSet=rs0&directConnection=true" \
 *     --quiet Food-Delivery-WebApp/scripts/seed-sousse-bohsina.mongo.js
 *
 * Idempotent: upserts by email, wipes only that restaurant's menu graph, then
 * rebuilds it. Also relocates Pizza Palace TikTak (the owned test restaurant)
 * into Bouhsina without touching its existing catalogue.
 *
 * Type notes: relation FKs are BSON ObjectId. Prisma Int fields (calories,
 * minSelect, maxSelect, displayOrder) must be NumberInt(...) or Prisma throws
 * "Failed to convert". Float prices stay as JS numbers (BSON double).
 *
 * Login for every new restaurant: Password123!
 */

const PASSWORD = '$2b$10$NIZaG.FQ0IVzet46pOgvsuI.FwNog4r1JVrXPqu837UAhvrl4n2P.';
const now = new Date();
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Bouhsina quarter ≈ 35.8181 N, 10.6108 E  → GeoJSON [lng, lat]
const BOHSINA = [10.6108, 35.8181];

function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function wipeMenuGraph(rid) {
  const priorItems = db.MenuItem.find({ restaurantId: rid }, { _id: 1 }).toArray().map((d) => d._id);
  db.ItemOption.deleteMany({ restaurantId: rid });
  db.OptionGroup.deleteMany({ restaurantId: rid });
  if (priorItems.length) {
    db.Images.deleteMany({ foodId: { $in: priorItems } });
    db.Reviews.deleteMany({ foodId: { $in: priorItems } });
  }
  db.MenuItem.deleteMany({ restaurantId: rid });
  db.Category.deleteMany({ restaurantId: rid });
  db.Menu.deleteMany({ restaurantId: rid });
  db.OperatingHours.deleteMany({ restaurantId: rid });
}

function upsertRestaurant(spec) {
  const existing = db.Restaurant.findOne({ email: spec.email });
  const rid = existing ? existing._id : new ObjectId();
  const doc = {
    name: spec.name,
    country: 'Tunisia',
    city: 'Sousse',
    address: spec.address,
    email: spec.email,
    phone_number: spec.phone,
    password: PASSWORD,
    coordinates: { type: 'Point', coordinates: spec.coordinates },
    updatedAt: now,
  };
  if (existing) {
    db.Restaurant.updateOne({ _id: rid }, { $set: doc });
    wipeMenuGraph(rid);
    print('REFRESH: ' + spec.name + '  ' + spec.coordinates.join(',') + '  ' + rid);
  } else {
    db.Restaurant.insertOne({ _id: rid, ...doc, createdAt: now });
    print('CREATED:  ' + spec.name + '  ' + spec.coordinates.join(',') + '  ' + rid);
  }
  return rid;
}

function addHours(rid, openWeekday, closeWeekday, openWeekend, closeWeekend) {
  WEEK.forEach((day) => {
    const weekend = day === 'Friday' || day === 'Saturday';
    db.OperatingHours.insertOne({
      _id: new ObjectId(),
      restaurantId: rid,
      dayOfWeek: day,
      openTime: weekend ? openWeekend : openWeekday,
      closeTime: weekend ? closeWeekend : closeWeekday,
      isClosed: false,
      createdAt: now,
      updatedAt: now,
    });
  });
}

function makeMenu(rid, name) {
  const _id = new ObjectId();
  db.Menu.insertOne({ _id, name, restaurantId: rid, createdAt: now, updatedAt: now });
  return _id;
}

function makeCategory(rid, name, description) {
  const _id = new ObjectId();
  db.Category.insertOne({ _id, name, description, restaurantId: rid, createdAt: now, updatedAt: now });
  return _id;
}

function addItem(ctx, name, description, price, categoryId, calories, extra) {
  extra = extra || {};
  const _id = new ObjectId();
  const doc = {
    _id,
    name,
    description,
    price,
    available: extra.available !== false,
    categoryId,
    menuId: ctx.menuId,
    restaurantId: ctx.rid,
    createdAt: now,
    updatedAt: now,
  };
  if (extra.estimatedPrice != null) doc.estimatedPrice = extra.estimatedPrice;
  if (calories != null) doc.calories = NumberInt(calories);
  db.MenuItem.insertOne(doc);
  db.Images.insertOne({
    _id: new ObjectId(),
    public_id: 'snackrapido/' + ctx.slug + '/' + slug(name),
    url: 'https://picsum.photos/seed/' + ctx.slug + '-' + slug(name) + '/640/480',
    foodId: _id,
  });
  return _id;
}

function addGroup(ctx, menuItemId, name, required, minSelect, maxSelect, displayOrder, opts) {
  const groupId = new ObjectId();
  db.OptionGroup.insertOne({
    _id: groupId,
    menuItemId,
    restaurantId: ctx.rid,
    name,
    required,
    minSelect: NumberInt(minSelect),
    maxSelect: NumberInt(maxSelect),
    displayOrder: NumberInt(displayOrder),
    createdAt: now,
    updatedAt: now,
  });
  opts.forEach((o, i) => {
    db.ItemOption.insertOne({
      _id: new ObjectId(),
      optionGroupId: groupId,
      restaurantId: ctx.rid,
      name: o.name,
      priceDelta: o.priceDelta,
      available: o.available !== false,
      displayOrder: NumberInt(i),
      createdAt: now,
      updatedAt: now,
    });
  });
  return groupId;
}

function drinkSizeOpts() {
  return [
    { name: '33cl can', priceDelta: 0 },
    { name: '50cl bottle', priceDelta: 1 },
    { name: '1L bottle', priceDelta: 2 },
  ];
}

function sauceOpts() {
  return [
    { name: 'Harissa', priceDelta: 0 },
    { name: 'Garlic mayo', priceDelta: 0 },
    { name: 'Andalouse', priceDelta: 0 },
    { name: 'Cheese sauce', priceDelta: 0.5 },
  ];
}

// ---------------------------------------------------------------------------
// 0. Relocate Pizza Palace TikTak into Bouhsina (keep its existing catalogue)
// ---------------------------------------------------------------------------
const TIKTAK = ObjectId('6a632feb02b27b8f7974efcf');
const tiktak = db.Restaurant.findOne({ _id: TIKTAK });
if (tiktak) {
  db.Restaurant.updateOne(
    { _id: TIKTAK },
    {
      $set: {
        city: 'Sousse',
        address: 'Avenue de Bouhsina 5, Sousse',
        coordinates: { type: 'Point', coordinates: [10.6125, 35.819] },
        updatedAt: now,
      },
    },
  );
  print('MOVED:    Pizza Palace TikTak → Avenue de Bouhsina 5  [10.6125, 35.8190]');
} else {
  print('SKIP:     Pizza Palace TikTak not found — catalogue not relocated.');
}

// ---------------------------------------------------------------------------
// 1. Bohsina Shawarma House — right on the pin
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Bohsina Shawarma House',
    address: 'Avenue de Bouhsina 18, Sousse',
    email: 'bohsina.shawarma@snackrapido.test',
    phone: 21673201001,
    coordinates: BOHSINA,
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Main Menu'), slug: 'bohsina-shawarma' };
  const wraps = makeCategory(rid, 'Shawarma & Wraps', 'Freshly carved wraps, made to order');
  const plates = makeCategory(rid, 'Plates', 'Rice or fries plates with salad');
  const sides = makeCategory(rid, 'Sides & Extras', 'Fries, extras and sauces');
  const drinks = makeCategory(rid, 'Drinks', 'Cold drinks');

  const chicken = addItem(ctx, 'Chicken Shawarma Wrap', 'Marinated chicken, garlic sauce, pickles and fries inside the wrap', 9.5, wraps, 620, { estimatedPrice: 11 });
  addGroup(ctx, chicken, 'Choose your size', true, 1, 1, 0, [
    { name: 'Regular', priceDelta: 0 },
    { name: 'Large', priceDelta: 2.5 },
  ]);
  addGroup(ctx, chicken, 'Choose your sauce', true, 1, 1, 1, sauceOpts());
  addGroup(ctx, chicken, 'Add extras', false, 0, 4, 2, [
    { name: 'Extra chicken', priceDelta: 2.5 },
    { name: 'Cheese', priceDelta: 1 },
    { name: 'Extra fries inside', priceDelta: 0.8 },
    { name: 'Pickled turnip', priceDelta: 0.4 },
  ]);

  const lamb = addItem(ctx, 'Lamb Shawarma Wrap', 'Slow-roasted lamb, tahini, onion and parsley', 11.5, wraps, 710);
  addGroup(ctx, lamb, 'Choose your size', true, 1, 1, 0, [
    { name: 'Regular', priceDelta: 0 },
    { name: 'Large', priceDelta: 2.5 },
  ]);
  addGroup(ctx, lamb, 'Choose your sauce', true, 1, 1, 1, [
    { name: 'Tahini', priceDelta: 0 },
    { name: 'Garlic mayo', priceDelta: 0 },
    { name: 'Harissa', priceDelta: 0 },
  ]);

  const mixPlate = addItem(ctx, 'Mixed Shawarma Plate', 'Chicken and lamb over rice with slata mechouia and bread', 16.0, plates, 890);
  addGroup(ctx, mixPlate, 'Choose your base', true, 1, 1, 0, [
    { name: 'Rice', priceDelta: 0 },
    { name: 'Fries', priceDelta: 0 },
    { name: 'Half rice / half fries', priceDelta: 0.5 },
  ]);
  addGroup(ctx, mixPlate, 'Add extras', false, 0, 3, 1, [
    { name: 'Extra meat', priceDelta: 3 },
    { name: 'Fried egg', priceDelta: 1 },
    { name: 'Hummus scoop', priceDelta: 1.5 },
  ]);

  const falafel = addItem(ctx, 'Falafel Wrap', 'Crispy falafel, tahini, tomato and pickled veg', 7.5, wraps, 480);
  addGroup(ctx, falafel, 'Choose your sauce', true, 1, 1, 0, [
    { name: 'Tahini', priceDelta: 0 },
    { name: 'Hummus', priceDelta: 0 },
    { name: 'Harissa', priceDelta: 0 },
  ]);

  const fries = addItem(ctx, 'Loaded Fries', 'Crispy fries with your choice of topping', 6.5, sides, 540);
  addGroup(ctx, fries, 'Choose your topping', true, 1, 1, 0, [
    { name: 'Cheese sauce', priceDelta: 0 },
    { name: 'Shawarma chicken', priceDelta: 2 },
    { name: 'Mix cheese + chicken', priceDelta: 3 },
  ]);

  const cola = addItem(ctx, 'Coca-Cola', 'Chilled Coca-Cola', 2.5, drinks, 139);
  addGroup(ctx, cola, 'Choose your size', true, 1, 1, 0, drinkSizeOpts());
  addItem(ctx, 'Ayran', 'Salted yoghurt drink', 2.0, drinks, 90);
  addItem(ctx, 'Still Water 50cl', 'Bottled mineral water', 1.5, drinks, 0);
  addHours(rid, '11:00', '23:30', '11:00', '01:00');
}

// ---------------------------------------------------------------------------
// 2. Cité Olympique Grill — ~500m north
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Cité Olympique Grill',
    address: "Cité Olympique, Rue de l'Olympiade 7, Sousse",
    email: 'olympique.grill@snackrapido.test',
    phone: 21673201002,
    coordinates: [10.6165, 35.822],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Grill Menu'), slug: 'olympique-grill' };
  const grill = makeCategory(rid, 'Grills', 'Charcoal-grilled meats');
  const sandwiches = makeCategory(rid, 'Sandwiches', 'Baguette sandwiches');
  const sides = makeCategory(rid, 'Sides', 'Salads and extras');
  const drinks = makeCategory(rid, 'Drinks', 'Cold drinks');

  const mixed = addItem(ctx, 'Mixed Grill Platter', 'Lamb chops, chicken skewers and merguez with slata and bread', 24.5, grill, 980, { estimatedPrice: 27 });
  addGroup(ctx, mixed, 'Choose your size', true, 1, 1, 0, [
    { name: 'For 1', priceDelta: 0 },
    { name: 'For 2', priceDelta: 14 },
  ]);
  addGroup(ctx, mixed, 'Choose your sides', true, 1, 2, 1, [
    { name: 'Fries', priceDelta: 0 },
    { name: 'Grilled vegetables', priceDelta: 0 },
    { name: 'Rice', priceDelta: 0 },
    { name: 'Mloukhia rice', priceDelta: 1.5 },
  ]);

  const chops = addItem(ctx, 'Lamb Chops', 'Three charcoal-grilled chops with chermoula', 22.0, grill, 740);
  addGroup(ctx, chops, 'How do you like it?', true, 1, 1, 0, [
    { name: 'Medium', priceDelta: 0 },
    { name: 'Well done', priceDelta: 0 },
    { name: 'Pink', priceDelta: 0 },
  ]);

  const merguez = addItem(ctx, 'Merguez Sandwich', 'Spicy lamb sausage in a fresh baguette with slata', 8.5, sandwiches, 610);
  addGroup(ctx, merguez, 'Choose your sauce', true, 1, 1, 0, sauceOpts());
  addGroup(ctx, merguez, 'Make it a combo', false, 0, 1, 1, [
    { name: 'Add fries & a soft drink', priceDelta: 4 },
  ]);

  const chicken = addItem(ctx, 'Chicken Skewers (3 pcs)', 'Marinated chicken brochettes with lemon', 13.5, grill, 520);
  addGroup(ctx, chicken, 'Choose your marinade', true, 1, 1, 0, [
    { name: 'Lemon & herb', priceDelta: 0 },
    { name: 'Harissa', priceDelta: 0 },
    { name: 'Garlic yoghurt', priceDelta: 0 },
  ]);

  addItem(ctx, 'Slata Mechouia', 'Grilled pepper and tomato salad with tuna and egg', 6.0, sides, 220);
  addItem(ctx, 'Ojja Merguez', 'Spicy tomato and egg stew with merguez', 10.5, sides, 480);
  const cola = addItem(ctx, 'Coca-Cola', 'Chilled Coca-Cola', 2.5, drinks, 139);
  addGroup(ctx, cola, 'Choose your size', true, 1, 1, 0, drinkSizeOpts());
  addItem(ctx, 'Mint Tea', 'Tunisian mint tea, served hot', 2.0, drinks, 30);
  addHours(rid, '12:00', '23:00', '12:00', '00:30');
}

// ---------------------------------------------------------------------------
// 3. Jawhara Pizza Express — ~1.5km NE
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Jawhara Pizza Express',
    address: 'Avenue de Jawhara 22, Sousse',
    email: 'jawhara.pizza@snackrapido.test',
    phone: 21673201003,
    coordinates: [10.625, 35.828],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Pizza Menu'), slug: 'jawhara-pizza' };
  const pizzas = makeCategory(rid, 'Pizzas', 'Wood-fired, made to order');
  const pasta = makeCategory(rid, 'Pasta', 'Fresh pasta dishes');
  const sides = makeCategory(rid, 'Sides', 'Garlic bread and salads');
  const drinks = makeCategory(rid, 'Drinks', 'Soft drinks and juices');

  const pizzaGroups = (itemId) => {
    addGroup(ctx, itemId, 'Choose your size', true, 1, 1, 0, [
      { name: 'Small (26cm)', priceDelta: 0 },
      { name: 'Medium (32cm)', priceDelta: 3 },
      { name: 'Large (40cm)', priceDelta: 6 },
    ]);
    addGroup(ctx, itemId, 'Choose your crust', true, 1, 1, 1, [
      { name: 'Classic', priceDelta: 0 },
      { name: 'Thin & crispy', priceDelta: 0 },
      { name: 'Stuffed cheese crust', priceDelta: 2.5 },
    ]);
    addGroup(ctx, itemId, 'Extra toppings', false, 0, 5, 2, [
      { name: 'Extra mozzarella', priceDelta: 1.5 },
      { name: 'Mushrooms', priceDelta: 1 },
      { name: 'Black olives', priceDelta: 1 },
      { name: 'Tuna', priceDelta: 2 },
      { name: 'Harissa drizzle', priceDelta: 0.5 },
      { name: 'Egg', priceDelta: 1 },
    ]);
  };

  pizzaGroups(addItem(ctx, 'Margherita', 'San Marzano tomato, fior di latte, fresh basil', 12.0, pizzas, 266, { estimatedPrice: 14 }));
  pizzaGroups(addItem(ctx, 'Tunisian Thon', 'Tuna, olives, capers, onion and harissa', 15.0, pizzas, 310));
  pizzaGroups(addItem(ctx, 'Pepperoni', 'Spicy pepperoni and mozzarella', 15.5, pizzas, 298));
  pizzaGroups(addItem(ctx, 'Vegetariana', 'Peppers, mushrooms, onions, olives and sweetcorn', 14.0, pizzas, 240));
  pizzaGroups(addItem(ctx, 'Quatre Fromages', 'Mozzarella, gorgonzola, parmesan and emmental', 16.0, pizzas, 320));

  const carbonara = addItem(ctx, 'Spaghetti Carbonara', 'Eggs, pancetta, parmesan, black pepper', 13.5, pasta, 640);
  addGroup(ctx, carbonara, 'Choose your pasta', true, 1, 1, 0, [
    { name: 'Spaghetti', priceDelta: 0 },
    { name: 'Penne', priceDelta: 0 },
    { name: 'Tagliatelle', priceDelta: 0.5 },
  ]);
  addGroup(ctx, carbonara, 'Add extras', false, 0, 2, 1, [
    { name: 'Extra pancetta', priceDelta: 2 },
    { name: 'Parmesan shavings', priceDelta: 1 },
  ]);

  const garlic = addItem(ctx, 'Garlic Bread', 'Oven-baked flatbread with garlic butter', 5.0, sides, 180);
  addGroup(ctx, garlic, 'Add a dip', false, 0, 2, 0, [
    { name: 'Marinara', priceDelta: 0 },
    { name: 'Cheese dip', priceDelta: 0.75 },
    { name: 'Garlic mayo', priceDelta: 0.75 },
  ]);
  addItem(ctx, 'Caesar Salad', 'Romaine, parmesan, croutons, Caesar dressing', 8.0, sides, 310);

  const cola = addItem(ctx, 'Coca-Cola', 'Chilled Coca-Cola', 2.5, drinks, 139);
  addGroup(ctx, cola, 'Choose your size', true, 1, 1, 0, drinkSizeOpts());
  addItem(ctx, 'Fresh Orange Juice', 'Squeezed to order', 4.0, drinks, 110);
  addHours(rid, '11:00', '23:00', '11:00', '00:30');
}

// ---------------------------------------------------------------------------
// 4. Sahloul Sushi Bar — ~2.5km NW
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Sahloul Sushi Bar',
    address: "Sahloul 4, Boulevard de l'Environnement, Sousse",
    email: 'sahloul.sushi@snackrapido.test',
    phone: 21673201004,
    coordinates: [10.598, 35.836],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Sushi Menu'), slug: 'sahloul-sushi' };
  const rolls = makeCategory(rid, 'Rolls', 'Maki and specialty rolls');
  const nigiri = makeCategory(rid, 'Nigiri & Sashimi', 'Fresh fish over rice');
  const bowls = makeCategory(rid, 'Bowls', 'Rice bowls and warm dishes');
  const drinks = makeCategory(rid, 'Drinks', 'Japanese-inspired drinks');

  const cali = addItem(ctx, 'California Roll (8 pcs)', 'Crab, avocado, cucumber', 12.5, rolls, 320);
  addGroup(ctx, cali, 'Inside-out style', true, 1, 1, 0, [
    { name: 'Classic sesame', priceDelta: 0 },
    { name: 'Tobiko topping', priceDelta: 1.5 },
  ]);
  addGroup(ctx, cali, 'Add extras', false, 0, 2, 1, [
    { name: 'Spicy mayo', priceDelta: 0.5 },
    { name: 'Eel sauce', priceDelta: 0.5 },
  ]);

  const spicy = addItem(ctx, 'Spicy Tuna Roll (8 pcs)', 'Tuna, spicy mayo, scallions', 14.5, rolls, 340);
  addGroup(ctx, spicy, 'Heat level', true, 1, 1, 0, [
    { name: 'Mild', priceDelta: 0 },
    { name: 'Medium', priceDelta: 0 },
    { name: 'Extra spicy', priceDelta: 0 },
  ]);

  const dragon = addItem(ctx, 'Dragon Roll (8 pcs)', 'Shrimp tempura, avocado, eel sauce', 16.5, rolls, 410);
  addGroup(ctx, dragon, 'Add extras', false, 0, 2, 0, [
    { name: 'Extra eel', priceDelta: 3 },
    { name: 'Spicy mayo drizzle', priceDelta: 0.5 },
  ]);

  const salmon = addItem(ctx, 'Salmon Nigiri (6 pcs)', 'Fresh salmon over seasoned rice', 15.0, nigiri, 280);
  addGroup(ctx, salmon, 'Wasabi', true, 1, 1, 0, [
    { name: 'On the side', priceDelta: 0 },
    { name: 'Under the fish', priceDelta: 0 },
    { name: 'No wasabi', priceDelta: 0 },
  ]);

  addItem(ctx, 'Salmon Sashimi (8 pcs)', 'Sliced salmon, no rice', 18.0, nigiri, 220);
  const poke = addItem(ctx, 'Salmon Poke Bowl', 'Cubed salmon, rice, edamame, avocado, sesame', 15.5, bowls, 540);
  addGroup(ctx, poke, 'Choose your base', true, 1, 1, 0, [
    { name: 'Sushi rice', priceDelta: 0 },
    { name: 'Brown rice', priceDelta: 0 },
    { name: 'Mixed greens', priceDelta: 0 },
  ]);
  addGroup(ctx, poke, 'Add extras', false, 0, 3, 1, [
    { name: 'Extra salmon', priceDelta: 3.5 },
    { name: 'Avocado', priceDelta: 1.5 },
    { name: 'Crispy onions', priceDelta: 0.8 },
  ]);

  addItem(ctx, 'Miso Soup', 'Tofu, seaweed and scallions', 4.5, bowls, 70);
  addItem(ctx, 'Green Tea', 'Hot sencha', 2.5, drinks, 0);
  addItem(ctx, 'Ramune', 'Japanese lemonade', 3.5, drinks, 120);
  addHours(rid, '12:00', '22:30', '12:00', '23:30');
}

// ---------------------------------------------------------------------------
// 5. Khzema Catch — ~3km NE toward the coast
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Khzema Catch',
    address: 'Khzema Est, Rue de la Plage 9, Sousse',
    email: 'khzema.catch@snackrapido.test',
    phone: 21673201005,
    coordinates: [10.638, 35.841],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Seafood Menu'), slug: 'khzema-catch' };
  const grill = makeCategory(rid, 'Grilled Fish', 'Catch of the day, charcoal grilled');
  const fried = makeCategory(rid, 'Fried & Mezze', 'Lightly fried seafood and starters');
  const drinks = makeCategory(rid, 'Drinks', 'Soft drinks and juices');

  const bass = addItem(ctx, 'Grilled Sea Bass', 'Whole sea bass with lemon, olive oil and herbs', 29.0, grill, 420, { estimatedPrice: 32 });
  addGroup(ctx, bass, 'How is it cooked?', true, 1, 1, 0, [
    { name: 'Grilled whole', priceDelta: 0 },
    { name: 'Filleted', priceDelta: 2 },
  ]);
  addGroup(ctx, bass, 'Choose your sides', true, 1, 2, 1, [
    { name: 'Fries', priceDelta: 0 },
    { name: 'Grilled vegetables', priceDelta: 0 },
    { name: 'Rice', priceDelta: 0 },
    { name: 'Slata mechouia', priceDelta: 1 },
  ]);

  const prawns = addItem(ctx, 'Garlic Prawns', 'Jumbo prawns sautéed in garlic butter', 26.0, grill, 380);
  addGroup(ctx, prawns, 'Spice it up', false, 0, 1, 0, [
    { name: 'Add harissa butter', priceDelta: 0.5 },
    { name: 'Add chili flakes', priceDelta: 0 },
  ]);

  const couscous = addItem(ctx, 'Seafood Couscous', 'Fish, shrimp and calamari over steamed couscous', 22.0, grill, 610);
  addGroup(ctx, couscous, 'Heat level', true, 1, 1, 0, [
    { name: 'Mild', priceDelta: 0 },
    { name: 'Harissa on the side', priceDelta: 0 },
    { name: 'Spicy', priceDelta: 0 },
  ]);

  const calamari = addItem(ctx, 'Fried Calamari', 'Lightly battered rings with tartar', 16.0, fried, 450);
  addGroup(ctx, calamari, 'Add a dip', false, 0, 2, 0, [
    { name: 'Tartar', priceDelta: 0 },
    { name: 'Garlic mayo', priceDelta: 0.5 },
    { name: 'Harissa mayo', priceDelta: 0.5 },
  ]);

  addItem(ctx, 'Octopus Salad', 'Chilled octopus, lemon, olive oil and parsley', 15.5, fried, 260);
  addItem(ctx, 'Fish Soup', 'Mediterranean broth with croutons', 9.0, fried, 180);
  addItem(ctx, 'Fresh Orange Juice', 'Squeezed to order', 4.0, drinks, 110);
  addItem(ctx, 'Still Water 50cl', 'Bottled mineral water', 1.5, drinks, 0);
  addHours(rid, '12:00', '22:30', '12:00', '23:30');
}

// ---------------------------------------------------------------------------
// 6. Medina Couscous & Tajine — Sousse médina ~3km east
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Medina Couscous & Tajine',
    address: 'Rue de Paris 4, Médina, Sousse',
    email: 'sousse.medina.tajine@snackrapido.test',
    phone: 21673201006,
    coordinates: [10.6412, 35.8256],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Traditional Menu'), slug: 'medina-couscous' };
  const mains = makeCategory(rid, 'Couscous & Tajines', 'Home-style Tunisian classics');
  const starters = makeCategory(rid, 'Starters', 'Brik, soups and slata');
  const drinks = makeCategory(rid, 'Drinks', 'Tea and juices');

  const royal = addItem(ctx, 'Couscous Royal', 'Semolina with lamb, chicken, merguez and vegetables', 18.5, mains, 820, { estimatedPrice: 20 });
  addGroup(ctx, royal, 'Choose your size', true, 1, 1, 0, [
    { name: 'Regular', priceDelta: 0 },
    { name: 'Large', priceDelta: 4 },
  ]);
  addGroup(ctx, royal, 'Harissa', true, 1, 1, 1, [
    { name: 'On the side', priceDelta: 0 },
    { name: 'Mixed in', priceDelta: 0 },
    { name: 'No harissa', priceDelta: 0 },
  ]);

  const lambTajine = addItem(ctx, 'Lamb Tajine', 'Slow-cooked lamb with prunes and almonds', 19.0, mains, 760);
  addGroup(ctx, lambTajine, 'Choose your bread', true, 1, 1, 0, [
    { name: 'Khobz tabouna', priceDelta: 0 },
    { name: 'Baguette', priceDelta: 0 },
    { name: 'No bread', priceDelta: 0 },
  ]);

  addItem(ctx, 'Tajine Malsouka', 'Baked egg and cheese tajine with parsley', 12.0, mains, 430);
  addItem(ctx, 'Brik à l\'œuf', 'Crispy pastry with egg, tuna and capers', 4.5, starters, 280);
  addItem(ctx, 'Lablabi', 'Chickpea soup with cumin, harissa and stale bread', 6.0, starters, 350);
  addItem(ctx, 'Slata Tunisienne', 'Tomato, cucumber, onion, tuna and olives', 5.5, starters, 190);

  addItem(ctx, 'Mint Tea', 'Tunisian mint tea with pine nuts', 2.5, drinks, 40);
  addItem(ctx, 'Citronnade', 'Fresh lemon juice with mint', 3.5, drinks, 90);
  addHours(rid, '11:30', '22:00', '11:30', '23:00');
}

// ---------------------------------------------------------------------------
// 7. Bouhsina Breakfast Corner — ~250m south of the pin
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Bouhsina Breakfast Corner',
    address: 'Rue Ibn Khaldoun 3, Bouhsina, Sousse',
    email: 'bohsina.breakfast@snackrapido.test',
    phone: 21673201007,
    coordinates: [10.608, 35.8165],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'All-day Breakfast'), slug: 'bohsina-breakfast' };
  const plates = makeCategory(rid, 'Breakfast Plates', 'Salty and sweet breakfasts');
  const bakery = makeCategory(rid, 'Bakery', 'Pastries and bread');
  const drinks = makeCategory(rid, 'Coffee & Juices', 'Hot and cold drinks');

  const tunisian = addItem(ctx, 'Tunisian Breakfast Plate', 'Eggs, olives, cheese, harissa, tuna and bread', 9.5, plates, 540);
  addGroup(ctx, tunisian, 'How do you like your eggs?', true, 1, 1, 0, [
    { name: 'Fried', priceDelta: 0 },
    { name: 'Omelette', priceDelta: 0 },
    { name: 'Boiled', priceDelta: 0 },
    { name: 'Ojja style', priceDelta: 1 },
  ]);
  addGroup(ctx, tunisian, 'Add extras', false, 0, 3, 1, [
    { name: 'Extra egg', priceDelta: 1 },
    { name: 'Avocado', priceDelta: 2 },
    { name: 'Merguez', priceDelta: 2.5 },
  ]);

  const avocado = addItem(ctx, 'Avocado Toast', 'Sourdough, smashed avocado, chili flakes', 8.0, plates, 380);
  addGroup(ctx, avocado, 'Add extras', false, 0, 3, 0, [
    { name: 'Poached egg', priceDelta: 1.5 },
    { name: 'Feta', priceDelta: 1 },
    { name: 'Smoked salmon', priceDelta: 3.5 },
  ]);

  const pancakes = addItem(ctx, 'Fluffy Pancakes', 'Stack of three with maple syrup', 7.5, plates, 520);
  addGroup(ctx, pancakes, 'Choose your topping', true, 1, 2, 0, [
    { name: 'Maple syrup', priceDelta: 0 },
    { name: 'Nutella', priceDelta: 1 },
    { name: 'Banana & honey', priceDelta: 1 },
    { name: 'Mixed berries', priceDelta: 1.5 },
  ]);

  addItem(ctx, 'Croissant', 'Butter croissant, baked this morning', 2.5, bakery, 270);
  addItem(ctx, 'Pain au chocolat', 'Flaky pastry with dark chocolate', 2.8, bakery, 300);

  const cappuccino = addItem(ctx, 'Cappuccino', 'Double shot with steamed milk', 3.5, drinks, 80);
  addGroup(ctx, cappuccino, 'Milk', true, 1, 1, 0, [
    { name: 'Whole milk', priceDelta: 0 },
    { name: 'Semi-skimmed', priceDelta: 0 },
    { name: 'Oat milk', priceDelta: 0.6 },
  ]);
  addGroup(ctx, cappuccino, 'Size', true, 1, 1, 1, [
    { name: 'Regular', priceDelta: 0 },
    { name: 'Large', priceDelta: 0.8 },
  ]);
  addItem(ctx, 'Fresh Orange Juice', 'Squeezed to order', 4.0, drinks, 110);
  addHours(rid, '07:00', '16:00', '08:00', '16:00');
}

// ---------------------------------------------------------------------------
// 8. Hay Riad Burger Lab — ~1km SW
// ---------------------------------------------------------------------------
{
  const rid = upsertRestaurant({
    name: 'Hay Riad Burger Lab',
    address: 'Hay Riad, Rue des Jasmins 11, Sousse',
    email: 'hayriad.burger@snackrapido.test',
    phone: 21673201008,
    coordinates: [10.602, 35.812],
  });
  const ctx = { rid, menuId: makeMenu(rid, 'Burger Menu'), slug: 'hayriad-burger' };
  const burgers = makeCategory(rid, 'Burgers', 'Smash burgers on brioche');
  const sides = makeCategory(rid, 'Sides', 'Fries and extras');
  const shakes = makeCategory(rid, 'Shakes & Drinks', 'Milkshakes and sodas');

  const burgerGroups = (itemId) => {
    addGroup(ctx, itemId, 'Choose your doneness', true, 1, 1, 0, [
      { name: 'Medium', priceDelta: 0 },
      { name: 'Well done', priceDelta: 0 },
    ]);
    addGroup(ctx, itemId, 'Choose your bun', true, 1, 1, 1, [
      { name: 'Brioche', priceDelta: 0 },
      { name: 'Sesame', priceDelta: 0 },
      { name: 'Gluten-free', priceDelta: 1.5 },
    ]);
    addGroup(ctx, itemId, 'Add extras', false, 0, 4, 2, [
      { name: 'Extra patty', priceDelta: 3.5 },
      { name: 'Cheddar', priceDelta: 1 },
      { name: 'Bacon', priceDelta: 1.5 },
      { name: 'Fried egg', priceDelta: 1 },
      { name: 'Jalapeños', priceDelta: 0.5 },
    ]);
  };

  burgerGroups(addItem(ctx, 'Classic Smash', 'Double smash, cheddar, house sauce, pickles', 12.0, burgers, 780, { estimatedPrice: 14 }));
  burgerGroups(addItem(ctx, 'Harissa Smash', 'Beef patty, harissa mayo, pickled onion', 13.5, burgers, 810));
  const chicken = addItem(ctx, 'Crispy Chicken Burger', 'Buttermilk fried chicken, slaw, pickles', 12.5, burgers, 720);
  addGroup(ctx, chicken, 'Choose your sauce', true, 1, 1, 0, [
    { name: 'House mayo', priceDelta: 0 },
    { name: 'Spicy harissa', priceDelta: 0 },
    { name: 'Honey mustard', priceDelta: 0 },
  ]);
  addGroup(ctx, chicken, 'Make it a combo', false, 0, 1, 1, [
    { name: 'Add fries & a soft drink', priceDelta: 4.5 },
  ]);
  burgerGroups(addItem(ctx, 'Veggie Bean Burger', 'House bean patty, avocado, lettuce', 11.0, burgers, 560));

  const fries = addItem(ctx, 'Loaded Cheese Fries', 'Fries, cheddar, jalapeños', 7.5, sides, 610);
  addGroup(ctx, fries, 'Add extras', false, 0, 2, 0, [
    { name: 'Bacon bits', priceDelta: 1.5 },
    { name: 'Chili beef', priceDelta: 2.5 },
  ]);
  addItem(ctx, 'Onion Rings', 'Beer-battered rings', 5.0, sides, 420);

  const shake = addItem(ctx, 'Milkshake', 'Thick shake, made to order', 6.0, shakes, 480);
  addGroup(ctx, shake, 'Choose your flavour', true, 1, 1, 0, [
    { name: 'Vanilla', priceDelta: 0 },
    { name: 'Chocolate', priceDelta: 0 },
    { name: 'Strawberry', priceDelta: 0 },
    { name: 'Oreo', priceDelta: 1 },
  ]);
  const cola = addItem(ctx, 'Coca-Cola', 'Chilled Coca-Cola', 2.5, shakes, 139);
  addGroup(ctx, cola, 'Choose your size', true, 1, 1, 0, drinkSizeOpts());
  addHours(rid, '11:00', '23:30', '11:00', '01:00');
}

// ---------------------------------------------------------------------------
// Index + summary
// ---------------------------------------------------------------------------
try {
  db.Restaurant.createIndex({ coordinates: '2dsphere' }, { name: 'coordinates_2dsphere' });
  print('INDEX:    2dsphere ensured on Restaurant.coordinates');
} catch (e) {
  print('INDEX:    ' + e.message);
}

print('');
print('--- Nearby from Bouhsina [10.6108, 35.8181] within 8km ---');
const nearby = db.Restaurant.aggregate([
  {
    $geoNear: {
      near: { type: 'Point', coordinates: BOHSINA },
      distanceField: 'distance',
      maxDistance: 8000,
      spherical: true,
    },
  },
  { $project: { name: 1, city: 1, address: 1, email: 1, km: { $round: [{ $divide: ['$distance', 1000] }, 2] } } },
]).toArray();
nearby.forEach((r) => print(r.km.toFixed(2) + ' km  ' + r.name + '  —  ' + r.address));

print('');
print('--- Sousse catalogue totals ---');
const sousseIds = db.Restaurant.find({ city: 'Sousse' }, { _id: 1 }).toArray().map((d) => d._id);
print('Restaurants:    ' + sousseIds.length);
print('Menus:          ' + db.Menu.countDocuments({ restaurantId: { $in: sousseIds } }));
print('Categories:     ' + db.Category.countDocuments({ restaurantId: { $in: sousseIds } }));
print('MenuItems:      ' + db.MenuItem.countDocuments({ restaurantId: { $in: sousseIds } }));
print('OptionGroups:   ' + db.OptionGroup.countDocuments({ restaurantId: { $in: sousseIds } }));
print('ItemOptions:    ' + db.ItemOption.countDocuments({ restaurantId: { $in: sousseIds } }));
print('OperatingHours: ' + db.OperatingHours.countDocuments({ restaurantId: { $in: sousseIds } }));
