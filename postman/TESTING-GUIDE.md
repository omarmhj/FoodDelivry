# SnackRapido — End-to-End Integration Testing Guide

## Infrastructure

| Service         | Port  | Container              |
|-----------------|-------|------------------------|
| MongoDB         | 27019 | snackrapido-mongodb    |
| Redis           | 6380  | snackrapido-redis      |
| RabbitMQ        | 5673  | snackrapido-rabbitmq   |
| RabbitMQ UI     | 15673 | snackrapido-rabbitmq   |
| Mongo Express   | 8091  | snackrapido-mongo-express |
| Redis Commander | 8092  | snackrapido-redis-commander |

## RabbitMQ Queues

| Queue                | Producer(s)                        | Consumer(s)          |
|----------------------|------------------------------------|----------------------|
| `snackrapido_queue`  | orders, reservations               | users, restaurants   |
| `notifications_queue`| orders, reservations, restaurants  | notifications        |
| `analytics_queue`    | orders, reservations, restaurants  | analytics            |

## Services & Startup Order

```
1. docker compose up -d          (infra)
2. npx nx serve api-users        (port 3000)
3. npx nx serve api-restuarants  (port 4001)
4. npx nx serve api-orders       (port 4002)
5. npx nx serve api-reservations (port 4004)
6. npx nx serve api-notifications (microservice — no HTTP port)
7. npx nx serve api-Analytics    (port 4003)
```

All `npx nx serve` commands run from `Food-Delivery-WebApp/`.

---

## Verification Commands

```bash
# Redis — connect
docker exec -it snackrapido-redis redis-cli -a redis123

# Redis — list all keys
KEYS *

# Redis — check a specific key
GET order:<order_id>
TTL order:<order_id>

# Redis — check reservation cache
GET reservation:<reservation_id>

# Redis — check restaurant cache
GET restaurant:<restaurant_id>

# Redis — check token blacklist
GET bl:<token_value>

# Redis — check registration data
KEYS reg:*

# RabbitMQ — check queues via Management API
curl -u admin:rabbit123 http://localhost:15673/api/queues/%2F | python3 -m json.tool

# RabbitMQ — check specific queue message count
curl -u admin:rabbit123 http://localhost:15673/api/queues/%2F/notifications_queue | python3 -m json.tool

# Docker logs with timestamps
docker logs snackrapido-redis --since 5m -t
docker logs snackrapido-rabbitmq --since 5m -t
docker logs snackrapido-mongodb --since 5m -t
```

---

## PHASE 1 — api-users (port 3000)

### Flow: Register → Activate → Login → Get Profile → Logout

```
Step 1: Register
  POST http://localhost:3000/graphql
  → Redis: stores reg:<email>:<timestamp> with user data (TTL 10min)
  → Returns: activation_token (JWT with registrationId + activationCode)
  → Verify: KEYS reg:* in Redis

Step 2: Activate
  POST http://localhost:3000/graphql
  → Redis: reads reg:<email>:<timestamp>, then DELetes it
  → MongoDB: creates user in snackrapido.User
  → Verify: KEYS reg:* should be empty

Step 3: Login
  POST http://localhost:3000/graphql
  → Returns: accessToken + refreshToken + user object
  → Save accessToken — needed for ALL protected endpoints across ALL services

Step 4: Get Logged In User (Protected)
  POST http://localhost:3000/graphql
  Header: access-token: <accessToken>
  → Returns: user + tokens

Step 5: Logout (Protected)
  POST http://localhost:3000/graphql
  Header: access-token: <accessToken>
  → Redis: sets bl:<accessToken> and bl:<refreshToken> with TTL matching token expiry
  → Verify: GET bl:<accessToken> should return "1"
```

### RabbitMQ Handlers (consumer on `snackrapido_queue`)
- `user.validate` — called by orders/reservations to verify customer exists
- `user.get_by_id` — called to fetch user details

---

## PHASE 2 — api-restuarants (port 4001)

### Flow: Register → Activate → Login → Create Menu → Create Category → Create MenuItem

```
Step 1: Register Restaurant
  POST http://localhost:4001/graphql
  → Sends activation email
  → Returns: activation_token

Step 2: Activate Restaurant
  POST http://localhost:4001/graphql
  → MongoDB: creates restaurant in snackrapido.Restaurant
  → RabbitMQ: emits "restaurant.created" → notifications_queue + analytics_queue
  → Redis: caches restaurant:<id> (TTL 1h)
  → Verify: GET restaurant:<id> in Redis

Step 3: Login Restaurant
  POST http://localhost:4001/graphql
  → Returns: accessToken + refreshToken + restaurant object
  → Save accessToken — needed for restaurant-protected endpoints

Step 4: Create Menu (Protected — restaurant auth)
  POST http://localhost:4001/graphql
  Header: access-token: <restaurant_accessToken>

Step 5: Create Category (Protected)
  POST http://localhost:4001/graphql

Step 6: Create MenuItem (Protected)
  POST http://localhost:4001/graphql
  → Needs: categoryId + menuId from steps 4-5
```

