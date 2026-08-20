# SnackRapido — Dev Commands Cheat Sheet

Quick reference for starting services, watching live logs, inspecting RabbitMQ/Redis,
and opening the right browser tabs. Written so you can copy-paste without digging
back through chat history.

> **Base path convention:** unless stated otherwise, run commands from the repo root:
> `/Users/omarmahjoubi/Non-Synced Files/Documents/NestJs-Projects/NestJs/SnackRapido/Food-Delivery-WebApp`

---

## 1. Start Infrastructure (Docker)

```bash
# path: Food-Delivery-WebApp/
docker compose up -d
```

This starts:
| Container | Purpose | Port(s) |
|---|---|---|
| `snackrapido-mongodb` | MongoDB (replica set `rs0`) | 27019 → 27017 |
| `snackrapido-redis` | Redis (password: `redis123`) | 6380 → 6379 |
| `snackrapido-rabbitmq` | RabbitMQ broker + management UI | 5673 (AMQP), 15673 (UI) |
| `snackrapido-mongo-express` | Mongo Express UI | 8091 → 8081 |
| `snackrapido-redisinsight` | RedisInsight UI | 8093 → 5540 |

Check everything is up:
```bash
# path: Food-Delivery-WebApp/
docker compose ps
```

Stop infra:
```bash
# path: Food-Delivery-WebApp/
docker compose down
```

Alternative helper script (wraps the same containers with extra health checks):
```bash
# path: Food-Delivery-WebApp/
npm run docker:start     # start
npm run docker:status    # status
npm run docker:health    # health check
npm run docker:logs      # tail logs
npm run docker:stop      # stop
npm run docker:reset     # full reset (drops volumes — destructive, confirm before running)
```

---

## 2. Open Web UIs in Browser

| Tool | URL | Credentials |
|---|---|---|
| RabbitMQ Management UI | http://localhost:15673 | `admin` / `rabbit123` |
| Mongo Express (DB browser) | http://localhost:8091 | `admin` / `admin123` |
| RedisInsight (Redis browser) | http://localhost:8093 | (connect manually — see below) |

**Open them all at once (macOS):**
```bash
open http://localhost:15673 http://localhost:8091 http://localhost:8093
```

**RedisInsight first-time setup:** click "Add Database" → host `localhost` (or `redis` if adding via the Docker network), port `6380`, password `redis123`.

**GraphQL Playgrounds** (once services are running):
```bash
open http://localhost:3000/graphql   # api-users
open http://localhost:4001/graphql   # api-restaurants
open http://localhost:4002/graphql   # api-orders
open http://localhost:4003/graphql   # api-Analytics
open http://localhost:4004/graphql   # api-reservations
open http://localhost:4005/graphql   # api-search
open http://localhost:4006/graphql   # api-chat (also ws://localhost:4006)
```

---

## 3. Run Services (nx serve)

Run each in its **own terminal tab**, from the repo root:
`Food-Delivery-WebApp/`

```bash
npx nx serve api-users          # http://localhost:3000/graphql
npx nx serve api-restaurants    # http://localhost:4001/graphql
npx nx serve api-orders         # http://localhost:4002/graphql
npx nx serve api-reservations   # http://localhost:4004/graphql
npx nx serve api-notifications  # microservice only, no HTTP port
npx nx serve api-Analytics      # http://localhost:4003/graphql
npx nx serve api-search         # http://localhost:4005/graphql
npx nx serve api-chat           # http://localhost:4006/graphql + ws://localhost:4006
```

Recommended startup order (matches dependency chain — users/restaurants must be up
before orders/reservations, since orders/reservations validate against them over RabbitMQ):

```
1. docker compose up -d
2. npx nx serve api-users
3. npx nx serve api-restaurants
4. npx nx serve api-orders
5. npx nx serve api-reservations
6. npx nx serve api-notifications
7. npx nx serve api-Analytics
```

Each `nx serve` process prints logs live to its own terminal — keep them open and
watch them side by side while you test in Postman.

---

## 4. Watch Live Service Logs

If you're running services via `nx serve` directly, logs stream to that terminal —
nothing extra to do. Below are extra options if you background them or run via Docker/PM2 later.

**Filter a running terminal's noisy Prisma query logs (grep in a second pane):**
```bash
npx nx serve api-orders 2>&1 | grep -v "^prisma:query"
```

