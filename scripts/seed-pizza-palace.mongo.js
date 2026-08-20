/*
 * Injects a Glovo-style catalogue for "Pizza Palace TikTak".
 *
 * Run with:
 *   mongosh "mongodb://localhost:27019/snackrapido_restaurants?replicaSet=rs0&directConnection=true" \
 *     --quiet Food-Delivery-WebApp/scripts/seed-pizza-palace.mongo.js
 *
 * Written to be idempotent: it wipes only THIS restaurant's menu graph
 * (menus, categories, items, images, reviews, option groups/options, hours)
 * and rebuilds it, so it can be re-run safely. It never touches other
 * restaurants or the Restaurant document itself beyond setting coordinates.
 *
 * Type notes (see why the tests were done): relation foreign keys are stored
 * as BSON ObjectId, and Prisma `Int` fields (calories, minSelect, maxSelect,
 * displayOrder) must be BSON int32 — hence NumberInt(...) — or Prisma throws
 * "Failed to convert" when it reads a double back. `Float` fields (price,
 * priceDelta, estimatedPrice) are plain JS numbers (BSON double).
 */

const RID = ObjectId('6a632feb02b27b8f7974efcf');
const now = new Date();

const restaurant = db.Restaurant.findOne({ _id: RID });
if (!restaurant) {
  throw new Error('Restaurant 6a632feb02b27b8f7974efcf not found — aborting.');
}
print('Seeding catalogue for: ' + restaurant.name);

// --- 1. Clean up any previous run, scoped strictly to this restaurant ------
const priorItems = db.MenuItem.find({ restaurantId: RID }, { _id: 1 }).toArray().map((d) => d._id);
db.ItemOption.deleteMany({ restaurantId: RID });
db.OptionGroup.deleteMany({ restaurantId: RID });
db.Images.deleteMany({ foodId: { $in: priorItems } });
db.Reviews.deleteMany({ foodId: { $in: priorItems } });
db.MenuItem.deleteMany({ restaurantId: RID });
db.Category.deleteMany({ restaurantId: RID });
db.Menu.deleteMany({ restaurantId: RID });
db.OperatingHours.deleteMany({ restaurantId: RID });
print('Cleared previous menu graph (' + priorItems.length + ' old items).');

// --- 2. Coordinates (Habib Bourguiba Ave, Tunis) so it appears in geo search
db.Restaurant.updateOne(
  { _id: RID },
  { $set: { coordinates: { type: 'Point', coordinates: [10.1817, 36.7992] }, updatedAt: now } },
);

// --- 3. Menu -----------------------------------------------------------------
const menuId = new ObjectId();
db.Menu.insertOne({ _id: menuId, name: 'Main Menu', restaurantId: RID, createdAt: now, updatedAt: now });

// --- 4. Categories -----------------------------------------------------------
function makeCategory(name, description) {
  const _id = new ObjectId();
  db.Category.insertOne({ _id, name, description, restaurantId: RID, createdAt: now, updatedAt: now });
  return _id;
}
const catPizza = makeCategory('Pizzas', 'Wood-fired pizzas, made to order');
const catSides = makeCategory('Sides', 'Perfect companions for your pizza');
const catDrinks = makeCategory('Drinks', 'Chilled soft drinks and juices');
const catDesserts = makeCategory('Desserts', 'Sweet endings');

