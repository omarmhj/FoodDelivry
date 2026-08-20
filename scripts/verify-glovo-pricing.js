/**
 * End-to-end check that the server, not the client, decides what an order costs.
 *
 * Run with all of api-users (3000), api-restaurants (4001) and api-orders (4002)
 * serving, plus MongoDB, Redis and RabbitMQ up:
 *
 *   node scripts/verify-glovo-pricing.js
 *
 * It creates a required option group on one of the seeded restaurant's items,
 * then places orders that lie about prices, omit required choices, and reference
 * options belonging to nothing, asserting the server's response each time.
 */

const RESTAURANTS = 'http://localhost:4001/graphql';
const ORDERS = 'http://localhost:4002/graphql';
const USERS = 'http://localhost:3000/graphql';

const RESTAURANT_EMAIL = 'lagoulette.grill@snackrapido.test';
const RESTAURANT_PASSWORD = 'Password123!';
const CUSTOMER_EMAIL = 'john@example.com';
const CUSTOMER_PASSWORD = 'password123';

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function gql(url, query, variables, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    headers.accesstoken = auth.accessToken;
    headers.refreshtoken = auth.refreshToken;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) {
    throw new Error(body.errors.map(e => e.message).join('; '));
  }
  return body.data;
}

async function main() {
  // ---- Restaurant login -------------------------------------------------
  const rLogin = await gql(
    RESTAURANTS,
    `mutation($dto: LoginDto!) {
       LoginRestaurant(loginDto: $dto) {
         accessToken refreshToken
         restaurant { id name address menuItems { id name price available } }
         error { message }
       }
     }`,
    { dto: { email: RESTAURANT_EMAIL, password: RESTAURANT_PASSWORD } },
  );

  const r = rLogin.LoginRestaurant;
  if (r.error) throw new Error(`restaurant login failed: ${r.error.message}`);
  const restaurantAuth = { accessToken: r.accessToken, refreshToken: r.refreshToken };
  const restaurant = r.restaurant;
  const item = restaurant.menuItems.find(m => m.available);
  console.log(`\nRestaurant: ${restaurant.name} (${restaurant.id})`);
  console.log(`Item under test: ${item.name} — catalogue price ${item.price}\n`);

  // ---- Start from a known state ----------------------------------------
  // A previous interrupted run may have left groups on this item, and a stray
  // required group would make every order below fail validation.
  const existing = await gql(
    RESTAURANTS,
    `query($dto: GetMenuItemDto!) { getMenuItem(getMenuItemDto: $dto) { menuItem { optionGroups { id name } } } }`,
    { dto: { menuItemId: item.id } },
  );
  for (const stale of existing.getMenuItem.menuItem?.optionGroups ?? []) {
    await gql(
      RESTAURANTS,
      `mutation($dto: DeleteOptionGroupDto!) { deleteOptionGroup(deleteOptionGroupDto: $dto) { message } }`,
      { dto: { id: stale.id } },
      restaurantAuth,
    );
    console.log(`Removed leftover option group "${stale.name}" from a previous run.`);
  }

  // ---- Build a required, priced option group ----------------------------
  console.log('1) Owner creates a required option group');
  const created = await gql(
    RESTAURANTS,
    `mutation($dto: CreateOptionGroupDto!) {
       createOptionGroup(createOptionGroupDto: $dto) {
         message
         optionGroup {
           id name required minSelect maxSelect
           options { id name priceDelta available }
         }
         error { message }
       }
     }`,
    {
      dto: {
        menuItemId: item.id,
        name: 'Choose your sauce',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { name: 'Harissa', priceDelta: 0 },
          { name: 'Garlic aioli', priceDelta: 1.5 },
          { name: 'Chermoula', priceDelta: 2.25 },
        ],
      },
    },
    restaurantAuth,
  );

  const group = created.createOptionGroup.optionGroup;
  check('option group created with 3 options', group?.options?.length === 3);
  check('group is required with minSelect 1 / maxSelect 1', group.required && group.minSelect === 1 && group.maxSelect === 1);
  const aioli = group.options.find(o => o.name === 'Garlic aioli');

  // ---- Selection rules are validated, not assumed ----------------------
  console.log('\n2) Owner cannot define an unsatisfiable group');
  let rejectedBadRules = false;
  try {
    await gql(
      RESTAURANTS,
      `mutation($dto: CreateOptionGroupDto!) { createOptionGroup(createOptionGroupDto: $dto) { message } }`,
      { dto: { menuItemId: item.id, name: 'Impossible', required: true, minSelect: 3, maxSelect: 1 } },
      restaurantAuth,
    );
  } catch (e) {
    rejectedBadRules = /maxSelect/.test(e.message);
  }
  check('maxSelect below minSelect is refused', rejectedBadRules);

  // ---- The public item read exposes the catalogue -----------------------
  console.log('\n3) Customer app can read the option catalogue without auth');
  const detail = await gql(
    RESTAURANTS,
    `query($dto: GetMenuItemDto!) {
       getMenuItem(getMenuItemDto: $dto) {
         menuItem { id name price optionGroups { id name required options { id name priceDelta } } }
         error { message }
       }
     }`,
    { dto: { menuItemId: item.id } },
  );
  const publicGroups = detail.getMenuItem.menuItem?.optionGroups ?? [];
  check('getMenuItem returns the option groups', publicGroups.some(g => g.id === group.id));

  // ---- Customer login --------------------------------------------------
  const uLogin = await gql(
    USERS,
    `mutation($email: String!, $password: String!) {
       Login(email: $email, password: $password) {
         accessToken refreshToken user { id name email } error { message }
       }
     }`,
    { email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD },
  );
  const u = uLogin.Login;
  if (u.error) throw new Error(`customer login failed: ${u.error.message}`);
  const customerAuth = { accessToken: u.accessToken, refreshToken: u.refreshToken };
  const customer = u.user;

  const baseOrder = {
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    deliveryType: 'DELIVERY',
    deliveryAddress: '10 Test Street, Tunis',
  };

  const CREATE_ORDER = `mutation($dto: CreateOrderDto!) {
    createOrder(createOrderDto: $dto) {
      message
      order {
        id status subtotal tax deliveryFee discount total
        items { menuItemName quantity basePrice optionsTotal unitPrice totalPrice
          selectedOptions { optionId groupName name priceDelta } }
      }
      error { message }
    }
  }`;

  // ---- A client lying about the price is ignored ------------------------
  console.log('\n4) Client sends unitPrice 0.01 for a 2x order with a +1.50 option');
  const tampered = await gql(
    ORDERS,
    CREATE_ORDER,
    {
      dto: {
        ...baseOrder,
        items: [
          {
            menuItemId: item.id,
            quantity: 2,
            selectedOptionIds: [aioli.id],
            unitPrice: 0.01, // the lie
            menuItemName: 'Free Lunch', // also a lie
          },
        ],
      },
    },
    customerAuth,
  );

  const order = tampered.createOrder.order;
  if (!order) throw new Error(`order creation failed: ${JSON.stringify(tampered.createOrder.error)}`);
  const line = order.items[0];
  const expectedUnit = round(item.price + aioli.priceDelta);
  const expectedSubtotal = round(expectedUnit * 2);
  const expectedTotal = round(expectedSubtotal + round(expectedSubtotal * 0.08) + 5.99);

  console.log(`     line: base ${line.basePrice} + options ${line.optionsTotal} = unit ${line.unitPrice} x${line.quantity} = ${line.totalPrice}`);
  console.log(`     order: subtotal ${order.subtotal} + tax ${order.tax} + fee ${order.deliveryFee} = total ${order.total}`);

  check(`unitPrice is the catalogue price + option (${expectedUnit}), not 0.01`, line.unitPrice === expectedUnit, `got ${line.unitPrice}`);
  check('item name comes from the catalogue, not the request', line.menuItemName === item.name, `got ${line.menuItemName}`);
  check(`subtotal is ${expectedSubtotal}`, order.subtotal === expectedSubtotal, `got ${order.subtotal}`);
  check(`total is ${expectedTotal} (tax + delivery fee applied server-side)`, order.total === expectedTotal, `got ${order.total}`);
  check('the chosen option is recorded on the line', line.selectedOptions.length === 1 && line.selectedOptions[0].name === 'Garlic aioli');
  check('option price delta is the catalogue delta', line.selectedOptions[0].priceDelta === aioli.priceDelta);

  // ---- Required group must be satisfied --------------------------------
  console.log('\n5) Order omitting the required sauce');
  const missing = await gql(
    ORDERS,
    CREATE_ORDER,
    { dto: { ...baseOrder, items: [{ menuItemId: item.id, quantity: 1, selectedOptionIds: [] }] } },
    customerAuth,
  );
  check(
    'rejected because the required group has no selection',
    !missing.createOrder.order && /requires at least 1/.test(missing.createOrder.error?.message ?? ''),
    missing.createOrder.error?.message,
  );

  // ---- Fabricated option ids are refused -------------------------------
  console.log('\n6) Order referencing an option that does not belong to the item');
  const bogus = await gql(
    ORDERS,
    CREATE_ORDER,
    {
      dto: {
        ...baseOrder,
        items: [{ menuItemId: item.id, quantity: 1, selectedOptionIds: ['ffffffffffffffffffffffff'] }],
      },
    },
    customerAuth,
  );
  check(
    'rejected because the option id is not on this item',
    !bogus.createOrder.order && /not available for/.test(bogus.createOrder.error?.message ?? ''),
    bogus.createOrder.error?.message,
  );

  // ---- Exceeding maxSelect is refused ---------------------------------
  console.log('\n7) Order selecting two sauces when maxSelect is 1');
  const tooMany = await gql(
    ORDERS,
    CREATE_ORDER,
    {
      dto: {
        ...baseOrder,
        items: [
          {
            menuItemId: item.id,
            quantity: 1,
            selectedOptionIds: group.options.slice(0, 2).map(o => o.id),
          },
        ],
      },
    },
    customerAuth,
  );
  check(
    'rejected because more selections than maxSelect',
    !tooMany.createOrder.order && /at most 1/.test(tooMany.createOrder.error?.message ?? ''),
    tooMany.createOrder.error?.message,
  );

  // ---- The same item twice with different options is two lines ---------
  console.log('\n8) Same item ordered twice with different sauces');
  const harissa = group.options.find(o => o.name === 'Harissa');
  const chermoula = group.options.find(o => o.name === 'Chermoula');
  const twoLines = await gql(
    ORDERS,
    CREATE_ORDER,
    {
      dto: {
        ...baseOrder,
        items: [
          { menuItemId: item.id, quantity: 1, selectedOptionIds: [harissa.id], specialRequests: 'well done' },
          { menuItemId: item.id, quantity: 1, selectedOptionIds: [chermoula.id], specialRequests: 'no salt' },
        ],
      },
    },
    customerAuth,
  );
  const lines = twoLines.createOrder.order?.items ?? [];
  check('both lines are kept, not merged', lines.length === 2, `got ${lines.length}`);
  check(
    'each line is priced by its own option',
    lines[0]?.unitPrice === round(item.price + harissa.priceDelta) &&
      lines[1]?.unitPrice === round(item.price + chermoula.priceDelta),
    lines.map(l => l.unitPrice).join(' / '),
  );
  check(
    'special requests stay on the right line',
    lines[0]?.selectedOptions[0]?.name === 'Harissa' && lines[1]?.selectedOptions[0]?.name === 'Chermoula',
    lines.map(l => l.selectedOptions[0]?.name).join(' / '),
  );

  // ---- Only the owning restaurant may reject ---------------------------
  console.log('\n9) Customer tries to reject their own order');
  const REJECT = `mutation($dto: RejectOrderDto!) {
    rejectOrder(rejectOrderDto: $dto) {
      message order { id status rejectedAt rejectionReason } error { message }
    }
  }`;
  const customerReject = await gql(
    ORDERS,
    REJECT,
    { dto: { orderId: order.id, reason: 'I changed my mind' } },
    customerAuth,
  );
  check(
    'refused: rejection is the restaurant\'s decision, not the customer\'s',
    !customerReject.rejectOrder.order && /Only the restaurant/.test(customerReject.rejectOrder.error?.message ?? ''),
    customerReject.rejectOrder.error?.message,
  );

  // ---- Restaurant rejection path --------------------------------------
  console.log('\n10) Restaurant rejects the placed order with a reason');
  const rejected = await gql(
    ORDERS,
    REJECT,
    { dto: { orderId: order.id, reason: 'Out of lamb for the evening' } },
    restaurantAuth,
  );
  const rej = rejected.rejectOrder.order;
  check('order status is REJECTED', rej?.status === 'REJECTED', rejected.rejectOrder.error?.message);
  check('rejection reason is stored', rej?.rejectionReason === 'Out of lamb for the evening');
  check('rejectedAt is stamped', Boolean(rej?.rejectedAt));

  // ---- Cleanup ---------------------------------------------------------
  await gql(
    RESTAURANTS,
    `mutation($dto: DeleteOptionGroupDto!) { deleteOptionGroup(deleteOptionGroupDto: $dto) { message } }`,
    { dto: { id: group.id } },
    restaurantAuth,
  );
  console.log('\nCleaned up the test option group.');

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

function round(v) {
  return Math.round(v * 100) / 100;
}

main().catch(e => {
  console.error(`\nAborted: ${e.message}`);
  process.exit(1);
});
