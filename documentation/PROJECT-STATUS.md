# SnackRapido - Project Status & Context

> **Last Updated:** July 24, 2026
> **Branch:** Snack-31
> **Purpose:** This file preserves full project context so any new chat session can continue building without losing context.

---

## Architecture Overview

**Monorepo** managed with **Nx**, using **NestJS** microservices communicating via **RabbitMQ** (event-driven) and **GraphQL** (client-facing). Data stored in **MongoDB** (one DB per service via Prisma), cached in **Redis**.

### Services & Ports

| Service | Port | Database | Role |
|---------|------|----------|------|
| api-users | 4000 | snackrapido_users | Auth, user management, JWT tokens |
| api-restaurants | 4001 | snackrapido_restaurants | Restaurant/menu CRUD, staff roles |
| api-orders | 4002 | snackrapido_orders | Order lifecycle, status tracking |
| api-Analytics | 4003 | snackrapido_analytics | Event consumption, daily reports |
| api-reservations | 4004 | snackrapido_reservations | Table booking, availability |
| api-search | 4005 | reads snackrapido_restaurants + snackrapido_orders | Full-text + geospatial search, recommendations |
| api-notifications | (no HTTP) | snackrapido_notifications | RabbitMQ consumer only, email/SMS/push |
| client | 3000 | - | Next.js frontend (not yet active) |

### Infrastructure (Docker Compose)

| Container | Internal → External Port |
|-----------|--------------------------|
| MongoDB 6.0 (replica set `rs0`) | 27017 → **27019** |
| Redis 7.2 | 6379 → **6380** |
| RabbitMQ 3.12 | 5672 → **5673**, 15672 → **15673** (UI) |
| Mongo Express | 8081 → **8091** |
| RedisInsight | 5540 → **8093** |

---

## Communication Patterns

### RabbitMQ Queues

| Queue | Producers | Consumers | Purpose |
|-------|-----------|-----------|---------|
| `snackrapido_queue` | All services | api-users, api-restaurants | Request/reply (validate user, validate restaurant, validate menu items) |
| `notifications_queue` | api-orders, api-reservations | api-notifications | Event fan-out for notifications |
| `analytics_queue` | api-orders, api-reservations | api-Analytics | Event fan-out for analytics |

### Event Patterns

| Pattern | Emitter | Consumers |
|---------|---------|-----------|
| `order.placed` | api-orders | notifications, analytics |
| `order.status.updated` | api-orders | notifications, analytics |
| `order.cancelled` | api-orders | notifications, analytics |
| `order.reviewed` | api-orders | notifications, analytics |
| `reservation.created` | api-reservations | notifications, analytics |
| `reservation.confirmed` | api-reservations | notifications, analytics |
| `reservation.status.updated` | api-reservations | notifications, analytics |
| `reservation.completed` | api-reservations | notifications, analytics |
| `reservation.cancelled` | api-reservations | notifications, analytics |
| `reservation.no_show` | api-reservations | notifications, analytics |

### Request/Reply Patterns (via `snackrapido_queue`)

| Pattern | Handler | Purpose |
|---------|---------|---------|
| `restaurant.validate` | api-restaurants | Validate restaurant exists |
| `menu.validateItems` | api-restaurants | Validate menu items exist and get prices |
| `user.validate` | api-users | Validate user exists |

### Redis Caching Strategy

| Key Pattern | TTL | Service |
|-------------|-----|---------|
| `restaurant:<id>` | 1h | api-restaurants |
| `order:<id>` | 1h (active), 24h (finalized) | api-orders |
| `reservation:<id>` | 1h (active), 24h (finalized) | api-reservations |
| `table_availability:<restaurantId>:<date>` | 30min | api-reservations |
| `restaurant_reservations:<restaurantId>:<date>` | 30min | api-reservations |
| `email_rate_limit:<userId>` | 1h (max 10) | api-notifications |
| `sms_rate_limit:<userId>` | 1h (max 5) | api-notifications |
| `push_rate_limit:<userId>` | 1h (max 20) | api-notifications |
| `search:restaurants:<query>:<city>:<limit>:<skip>` | 5min | api-search |
| `search:menuitems:<query>:<maxPrice>:<limit>:<skip>` | 5min | api-search |
| `search:nearby:<lng>:<lat>:<km>:<limit>` | 2min | api-search |
| `search:recommendations:<customerId>:<limit>` | 10min | api-search |