// --- 5. Helpers for items, images and option groups -------------------------
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// opts: [{ name, priceDelta, available? }]
function addGroup(menuItemId, name, required, minSelect, maxSelect, displayOrder, opts) {
  const groupId = new ObjectId();
  db.OptionGroup.insertOne({
    _id: groupId,
    menuItemId,
    restaurantId: RID,
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
      restaurantId: RID,
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

// Returns the new item's _id. estimatedPrice/calories optional.
function addItem(name, description, price, categoryId, calories, opts) {
  opts = opts || {};
  const _id = new ObjectId();
  const doc = {
    _id,
    name,
    description,
    price,
    available: opts.available !== false,
    categoryId,
    menuId,
    restaurantId: RID,
    createdAt: now,
    updatedAt: now,
  };
  if (opts.estimatedPrice != null) doc.estimatedPrice = opts.estimatedPrice;
  if (calories != null) doc.calories = NumberInt(calories);
  db.MenuItem.insertOne(doc);

  db.Images.insertOne({
    _id: new ObjectId(),
    public_id: 'snackrapido/pizza-palace/' + slug(name),
    url: 'https://picsum.photos/seed/' + slug(name) + '/640/480',
    foodId: _id,
  });
  return _id;
}

// Reusable option sets for pizzas -------------------------------------------
function pizzaSizeOpts() {
  return [
    { name: 'Small (26cm)', priceDelta: 0 },
    { name: 'Medium (32cm)', priceDelta: 3 },
    { name: 'Large (40cm)', priceDelta: 6 },
  ];
}
function pizzaCrustOpts() {
  return [
    { name: 'Classic', priceDelta: 0 },
    { name: 'Thin & crispy', priceDelta: 0 },
    { name: 'Stuffed cheese crust', priceDelta: 2.5 },
  ];
}
function pizzaToppingOpts() {
  return [
    { name: 'Extra mozzarella', priceDelta: 1.5 },
    { name: 'Mushrooms', priceDelta: 1 },
    { name: 'Black olives', priceDelta: 1 },
    { name: 'Extra pepperoni', priceDelta: 2 },
    { name: 'Jalapeños', priceDelta: 1 },
    { name: 'Red onions', priceDelta: 0.5 },
  ];
}
function attachPizzaGroups(itemId) {
  addGroup(itemId, 'Choose your size', true, 1, 1, 0, pizzaSizeOpts());
  addGroup(itemId, 'Choose your crust', true, 1, 1, 1, pizzaCrustOpts());
  addGroup(itemId, 'Extra toppings', false, 0, 5, 2, pizzaToppingOpts());
}

// --- 6. Pizzas ---------------------------------------------------------------
attachPizzaGroups(addItem('Margherita', 'San Marzano tomato, fior di latte mozzarella, fresh basil', 12.0, catPizza, 266, { estimatedPrice: 14.0 }));
attachPizzaGroups(addItem('Pepperoni', 'Loaded with spicy pepperoni and mozzarella', 15.5, catPizza, 298));
attachPizzaGroups(addItem('Quattro Formaggi', 'Mozzarella, gorgonzola, parmesan and emmental', 16.0, catPizza, 320));
attachPizzaGroups(addItem('Vegetariana', 'Peppers, mushrooms, onions, olives and sweetcorn', 14.0, catPizza, 240, { estimatedPrice: 16.0 }));
attachPizzaGroups(addItem('Tuna & Onion', 'Tuna, red onion, capers and mozzarella', 15.0, catPizza, 280));

// --- 7. Sides ----------------------------------------------------------------
const garlicBread = addItem('Garlic Bread', 'Oven-baked flatbread with garlic butter and herbs', 5.0, catSides, 180);
addGroup(garlicBread, 'Add a dip', false, 0, 2, 0, [
  { name: 'Marinara', priceDelta: 0 },
  { name: 'Cheese dip', priceDelta: 0.75 },
  { name: 'Garlic mayo', priceDelta: 0.75 },
]);

const wings = addItem('Chicken Wings (6 pcs)', 'Crispy wings tossed in your choice of sauce', 8.5, catSides, 430);
addGroup(wings, 'Choose your sauce', true, 1, 1, 0, [
  { name: 'BBQ', priceDelta: 0 },
  { name: 'Buffalo', priceDelta: 0 },
  { name: 'Harissa honey', priceDelta: 0.5 },
  { name: 'Garlic parmesan', priceDelta: 0.5 },
]);
addGroup(wings, 'Make it a combo', false, 0, 1, 1, [
  { name: 'Add fries & a soft drink', priceDelta: 4 },
]);

const mozzaSticks = addItem('Mozzarella Sticks (6 pcs)', 'Golden-fried mozzarella served with marinara', 6.5, catSides, 350);
addGroup(mozzaSticks, 'Add a dip', false, 0, 2, 0, [
  { name: 'Marinara', priceDelta: 0 },
  { name: 'Cheese dip', priceDelta: 0.75 },
  { name: 'Garlic mayo', priceDelta: 0.75 },
]);

// --- 8. Drinks ---------------------------------------------------------------
const cola = addItem('Coca-Cola', 'Chilled classic Coca-Cola', 2.5, catDrinks, 139);
addGroup(cola, 'Choose your size', true, 1, 1, 0, [
  { name: '33cl can', priceDelta: 0 },
  { name: '50cl bottle', priceDelta: 1 },
  { name: '1L bottle', priceDelta: 2 },
]);
addItem('Still Water 50cl', 'Bottled mineral water', 1.5, catDrinks, 0);
addItem('Fresh Orange Juice', 'Freshly squeezed orange juice', 4.0, catDrinks, 110);

// --- 9. Desserts -------------------------------------------------------------
addItem('Tiramisu', 'Classic coffee-soaked mascarpone dessert', 6.0, catDesserts, 420);
const lava = addItem('Chocolate Lava Cake', 'Warm cake with a molten chocolate centre', 6.5, catDesserts, 480);
addGroup(lava, 'Add ice cream', false, 0, 1, 0, [
  { name: 'Vanilla scoop', priceDelta: 1.5 },
]);

// --- 10. Operating hours -----------------------------------------------------
const week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
week.forEach((day) => {
  const isWeekend = day === 'Friday' || day === 'Saturday';
  db.OperatingHours.insertOne({
    _id: new ObjectId(),
    restaurantId: RID,
    dayOfWeek: day,
    openTime: '11:00',
    closeTime: isWeekend ? '00:30' : '23:00',
    isClosed: false,
    createdAt: now,
    updatedAt: now,
  });
});

// --- 11. Summary -------------------------------------------------------------
print('--- Done ---');
print('Menus:          ' + db.Menu.countDocuments({ restaurantId: RID }));
print('Categories:     ' + db.Category.countDocuments({ restaurantId: RID }));
print('MenuItems:      ' + db.MenuItem.countDocuments({ restaurantId: RID }));
print('Images:         ' + db.Images.countDocuments({ foodId: { $in: db.MenuItem.find({ restaurantId: RID }, { _id: 1 }).toArray().map((d) => d._id) } }));
print('OptionGroups:   ' + db.OptionGroup.countDocuments({ restaurantId: RID }));
print('ItemOptions:    ' + db.ItemOption.countDocuments({ restaurantId: RID }));
print('OperatingHours: ' + db.OperatingHours.countDocuments({ restaurantId: RID }));