**Watch only a specific emoji-tagged log line across a service (e.g. only order status events):**
```bash
npx nx serve api-orders 2>&1 | grep "🔄"
```

**Watch multiple services at once with labels (requires `concurrently`, optional):**
```bash
# path: Food-Delivery-WebApp/
npx concurrently -n USERS,RESTAURANTS,ORDERS,RESERVATIONS,NOTIF,ANALYTICS -c blue,green,yellow,magenta,cyan,red \
  "npx nx serve api-users" \
  "npx nx serve api-restaurants" \
  "npx nx serve api-orders" \
  "npx nx serve api-reservations" \
  "npx nx serve api-notifications" \
  "npx nx serve api-Analytics"
```
> `concurrently` isn't currently in `package.json`. If not installed, run once:
> `npm install --save-dev concurrently`

---

## 5. RabbitMQ — Watch Messages / Queues / Consumers

**List all queues with message + consumer + unacked counts (most useful single command):**
```bash
docker exec snackrapido-rabbitmq rabbitmqctl list_queues name messages consumers messages_unacknowledged
```

Queues you care about:
| Queue | Producers | Consumers |
|---|---|---|
| `snackrapido_queue` | orders, reservations | users, restaurants |
| `notifications_queue` | orders, reservations | notifications |
| `analytics_queue` | orders, reservations | analytics |

**List consumers per queue (who is actually connected and consuming):**
```bash
docker exec snackrapido-rabbitmq rabbitmqctl list_consumers
```

**Watch queues update live (refresh every 2s):**
```bash
watch -n 2 'docker exec snackrapido-rabbitmq rabbitmqctl list_queues name messages consumers messages_unacknowledged'
```

**Check via HTTP Management API instead of CLI (JSON, good for scripting):**
```bash
curl -u admin:rabbit123 http://localhost:15673/api/queues/%2F | python3 -m json.tool
```

**Check one specific queue's stats:**
```bash
curl -u admin:rabbit123 http://localhost:15673/api/queues/%2F/notifications_queue | python3 -m json.tool
curl -u admin:rabbit123 http://localhost:15673/api/queues/%2F/analytics_queue | python3 -m json.tool
curl -u admin:rabbit123 http://localhost:15673/api/queues/%2F/snackrapido_queue | python3 -m json.tool
```

**Purge a stuck queue (⚠️ destructive — deletes all messages in it, use only when you intend to discard them):**
```bash
docker exec snackrapido-rabbitmq rabbitmqctl purge_queue notifications_queue
docker exec snackrapido-rabbitmq rabbitmqctl purge_queue analytics_queue
docker exec snackrapido-rabbitmq rabbitmqctl purge_queue snackrapido_queue
```

**Tail RabbitMQ container logs (connection drops, channel errors like code 406, etc.):**
```bash
docker logs snackrapido-rabbitmq -f
docker logs snackrapido-rabbitmq --since 5m -t   # last 5 minutes, with timestamps
```

**Manually publish a test event into a queue (useful for testing notifications/analytics without going through orders):**
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

---

## 6. Redis — Watch Keys / Cache / Rate Limits

**Connect to Redis CLI:**
```bash
docker exec -it snackrapido-redis redis-cli -a redis123
```

Once inside the CLI:
```bash
KEYS *                          # list all keys
GET order:<order_id>            # inspect a cached order
TTL order:<order_id>            # check remaining TTL
GET reservation:<reservation_id>
GET restaurant:<restaurant_id>
GET bl:<token_value>            # check token blacklist (logout)
KEYS reg:*                      # pending user registrations
GET push_rate_limit:<userId>    # notification rate limit counters
GET email_rate_limit:<userId>
GET sms_rate_limit:<userId>
```

**Watch Redis commands live as they happen (great for seeing cache writes in real time while testing in Postman):**
```bash
docker exec -it snackrapido-redis redis-cli -a redis123 monitor
```
> Leave this running in its own terminal tab while you hit endpoints in Postman —
> every `SETEX`, `GET`, `DEL` etc. will print live.

**One-off key check without opening an interactive shell:**
```bash
docker exec snackrapido-redis redis-cli -a redis123 GET order:<order_id>
docker exec snackrapido-redis redis-cli -a redis123 KEYS "*"
```

**Tail Redis container logs:**
```bash
docker logs snackrapido-redis -f
docker logs snackrapido-redis --since 5m -t
```

---

## 7. MongoDB — Quick Inspection (without Mongo Express)