---

## Shared Libraries (`libs/shared/src/`)

| File | Purpose |
|------|---------|
| `shared.module.ts` | Imports SharedMicroservicesModule + RedisModule, exports RabbitMQService |
| `microservices.module.ts` | Registers 3 RabbitMQ ClientProxy: RABBITMQ_SERVICE, NOTIFICATIONS_SERVICE, ANALYTICS_SERVICE |
| `rabbitmq.service.ts` | `sendMessage()`, `sendAndWait()` (request/reply), `emitEvent()` (fan-out to notifications+analytics) |
| `redis.module.ts` | Redis connection config |
| `redis.service.ts` | get/set/del with logging, TTL management |

### Key Implementation Detail: `emitEvent()`
Uses `lastValueFrom(client.emit(...))` to subscribe to the Observable (required for message to actually publish). Also implements `OnModuleInit` to eagerly `.connect()` all client proxies.

---

## Authentication

- **JWT-based** with access + refresh tokens
- Access token: **7 days** TTL (changed from 15m for dev convenience)
- Refresh token: **7 days** TTL
- Header: `accesstoken: <token>` (lowercase, custom header)
- Restaurant auth: restaurants log in with email/password, get their own JWT with `restaurantId` in payload
- Guards: Each service has its own `AuthGuard` that validates JWT and optionally refreshes tokens

---

## Prisma Configuration

Each service has its own schema at `apps/<service>/prisma/schema.prisma` with a custom output:
- `../../node_modules/.prisma/users-client`
- `../../node_modules/.prisma/restaurants-client`
- `../../node_modules/.prisma/orders-client`
- `../../node_modules/.prisma/reservations-client`
- `../../node_modules/.prisma/notifications-client`
- `../../node_modules/.prisma/analytics-client`
- `../../node_modules/.prisma/search-client` (read model → snackrapido_restaurants; api-search also reuses orders-client for the orders DB)

**Important:** When running Prisma commands, always pass `DATABASE_URL` as env var:
```bash
DATABASE_URL="mongodb://localhost:27019/snackrapido_<service>?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/<service>/prisma/schema.prisma
```

---

## Phase Completion Status

### ✅ Phase 1: Restaurant Enhancements — COMPLETE
- Prisma schema: Restaurant, Menu, Category, MenuItem, OperatingHours, Images, Reviews, StaffMember
- GraphQL resolvers for full restaurant CRUD, menu management
- Geospatial queries (coordinates field with GeoPoint type)
- Operating hours logic
- Owner/Staff roles linked to users via RabbitMQ validation
- Restaurant authentication (separate from user auth)

### ✅ Phase 2: Setup RabbitMQ and Redis — COMPLETE
- Docker Compose with MongoDB (replica set), RabbitMQ, Redis, Mongo Express, RedisInsight
- `@nestjs/microservices` configured in SharedMicroservicesModule
- Redis client in shared RedisModule/RedisService
- Event publishing verified end-to-end
- Request/reply pattern working (restaurant.validate, user.validate, menu.validateItems)

### ✅ Phase 3: Order Management Service — COMPLETE
- api-orders with Prisma schema: Order, OrderItem, OrderStatusHistory, OrderReview
- GraphQL resolvers for order creation, status updates, history, reviews
- Publishes order.placed, order.status.updated, order.cancelled, order.reviewed events
- Redis caching for order data
- Full order lifecycle: PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
- Cross-service validation: validates restaurant + menu items via RabbitMQ before placing order

### ✅ Phase 4: Notifications Service — COMPLETE
- api-notifications as pure RabbitMQ consumer (no HTTP port)
- Handles all order events + all reservation events
- Email notifications via SMTP (Nodemailer/@nestjs-modules/mailer)
- Redis-based rate limiting (10 emails/hr, 5 SMS/hr, 20 push/hr)
- Notification persistence in MongoDB (Notification + NotificationLog collections)
- SMS/Push mocked (logged to console)

