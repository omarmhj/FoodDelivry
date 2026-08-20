# SnackRapido - Project Status & Context

> **Last Updated:** August 10, 2026
> **Branch:** Snack-31
> **Purpose:** This file preserves full project context so any new chat session can continue building without losing context.

---

## Architecture Overview

**Monorepo** managed with **Nx**, using **NestJS** microservices communicating via **RabbitMQ** (event-driven) and **GraphQL** (client-facing). Data stored in **MongoDB** (one DB per service via Prisma), cached in **Redis**.

### Services & Ports

| Service | Port | Database | Role |
|---------|------|----------|------|
| api-users | 3000 | snackrapido_users | Auth, user management, JWT tokens |
| api-restaurants | 4001 | snackrapido_restaurants | Restaurant/menu CRUD, staff roles |
| api-orders | 4002 | snackrapido_orders | Order lifecycle, status tracking |
| api-Analytics | 4003 | snackrapido_analytics | Event consumption, daily reports |
| api-reservations | 4004 | snackrapido_reservations | Table booking, availability |
| api-search | 4005 | reads snackrapido_restaurants + snackrapido_orders | Full-text + geospatial search, recommendations |
| api-chat | 4006 | snackrapido_chat | Real-time messaging (GraphQL + WebSocket) |
| api-notifications | (no HTTP) | snackrapido_notifications | RabbitMQ consumer only, email/SMS/push |

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
| `notifications_queue` | api-orders, api-reservations, api-chat | api-notifications | Event fan-out for notifications |
| `analytics_queue` | api-orders, api-reservations, api-chat | api-Analytics | Event fan-out for analytics |

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
| `message.sent` | api-chat | notifications (notifies offline recipients), analytics (ack + log only) |

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

### Redis Pub/Sub Channels

| Channel | Publisher | Subscriber | Purpose |
|---------|-----------|------------|---------|
| `chat:broadcast` | api-chat (`ChatService.persistMessage`) | api-chat (`ChatGateway.afterInit`) | Fan out chat messages to sockets on every instance, so delivery works the same whether sender and recipient are on the same process or not |

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

### Silent token rotation

When an access token has expired but the refresh token is still valid, the guard
does not reject the request. It mints a new pair, serves the request, and — in
`api-orders` only — returns the new pair as `accesstoken` / `refreshtoken`
**response headers**. Clients must read those headers back or they keep replaying
a stale token. The Postman collections do this in a collection-level test script.

Two things to know about this path:

- **The rotated access token is issued with a 15m TTL**, while `Login` issues 7
  days. Rotation is therefore almost unreachable in dev, which is how the bug
  below survived unnoticed.
- **`api-users` and `api-restaurants` rotate but never send the headers**, so a
  client talking to 3000 or 4001 never learns about it and the guard re-mints on
  every single request. Harmless, but wasteful and inconsistent.

`api-orders` cannot reload the account locally the way the other two services do
(it owns no accounts collection), so it asks the owning service over RabbitMQ —
`user.validate` first, then `restaurant.validate`, since restaurant tokens use the
same shared secret and flow through the same guard. An id neither service claims
gets no token: the rotation fails closed.

Regression check: `node scripts/verify-token-rotation.js` (needs 3000, 4001, 4002 up).

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
- `../../node_modules/.prisma/chat-client`

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

### ✅ Phase 8: Chat Service — COMPLETE
- `api-chat` on port **4006**, hybrid HTTP/GraphQL + Socket.IO WebSocket (`ws://localhost:4006`), no RabbitMQ consumer (producer only)
- **GraphQL API** (Apollo Federation v2, all three protected by `AuthGuard`):
  - `createConversation(input)` mutation — idempotent: reuses an existing conversation with the same participant set and same `restaurantId`/`orderId` context instead of creating a duplicate; auto-adds the requester to `participants` if missing
  - `myConversations` query — conversations where the caller is a participant, ordered by `lastMessageAt` desc
  - `conversationMessages(input)` query — paginated (`limit` 1–100 default 50, `skip`), returned in chronological order with a `total` count
- **WebSocket events** (`ChatGateway`):
  - Connection is authenticated at handshake time — JWT read from `handshake.auth.token`, `?token=` query param, or the `accesstoken` header; invalid/missing token emits `error` and disconnects. Each client auto-joins a personal room `user:<id>`
  - Client → server: `joinConversation`, `leaveConversation`, `sendMessage`, `markRead`, `typing`
  - Server → client: `connected`, `message`, `read`, `typing`, `error`