### RabbitMQ Handlers (consumer on `snackrapido_queue`)
- `restaurant.validate` — called by orders/reservations to verify restaurant exists
- `menu.validateItems` — called to validate menu items

### Important IDs to Save
- `restaurant.id` → needed for orders + reservations
- `menu.id` → needed for menu items
- `category.id` → needed for menu items
- `menuItem.id` → needed for order items

---

## PHASE 3 — api-orders (port 4002)

### Prerequisites
- User registered + activated + logged in (Phase 1) → have `accessToken` + `userId`
- Restaurant registered + activated (Phase 2) → have `restaurantId` + `menuItemId`
- api-users running (for `user.validate` via RabbitMQ)
- api-restuarants running (for `restaurant.validate` via RabbitMQ)

### Flow: Create Order → Status Flow → Review

```
Step 1: Create Order (Protected — user auth)
  POST http://localhost:4002/graphql
  Header: access-token: <user_accessToken>

  Cross-service calls (RabbitMQ request-reply on snackrapido_queue):
    → orders → "user.validate" → api-users → response
    → orders → "restaurant.validate" → api-restuarants → response

  On success:
    → MongoDB: creates Order + OrderItems + OrderStatusHistory
    → Redis: caches order:<id> (TTL 1h for active, 24h for finalized)
    → RabbitMQ: emits "order.placed" → notifications_queue + analytics_queue
    → Verify: GET order:<id> in Redis
    → Verify: notifications service logs "📦 Received order.placed event"

Step 2: Confirm Order (PENDING → CONFIRMED)
  POST http://localhost:4002/graphql — updateOrderStatus
    → Redis: updates order:<id> cache
    → RabbitMQ: emits "order.status.updated" → notifications_queue + analytics_queue
    → Verify: notifications logs "🔄 Received order.status.updated"

Step 3: Start Preparing (CONFIRMED → PREPARING)
  Same pattern as Step 2

Step 4: Mark Ready (PREPARING → READY)
  Same pattern — notifications sends email for READY status

Step 5: Out For Delivery (READY → OUT_FOR_DELIVERY)
  Same pattern — notifications sends email

Step 6: Mark Delivered (OUT_FOR_DELIVERY → DELIVERED)
  Same pattern
    → Redis: re-caches order:<id> with 24h TTL (finalized)
    → Notifications sends email for DELIVERED

Step 7: Create Review (order must be DELIVERED)
  POST http://localhost:4002/graphql — createOrderReview
    → MongoDB: creates OrderReview
    → RabbitMQ: emits "order.reviewed" → notifications_queue + analytics_queue
    → Verify: notifications logs "⭐ Received order.reviewed event"
```

### Cancel Flow (alternative to steps 2-6)
```
Cancel Order (only from PENDING, CONFIRMED, or PREPARING)
  POST http://localhost:4002/graphql — cancelOrder
    → Redis: updates cache with 24h TTL
    → RabbitMQ: emits "order.cancelled" → notifications_queue + analytics_queue
    → Verify: notifications logs "❌ Received order.cancelled event"
```

### Valid Status Transitions
```
PENDING → CONFIRMED, CANCELLED
CONFIRMED → PREPARING, CANCELLED
PREPARING → READY, CANCELLED
READY → OUT_FOR_DELIVERY, DELIVERED
OUT_FOR_DELIVERY → DELIVERED
DELIVERED → (final)
CANCELLED → (final)
```

---

## PHASE 4 — api-reservations (port 4004)

### Prerequisites
- User logged in → have `accessToken` + `userId`
- Restaurant registered → have `restaurantId` + `restaurant_accessToken`
- api-users running (for `user.validate`)
- api-restuarants running (for `restaurant.validate`)

### Flow: Create Tables → Check Availability → Create Reservation → Status Flow