### ✅ Phase 5: Reservations Service — COMPLETE
- api-reservations with Prisma schema: Table, Reservation
- GraphQL resolvers: createTable, createReservation, updateReservationStatus, cancelReservation, checkAvailability, getRestaurantTables
- Table management (CRUD by restaurant owners)
- Auto table assignment based on party size + time conflict detection
- Redis caching: reservation data, table availability, invalidation on changes
- Events: reservation.created, reservation.confirmed, reservation.status.updated, reservation.completed, reservation.cancelled, reservation.no_show
- Status flow: PENDING → CONFIRMED → PREPARING → SEATED → COMPLETED (or CANCELLED/NO_SHOW)

### ✅ Phase 6: Analytics Service — COMPLETE
- api-Analytics as hybrid app (HTTP + RabbitMQ consumer)
- Prisma schema: Analytics, DailyReport, RevenueMetric, PopularItem
- Consumes order events (order.placed, order.status.updated, order.cancelled, order.reviewed)
- Consumes reservation events (all patterns acknowledged, logged)
- Daily reports via @nestjs/schedule (hourly metrics update)
- Redis caching for metrics

### ✅ Phase 7: Search and Recommendations Service — COMPLETE
- Created `api-search` via Nx generator (`@nx/nest:application`, flat layout, no e2e) on port 4005
- **GraphQL queries** (Apollo Federation v2):
  - `searchRestaurants(input)` — text search over name/city/address/country (public)
  - `searchMenuItems(input)` — text search over menu item name/description, optional maxPrice, joins restaurant name (public)
  - `nearbyRestaurants(input)` — geospatial `$geoNear` via `aggregateRaw`, returns distanceKm (public)
  - `recommendations(limit)` — personalized, order-history based (protected, AuthGuard)
- **Data access design (read-only, cross-service):**
  - `PrismaService` → `.prisma/search-client` → reads `snackrapido_restaurants` (Restaurant + MenuItem read models)
  - `OrdersPrismaService` → reuses `.prisma/orders-client` → reads `snackrapido_orders` (via `ORDERS_DATABASE_URL`) for recommendations
  - Search service NEVER writes to these DBs — respects ownership by api-restaurants / api-orders
- **Full-text search**: Prisma `contains` + `mode: 'insensitive'` (works on local MongoDB without Atlas Search)
- **Geospatial**: 2dsphere index on `Restaurant.coordinates`, created on `onModuleInit` via `$runCommandRaw`; `$geoNear` pipeline with spherical distance
- **Recommendations logic**: groups customer's past orders by restaurantId, frequency-ranks them (`reorder`), plus `discover` list of restaurants not yet ordered from
- **Redis caching**: all search results cached (search 5min, nearby 2min, recommendations 10min); `cached` boolean returned in every response; Redis failures degrade gracefully (still returns fresh data)
- **Verified end-to-end**: restaurant search, menu search, nearby (Pizza Palace 0.74km, Burger Barn in Sfax correctly excluded at 270km), cache hits, auth enforcement, and recommendations all working

**Key files:** `apps/api-search/src/{main,search.module,search.resolver,search.service}.ts`, `apps/api-search/src/dto/search.dto.ts`, `apps/api-search/src/entities/search.entities.ts`, `apps/api-search/src/guards/auth.guard.ts`, `apps/api-search/prisma/{schema.prisma,prisma.service.ts,orders-prisma.service.ts}`

### ⬜ Phase 8: Chat Service — NOT STARTED
- Create api-chat microservice
- WebSocket gateway (@nestjs/websockets)
- Redis pub/sub for message broadcasting
- MongoDB message history
- RabbitMQ events for offline notifications

---

## Development Patterns & Conventions

### Service Startup Pattern
Each service uses a hybrid NestJS app pattern:
1. `NestFactory.create()` for HTTP/GraphQL
2. `app.connectMicroservice()` for RabbitMQ consumer (if needed)
3. `app.startAllMicroservices()` then `app.listen(port)`

Exception: api-notifications is a pure microservice (`NestFactory.createMicroservice()`), no HTTP.

### GraphQL
- Apollo Federation v2 (`@nestjs/apollo` + `ApolloFederationDriver`)
- Auto-generated schema (`autoSchemaFile: { federation: 2 }`)
- Each service exposes its own `/graphql` endpoint
- Playground available at `http://localhost:<port>/graphql`