**Open a mongosh shell into a specific service DB:**
```bash
docker exec -it snackrapido-mongodb mongosh --quiet snackrapido_orders
docker exec -it snackrapido-mongodb mongosh --quiet snackrapido_users
docker exec -it snackrapido-mongodb mongosh --quiet snackrapido_restaurants
docker exec -it snackrapido-mongodb mongosh --quiet snackrapido_reservations
docker exec -it snackrapido-mongodb mongosh --quiet snackrapido_notifications
docker exec -it snackrapido-mongodb mongosh --quiet snackrapido_analytics
```

**One-off query without an interactive shell (example: check an order's owner):**
```bash
docker exec snackrapido-mongodb mongosh --quiet --eval \
  "db.Order.findOne({_id: ObjectId('<order_id>')}, {customerId: 1, status: 1})" \
  snackrapido_orders
```

**Tail MongoDB logs:**
```bash
docker logs snackrapido-mongodb -f
docker logs snackrapido-mongodb --since 5m -t
```

---

## 8. Full "Everything On" Startup Sequence

Copy-paste block to get from zero to fully running (open each `nx serve` line in
its own terminal tab — they're long-running processes and will block the terminal):

```bash
# Terminal 1 — infra
cd "Food-Delivery-WebApp"
docker compose up -d
docker compose ps

# Terminal 2
cd "Food-Delivery-WebApp"
npx nx serve api-users

# Terminal 3
cd "Food-Delivery-WebApp"
npx nx serve api-restaurants

# Terminal 4
cd "Food-Delivery-WebApp"
npx nx serve api-orders

# Terminal 5
cd "Food-Delivery-WebApp"
npx nx serve api-reservations

# Terminal 6
cd "Food-Delivery-WebApp"
npx nx serve api-notifications

# Terminal 7
cd "Food-Delivery-WebApp"
npx nx serve api-Analytics

# Terminal 8 — optional live queue watcher
watch -n 2 'docker exec snackrapido-rabbitmq rabbitmqctl list_queues name messages consumers messages_unacknowledged'

# Terminal 9 — optional live Redis watcher
docker exec -it snackrapido-redis redis-cli -a redis123 monitor
```

Then open in browser:
```bash
open http://localhost:15673  # RabbitMQ UI (admin/rabbit123)
open http://localhost:8091   # Mongo Express (admin/admin123)
open http://localhost:8093   # RedisInsight
open http://localhost:3000/graphql   # api-users playground
open http://localhost:4002/graphql   # api-orders playground
```

---

## 9. Health Check Everything At Once

```bash
# Docker containers
docker compose ps

# RabbitMQ queues
docker exec snackrapido-rabbitmq rabbitmqctl list_queues name messages consumers messages_unacknowledged

# Redis ping
docker exec snackrapido-redis redis-cli -a redis123 ping

# Mongo ping
docker exec snackrapido-mongodb mongosh --quiet --eval "db.adminCommand('ping')"
```

All should return healthy responses (`PONG` for Redis, `{ ok: 1 }` for Mongo, a queue table for RabbitMQ) before you start testing in Postman.

---

## Reference — Ports

| Service | Port | Type |
|---|---|---|
| api-users | 3000 | HTTP/GraphQL |
| api-restaurants | 4001 | HTTP/GraphQL |
| api-orders | 4002 | HTTP/GraphQL |
| api-Analytics | 4003 | HTTP/GraphQL |
| api-reservations | 4004 | HTTP/GraphQL |
| api-search | 4005 | HTTP/GraphQL |
| api-chat | 4006 | HTTP/GraphQL + WebSocket (ws://localhost:4006) |
| api-notifications | — | RabbitMQ consumer only, no HTTP |
| customer-app (frontend) | 5173 | Vite dev server (React) |
| MongoDB | 27019 | Database |
| Redis | 6380 | Cache |
| RabbitMQ (AMQP) | 5673 | Broker |
| RabbitMQ (Management UI) | 15673 | Web UI |
| Mongo Express | 8091 | Web UI |
| RedisInsight | 8093 | Web UI |

See also: `Food-Delivery-WebApp/postman/TESTING-GUIDE.md` for the full end-to-end
testing flow (phases, event maps, cache key reference, smoke test checklist).

User: john@example.com / password123
Restaurant: pizzapalace@snackrapido.com or burgerbarn@snackrapido.com / Password123!
Admin: admin@snackrapido.com / admin123