```
Step 1: Create Tables (Protected — restaurant auth)
  POST http://localhost:4004/graphql
  Header: access-token: <restaurant_accessToken>
  → MongoDB: creates Table in snackrapido_reservations.Table
  → Save table_id for later

Step 2: Check Availability (Public — no auth)
  POST http://localhost:4004/graphql
  → Returns: available (bool) + list of available tables
  → No RabbitMQ, no Redis

Step 3: Create Reservation (Protected — user auth)
  POST http://localhost:4004/graphql
  Header: access-token: <user_accessToken>

  Cross-service calls (RabbitMQ request-reply on snackrapido_queue):
    → reservations → "restaurant.validate" → api-restuarants → response
    → reservations → "user.validate" → api-users → response

  On success:
    → MongoDB: creates Reservation
    → Redis: caches reservation:<id> (TTL 1h active, 24h finalized)
    → Redis: DELetes table_availability:<restaurantId>:<date>
    → Redis: DELetes restaurant_reservations:<restaurantId>:<date>
    → RabbitMQ: emits "reservation.created" → notifications_queue + analytics_queue
    → Verify: GET reservation:<id> in Redis
    → Verify: notifications logs "📅 Received reservation.created event"

Step 4: Confirm Reservation (PENDING → CONFIRMED)
  POST http://localhost:4004/graphql — updateReservationStatus
    → Redis: updates reservation:<id>
    → Redis: invalidates availability cache
    → RabbitMQ: emits "reservation.confirmed" → notifications_queue
    → Verify: notifications logs "✅ Received reservation.confirmed event"

Step 5: Seat Guests (CONFIRMED → SEATED)
  Same pattern — no special notification event

Step 6: Complete (SEATED → COMPLETED)
  Same pattern
    → Redis: re-caches with 24h TTL
```

### Cancel Flow
```
Cancel Reservation (only from PENDING or CONFIRMED)
  → Redis: updates cache + invalidates availability
  → RabbitMQ: emits "reservation.cancelled" → notifications_queue
  → Verify: notifications logs "❌ Received reservation.cancelled event"
```

### No-Show Flow
```
Mark No Show (only from CONFIRMED)
  → updateReservationStatus with status: NO_SHOW
  → Redis: re-caches with 24h TTL
  → RabbitMQ: emits "reservation.no_show" → notifications_queue
```

### Valid Status Transitions
```
PENDING → CONFIRMED, CANCELLED
CONFIRMED → SEATED, CANCELLED, NO_SHOW
SEATED → COMPLETED
COMPLETED → (final)
CANCELLED → (final)
NO_SHOW → (final)
```

---

## PHASE 5 — api-notifications (microservice)

No HTTP port — pure RabbitMQ consumer on `notifications_queue`.

### Events Consumed

| Event Pattern            | Source Service | Action                                      |
|--------------------------|---------------|----------------------------------------------|
| `order.placed`           | api-orders    | DB notification + email + push               |
| `order.status.updated`   | api-orders    | DB notification + email (important) + push   |
| `order.cancelled`        | api-orders    | DB notification + email + push               |
| `order.reviewed`         | api-orders    | DB notification to restaurant                |
| `reservation.created`    | api-reservations | DB notification + email                   |
| `reservation.confirmed`  | api-reservations | DB notification + email                   |
| `reservation.cancelled`  | api-reservations | DB notification + email                   |

### Redis Usage
- Rate limiting: `email_rate_limit:<userId>` (max 10/hr, TTL 1h)
- Rate limiting: `sms_rate_limit:<userId>` (max 5/hr, TTL 1h)
- Rate limiting: `push_rate_limit:<userId>` (max 20/hr, TTL 1h)

### How to Test (no direct HTTP)
Notifications are tested indirectly — trigger events from orders/reservations and watch the notifications service terminal logs.

Alternative: publish directly to `notifications_queue` via RabbitMQ Management API:
```bash
curl -u admin:rabbit123 -X POST http://localhost:15673/api/exchanges/%2F/amq.default/publish \
  -H "Content-Type: application/json" \
  -d '{
    "properties": { "headers": { "x-pattern": "order.placed" } },
    "routing_key": "notifications_queue",
    "payload": "{\"pattern\":\"order.placed\",\"data\":{\"orderId\":\"test123\",\"orderNumber\":\"ORD-TEST-001\",\"customerId\":\"cust123\",\"total\":25.99,\"metadata\":{\"customerName\":\"Test User\",\"customerEmail\":\"test@example.com\",\"restaurantName\":\"Test Restaurant\"}}}",
    "payload_encoding": "string"
  }'
```

### Verify in Notifications Terminal
```
📦 Received order.placed event
📦 Order Number: ORD-TEST-001
✅ Notification created: <id> for user: cust123
📧 Email sent to: test@example.com (or ⚠️ if SMTP not configured)
🔔 PUSH MOCK | User: cust123 | Title: Order Placed
```

---

## PHASE 6 — api-Analytics (port 4003)

Passive consumer on `analytics_queue`. Receives same events as notifications.
Test by triggering order/reservation flows and checking analytics service logs.

---