- **Redis pub/sub broadcasting**: `sendMessage` never emits directly from the gateway. It persists, then publishes to the `chat:broadcast` channel; the gateway's own Redis subscriber emits `message` to the room. This keeps the delivery path identical for single- and multi-instance deployments
- **MongoDB history**: `snackrapido_chat` DB with `Conversation` (participants, optional restaurantId/orderId context, lastMessage preview) and `Message` (senderId, senderName, content, `readBy[]`) — indexed on conversationId, senderId, createdAt
- **Read receipts**: `markRead` adds the caller to `readBy` for all unread messages and broadcasts a `read` event to the rest of the room
- **RabbitMQ**: emits `message.sent` with the recipient list (participants minus sender). `api-notifications` consumes it and creates a `CHAT_MESSAGE` notification plus a mock push per recipient; `api-Analytics` acks and logs it without aggregating
- **Authorization**: every conversation-scoped operation (join, send, mark read, read messages) goes through `ChatService.isParticipant()` first
- Typing indicators are ephemeral — broadcast to the room but never persisted

**Key files:** `apps/api-chat/src/{main,chat.module,chat.gateway,chat.resolver,chat.service}.ts`, `apps/api-chat/src/dto/chat.dto.ts`, `apps/api-chat/src/entities/chat.entities.ts`, `apps/api-chat/src/guards/auth.guard.ts`, `apps/api-chat/prisma/{schema.prisma,prisma.service.ts}`

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
- Auth: Send login mutation to api-users (port 3000), get `accessToken` from response
- Use header `accesstoken: <token>` (all lowercase) for authenticated requests
- Restaurant auth: Login as restaurant via restaurant login mutation, use restaurant token for restaurant-specific operations
- Collections live in `postman/` — one per service (users, restaurants, orders, reservations, search, notifications). The notifications collection is not a GraphQL collection: it hits the RabbitMQ Management API to publish events directly into `notifications_queue`. No chat collection exists yet.
- api-chat WebSocket events can't be exercised from Postman (Socket.IO protocol) — use a Socket.IO client passing the JWT as `auth: { token }`

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
npx nx serve api-search
npx nx serve api-chat
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
DATABASE_URL="mongodb://localhost:27019/snackrapido_chat?replicaSet=rs0&directConnection=true" npx prisma db push --schema apps/api-chat/prisma/schema.prisma
```

### SSH Configuration (for GitHub)
- `github-personal` → `~/.ssh/id_ed25519_omarmhj_2026` (omar.maahjoubi@gmail.com)
- `github-work` → `~/.ssh/id_ed25519_omarProgmhj` (omarmhj9000@gmail.com)
- Clone using alias: `git clone git@github-personal:StartupERP/Sales-CRM.git`

---

## Item Options & Server-Side Pricing (Glovo model)

`MenuItem` now carries an option catalogue, and money is computed only by the server.

**Model** — `OptionGroup` is one question on an item ("Choose your sauce"); `ItemOption`
is one answer, with a `priceDelta` added to the base price when selected. A group's
`required` + `minSelect` / `maxSelect` define an acceptable selection. `MenuItem` also
gained `calories`.

**Pricing authority** — `menu.validateItems` (RabbitMQ, owned by api-restaurants) is
now the only thing that decides what a line costs. api-orders sends `menuItemId`,
`quantity`, and `selectedOptionIds` and receives fully priced lines back, then derives
`subtotal`/`tax`/`deliveryFee`/`total` from them. `CreateOrderDto` no longer accepts
`tax`, `deliveryFee`, or `discount` at all, and a per-item `unitPrice` is accepted but
ignored (kept so older clients keep working). Before this, client-supplied prices were
written straight to the order, so any caller could set its own total.

The same rules are re-checked server-side at order time: unavailable items, unavailable
options, option ids that don't belong to the item, and selections that violate a
group's required / min / max are all rejected.

`OrderItem` gained `basePrice`, `optionsTotal`, and a typed `selectedOptions` snapshot
(replacing the untyped `customizations` JSON blob) so a receipt can show the breakdown
even after the restaurant changes its menu. The same item may appear on several lines
with different options; lines are paired positionally with the request, never merged
by menu item id.

**Order rejection** — `OrderStatus` gained `REJECTED` (restaurant declined) alongside
`CANCELLED` (withdrawn), reachable from `PENDING`/`CONFIRMED` only, via the
`rejectOrder` mutation which requires a reason and stores `rejectedAt` /
`rejectionReason`. Both notifications and analytics handle `order.rejected`, the latter
tagging it `restaurant_rejected` so reports separate it from customer cancellations.

**Verifying it** — with api-users, api-restaurants and api-orders serving:

```bash
node scripts/verify-glovo-pricing.js
```

It builds a required option group, then tries to underpay, skip a required choice,
use a fabricated option id, exceed `maxSelect`, and reject an order as the customer,
asserting the server refuses each one. 20 checks, all expected to pass.

> **Careful with `prisma db push` on api-restaurants.** The `$geoNear` search needs a
> 2dsphere index on `Restaurant.coordinates`, which Prisma cannot express in the
> schema, so `db push` drops it. api-restaurants' `PrismaService` now recreates it on
> every boot, so restarting the service is enough to repair it.

---

## Known Issues & Notes

1. **ts-node seed scripts**: The TS module setup causes issues with `ts-node`. Workaround: use `node -e` with `require('./node_modules/.prisma/<client>')` or write temp `.js` files.
2. **`dist/` was being tracked**: Fixed — added to `.gitignore` and removed from git.
3. **Analytics service** only processes order events with real logic; reservation and `message.sent` events are acknowledged + logged but no analytics aggregation yet.
4. **`watch` command**: Not available on macOS by default. Use `while true; do clear; <cmd>; sleep 2; done` loop instead.
5. **Phone number in users schema**: Stored as `Float?` (not String) — historical design choice.
6. **Order lines created before server-side pricing** read back with `basePrice: 0` and `optionsTotal: 0`, because Prisma fills the schema defaults for fields missing from those documents. `unitPrice` and `totalPrice` on them are still correct; only the breakdown is unavailable. Re-seeding `snackrapido_orders` makes them consistent.
7. **`LoginRestaurant` caches under the restaurant id but reads by email** (`CACHE_KEYS.RESTAURANT(email)` vs `RESTAURANT(restaurant.id)`), so the login cache never hits. Harmless but pointless work on every login — pre-existing, not yet fixed.
8. **`user.validate` used to omit `role`** — fixed. It returned only `{ id, name, email, phone_number }`, which silently broke all three of its consumers, because `undefined !== 'SomeRole'` always takes the failure branch:
   - `api-orders` `AuthGuard.updateAccessToken` re-signed refreshed access tokens without `email`/`role`, so `req.user.role` became `undefined` roughly 15 minutes into a session and the `Admin` checks in `orders.resolver.ts` and `orders.service.ts` stopped recognising admins. It failed closed (privilege lost, never gained).
   - `api-restaurants` `createRestaurant` rejected every request that passed an `ownerId`, since it requires `validation.user?.role === 'Restaurant_Owner'`.
   - `api-orders` `validateChangedBy` rejected every `changedBy` with `role: 'ADMIN'`.

   The guard also no longer reads `email`/`role` off the refresh token, which never carried them — see "Silent token rotation" above.

---

## Next Steps

**All 8 backend phases are complete.** The remaining work is outside the microservice build-out:

1. **Postman coverage for api-chat** — there is no `SnackRapido-Chat-Service.postman_collection.json` yet. The three GraphQL operations can be covered by a collection; the WebSocket events need a Socket.IO client (Postman's raw WS support does not speak the Socket.IO protocol) or a small Node script.
2. **Frontends** — `SnackRapido-Frontend/customer-app` (Vite) and `SnackRapido-Frontend/restaurant-app` (Vite, same stack). The cloned `apps/restuarant-dashboard` was removed. The restaurant app still needs a live order inbox (accept/reject) and an option-group editor.
   - Still missing for the Glovo model: a `Driver` role in api-users, and delivery / maps / payment services. The customer app cannot show live courier tracking until those exist.
3. **api-gateway** — `apps/api-gateway` exists but is still Nx boilerplate; no Apollo Federation gateway composing the per-service subgraphs.
4. **Analytics depth** — reservation and chat events are acked and logged but not aggregated.

### Reminders for whoever continues
- Follow the flat service layout (`apps/<service>`), delete the generated `src/app/` boilerplate
- Copy the `auth.guard.ts` pattern for JWT auth (header `accesstoken`, secret `JWT_SECRET_KEY`)
- Each new Prisma schema needs its own `output = "../../../node_modules/.prisma/<name>-client"` and a `db push` with the `DATABASE_URL` env var inline
- Port convention: api-chat → 4006
- After creating a service, verify with `npx nx build <service>` (TS diagnostics may show stale `.prisma/*-client` import errors that disappear on real build)
