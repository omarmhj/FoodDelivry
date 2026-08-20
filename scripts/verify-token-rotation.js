/**
 * Verifies that api-orders preserves a caller's identity across a silent token
 * rotation.
 *
 * Why this exists as a separate script: the AuthGuard only rotates when an access
 * token has actually expired, which is 15 minutes out. The Postman collection
 * finishes in about four seconds, so it can never reach this branch — a regression
 * here would pass every other test in the repo while quietly stripping `role`
 * from refreshed tokens and demoting admins mid-session.
 *
 * Run with api-users (3000), api-restaurants (4001) and api-orders (4002) up:
 *   node scripts/verify-token-rotation.js
 */
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const USERS = 'http://localhost:3000/graphql';
const RESTAURANTS = 'http://localhost:4001/graphql';
const ORDERS = 'http://localhost:4002/graphql';

const CUSTOMER = { email: 'john@example.com', password: 'password123' };
const RESTAURANT = { email: 'lagoulette.grill@snackrapido.test', password: 'Password123!' };

// Read the signing secrets straight from the service's env rather than copying
// them into source, so this cannot drift from what the guard actually verifies.
function readSecrets() {
  const envPath = path.join(__dirname, '..', 'apps', 'api-orders', '.env');
  const text = fs.readFileSync(envPath, 'utf8');
  const pick = (key) => {
    const match = text.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'));
    if (!match) throw new Error(`${key} not found in ${envPath}`);
    return match[1].trim().replace(/^["']|["']$/g, '');
  };
  return { access: pick('ACCESS_TOKEN_SECRET'), refresh: pick('REFRESH_TOKEN_SECRET') };
}

let passed = 0;
let failed = 0;
function check(label, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function gql(url, query, variables, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return { body: await res.json(), headers: res.headers };
}

async function main() {
  const secrets = readSecrets();

  // Presenting an expired access token alongside a valid refresh token is the
  // only way to reach AuthGuard.updateAccessToken deterministically.
  const forceRotation = async (id, query) => {
    const res = await gql(ORDERS, query, {}, {
      accesstoken: jwt.sign({ id }, secrets.access, { expiresIn: '-5m' }),
      refreshtoken: jwt.sign({ id }, secrets.refresh, { expiresIn: '7d' }),
    });
    return { res, rotated: res.headers.get('accesstoken') };
  };

  console.log('\n1. Customer keeps email and role through a rotation');
  const login = await gql(
    USERS,
    `mutation($email: String!, $password: String!) {
       Login(email: $email, password: $password) { user { id email role } error { message } }
     }`,
    CUSTOMER,
  );
  const user = login.body.data?.Login?.user;
  if (!user) throw new Error(`customer login failed: ${JSON.stringify(login.body)}`);

  const asCustomer = await forceRotation(
    user.id,
    `query { getCustomerOrders(customerId: "${user.id}") { orders { id } error { message } } }`,
  );
  check('request served through the refresh path', !asCustomer.res.body.errors,
    JSON.stringify(asCustomer.res.body.errors));
  check('new token pair returned in response headers', typeof asCustomer.rotated === 'string');

  if (asCustomer.rotated) {
    const claims = jwt.verify(asCustomer.rotated, secrets.access);
    check('email preserved', claims.email === user.email, `got ${claims.email}`);
    check('role preserved', claims.role === user.role,
      `got ${claims.role}, expected ${user.role} — refreshed tokens are losing their role`);
  }

  console.log('\n2. Restaurant resolves via restaurant.validate');
  const rLogin = await gql(
    RESTAURANTS,
    `mutation($dto: LoginDto!) {
       LoginRestaurant(loginDto: $dto) { restaurant { id email } error { message } }
     }`,
    { dto: RESTAURANT },
  );
  const restaurant = rLogin.body.data?.LoginRestaurant?.restaurant;
  if (!restaurant) throw new Error(`restaurant login failed: ${JSON.stringify(rLogin.body)}`);

  const asRestaurant = await forceRotation(
    restaurant.id,
    `query { getRestaurantOrders(restaurantId: "${restaurant.id}") { orders { id } error { message } } }`,
  );
  check('request served through the refresh path', !asRestaurant.res.body.errors,
    JSON.stringify(asRestaurant.res.body.errors));
  if (asRestaurant.rotated) {
    const claims = jwt.verify(asRestaurant.rotated, secrets.access);
    check('email preserved for a restaurant account', claims.email === restaurant.email,
      `got ${claims.email}`);
  }

  console.log('\n3. An id no service owns must not get a token');
  const ghost = await forceRotation(
    'ffffffffffffffffffffffff',
    `query { getCustomerOrders(customerId: "ffffffffffffffffffffffff") { orders { id } error { message } } }`,
  );
  check('rotation refused', !!ghost.res.body.errors);
  check('no access token issued', !ghost.rotated, `issued ${ghost.rotated}`);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error('\nverification could not run:', error.message);
  process.exit(1);
});