## Cross-Service Communication Map

```
┌─────────────┐     GraphQL      ┌──────────────┐
│   Postman    │ ───────────────→ │  api-orders   │
│   Client     │                  │  (port 4002)  │
└─────────────┘                  └──────┬───────┘
                                        │
                    RabbitMQ             │  request-reply
                  snackrapido_queue      │  (sendAndWait)
                        ┌───────────────┤
                        │               │
                        ▼               ▼
               ┌──────────────┐  ┌───────────────┐
               │  api-users    │  │ api-restuarants│
               │  (port 3000)  │  │  (port 4001)   │
               └──────────────┘  └───────────────┘
                        ▲               ▲
                        │               │
                        │  request-reply │
                        │  (sendAndWait) │
                        ├───────────────┘
                        │
               ┌────────┴───────┐
               │api-reservations │
               │  (port 4004)    │
               └────────┬───────┘
                        │
                        │  emitEvent (fire-and-forget)
                        ▼
        ┌───────────────────────────────────┐
        │         RabbitMQ                   │
        │  notifications_queue               │
        │  analytics_queue                   │
        └───────┬───────────────┬───────────┘
                │               │
                ▼               ▼
       ┌────────────────┐  ┌──────────────┐
       │api-notifications│  │ api-Analytics │
       │  (microservice) │  │  (port 4003)  │
       └────────────────┘  └──────────────┘
```

### Communication Patterns

| Pattern          | Mechanism                | Queue              | Blocking? |
|------------------|--------------------------|--------------------|-----------|
| user.validate    | RabbitMQ request-reply   | snackrapido_queue  | Yes (30s timeout) |
| restaurant.validate | RabbitMQ request-reply | snackrapido_queue | Yes (30s timeout) |
| menu.validateItems | RabbitMQ request-reply  | snackrapido_queue  | Yes (30s timeout) |
| order.placed     | RabbitMQ emit (event)    | notifications_queue + analytics_queue | No |
| order.status.updated | RabbitMQ emit (event) | notifications_queue + analytics_queue | No |
| order.cancelled  | RabbitMQ emit (event)    | notifications_queue + analytics_queue | No |
| order.reviewed   | RabbitMQ emit (event)    | notifications_queue + analytics_queue | No |
| reservation.created | RabbitMQ emit (event)  | notifications_queue + analytics_queue | No |
| reservation.confirmed | RabbitMQ emit (event) | notifications_queue + analytics_queue | No |
| reservation.cancelled | RabbitMQ emit (event) | notifications_queue + analytics_queue | No |
| restaurant.created | RabbitMQ emit (event)   | notifications_queue + analytics_queue | No |

---

## Redis Cache Keys Reference

| Key Pattern                                      | Service          | TTL     | Purpose                    |
|--------------------------------------------------|------------------|---------|----------------------------|
| `reg:<email>:<timestamp>`                        | api-users        | 10 min  | Registration data          |
| `bl:<token>`                                     | api-users        | token exp | Token blacklist          |
| `restaurant:<id>`                                | api-restuarants  | 1 hour  | Restaurant cache           |
| `order:<id>`                                     | api-orders       | 1h/24h  | Order cache (active/final) |
| `reservation:<id>`                               | api-reservations | 1h/24h  | Reservation cache          |
| `table_availability:<restaurantId>:<date>`       | api-reservations | varies  | Availability cache         |
| `restaurant_reservations:<restaurantId>:<date>`  | api-reservations | varies  | Restaurant bookings cache  |
| `email_rate_limit:<userId>`                      | api-notifications| 1 hour  | Email rate limit counter   |
| `sms_rate_limit:<userId>`                        | api-notifications| 1 hour  | SMS rate limit counter     |
| `push_rate_limit:<userId>`                       | api-notifications| 1 hour  | Push rate limit counter    |

---

## Quick Smoke Test Checklist

```
[ ] Docker containers running (mongodb, redis, rabbitmq)
[ ] All 6 services started without errors
[ ] Register + activate + login user → save accessToken + userId
[ ] Register + activate + login restaurant → save restaurant accessToken + restaurantId
[ ] Create menu + category + menuItem → save IDs
[ ] Create order → verify Redis cache + notifications log
[ ] Walk order through full status flow → verify each status in notifications
[ ] Create tables (restaurant auth) → verify in DB
[ ] Check availability → returns tables
[ ] Create reservation → verify Redis cache + notifications log
[ ] Confirm + seat + complete reservation → verify notifications
[ ] Cancel an order → verify notifications + Redis TTL change
[ ] Cancel a reservation → verify notifications + availability cache invalidated
[ ] Logout user → verify token blacklisted in Redis
```