### Error Handling
- Services return structured responses: `{ message, error?: { message, code }, data? }`
- RabbitMQ consumers always `channel.ack()` even on errors (to prevent queue blocking)
- `sendAndWait()` has retry logic with exponential backoff for "handler not found" errors

### Testing in Postman
- Auth: Send login mutation to api-users (port 4000), get `accessToken` from response
- Use header `accesstoken: <token>` (all lowercase) for authenticated requests
- Restaurant auth: Login as restaurant via restaurant login mutation, use restaurant token for restaurant-specific operations

### Running Services
```bash
# Start infrastructure
docker compose up -d

# Initialize MongoDB replica set (only after fresh Docker install)
docker exec snackrapido-mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"

# Start individual services (from project root)
npx nx serve api-users
npx nx serve api-restaurants
npx nx serve api-orders
npx nx serve api-reservations
npx nx serve api-notifications
npx nx serve api-Analytics
```

### Seeding (after fresh DB)
```bash
# Push all schemas
DATABASE_URL="mongodb://localhost:27019/snackrapido_users?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-users/prisma/schema.prisma
DATABASE_URL="mongodb://localhost:27019/snackrapido_restaurants?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-restaurants/prisma/schema.prisma
DATABASE_URL="mongodb://localhost:27019/snackrapido_orders?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-orders/prisma/schema.prisma
DATABASE_URL="mongodb://localhost:27019/snackrapido_reservations?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-reservations/prisma/schema.prisma
DATABASE_URL="mongodb://localhost:27019/snackrapido_notifications?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-notifications/prisma/schema.prisma
DATABASE_URL="mongodb://localhost:27019/snackrapido_analytics?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-Analytics/prisma/schema.prisma
```

### SSH Configuration (for GitHub)
- `github-personal` → `~/.ssh/id_ed25519_omarmhj_2026` (omar.maahjoubi@gmail.com)
- `github-work` → `~/.ssh/id_ed25519_omarProgmhj` (omarmhj9000@gmail.com)
- Clone using alias: `git clone git@github-personal:StartupERP/Sales-CRM.git`

---

## Known Issues & Notes

1. **ts-node seed scripts**: The TS module setup causes issues with `ts-node`. Workaround: use `node -e` with `require('./node_modules/.prisma/<client>')` or write temp `.js` files.
2. **`dist/` was being tracked**: Fixed — added to `.gitignore` and removed from git.
3. **Analytics service** only processes order events with real logic; reservation events are acknowledged + logged but no analytics aggregation yet.
4. **`watch` command**: Not available on macOS by default. Use `while true; do clear; <cmd>; sleep 2; done` loop instead.
5. **Phone number in users schema**: Stored as `Float?` (not String) — historical design choice.

---

## Next Steps

**Phase 8: Chat Service** is the next (and final) phase to implement:
1. Create `api-chat` app in the monorepo (Nx: `npx nx g @nx/nest:application api-chat --directory=apps/api-chat --projectNameAndRootFormat=as-provided --e2eTestRunner=none`)
2. Add a WebSocket gateway (`@nestjs/websockets` + `@nestjs/platform-socket.io` — note: socket.io platform not yet in package.json, will need install)
3. Implement Redis pub/sub for message broadcasting across instances (RedisService already has `publish`/`subscribe`)
4. Store message history in MongoDB (new `snackrapido_chat` DB, Prisma schema for Message/Conversation)
5. Publish `message.sent` events to RabbitMQ (via existing `emitEvent` pattern) so notifications service can alert offline users

### Reminders for whoever continues
- Follow the flat service layout (`apps/<service>`), delete the generated `src/app/` boilerplate
- Copy the `auth.guard.ts` pattern for JWT auth (header `accesstoken`, secret `JWT_SECRET_KEY`)
- Each new Prisma schema needs its own `output = "../../../node_modules/.prisma/<name>-client"` and a `db push` with the `DATABASE_URL` env var inline
- Port convention: api-chat → 4006
- After creating a service, verify with `npx nx build <service>` (TS diagnostics may show stale `.prisma/*-client` import errors that disappear on real build)
