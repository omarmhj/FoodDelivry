# 📊 Analytics Service

Real-time sales and behavior tracking system for SnackRapido.

## 🎯 Features

- **Event-Driven Analytics**: Consumes `order.placed` events from RabbitMQ
- **Real-Time Metrics**: Track sales, popular items, and customer behavior
- **Redis Caching**: Fast retrieval of frequently accessed metrics
- **Scheduled Reports**: Automatic daily report generation
- **GraphQL API**: Query analytics data via GraphQL

---

## 🏗️ Architecture

```
┌──────────────┐
│ Orders       │
│ Service      │
└──────┬───────┘
       │ Publishes: order.placed
       ▼
┌──────────────┐
│  RabbitMQ    │
│ snackrapido_ │
│    queue     │
└──────┬───────┘
       │ Consumes events
       ▼
┌──────────────┐     ┌─────────┐
│  Analytics   │◄────┤  Redis  │
│  Service     │     │ Cache   │
│  Port: 4003  │     └─────────┘
└──────┬───────┘
       │
       ├──► 📊 Revenue Metrics
       ├──► 📈 Popular Items
       ├──► 📋 Daily Reports
       └──► ⏰ Scheduled Tasks
```

---

## 📊 Database Schema

### Analytics Model
```prisma
model Analytics {
  id           String        @id
  restaurantId String?
  metricType   AnalyticsType
  value        Float
  date         DateTime
  metadata     Json?
  createdAt    DateTime
  updatedAt    DateTime
}
```

### DailyReport Model
```prisma
model DailyReport {
  id                String
  restaurantId      String?
  date              DateTime
  totalOrders       Int
  totalRevenue      Float
  averageOrderValue Float
  popularItems      Json?
  customerCount     Int
  metadata          Json?
  createdAt         DateTime
  updatedAt         DateTime
}
```

### PopularItem Model
```prisma
model PopularItem {
  id           String
  restaurantId String
  menuItemId   String
  menuItemName String
  orderCount   Int
  totalRevenue Float
  date         DateTime
  createdAt    DateTime
  updatedAt    DateTime
}
```

### RevenueMetric Model
```prisma
model RevenueMetric {
  id           String
  restaurantId String?
  orderId      String
  orderNumber  String
  amount       Float
  date         DateTime
  hour         Int
  dayOfWeek    Int
  metadata     Json?
  createdAt    DateTime
}
```

---

## 🔧 Setup

### 1. Environment Variables

Create `apps/api-Analytics/.env.local`:

```env
PORT=4003
SERVICE_NAME=analytics-service
NODE_ENV=development

DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/snackrapido

RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
```

### 2. Generate Prisma Client

```bash
npx prisma generate --schema=apps/api-Analytics/prisma/schema.prisma
```

### 3. Push Schema to Database

```bash
npx prisma db push --schema=apps/api-Analytics/prisma/schema.prisma
```

---

## 🚀 Running the Service

```bash
# Start the service
npx nx serve api-Analytics --watch

# Access GraphQL Playground
http://localhost:4003/graphql
```

---

## 📈 GraphQL Queries

### Get Analytics
```graphql
query GetAnalytics {
  getAnalytics(
    restaurantId: "68bc668e799b7bb46a729fab"
    metricType: DAILY_SALES
    startDate: "2025-11-01"
    endDate: "2025-11-30"
  ) {
    id
    metricType
    value
    date
  }
}
```

### Get Daily Report
```graphql
query GetDailyReport {
  getDailyReport(
    restaurantId: "68bc668e799b7bb46a729fab"
    date: "2025-11-21"
  ) {
    totalOrders
    totalRevenue
    averageOrderValue
    customerCount
    popularItems
  }
}
```

### Get Popular Items
```graphql
query GetPopularItems {
  getPopularItems(
    restaurantId: "68bc668e799b7bb46a729fab"
    startDate: "2025-11-01"
    endDate: "2025-11-30"
    limit: 10
  ) {
    menuItemId
    menuItemName
    orderCount
    totalRevenue
  }
}
```

---

## ⏰ Scheduled Tasks

- **Daily Reports**: Runs at midnight (00:00)
- **Hourly Metrics**: Runs every hour

---

## 🔄 Event Processing

### Order Placed Event
When an order is created, the service:
1. Creates a revenue metric
2. Updates popular items count
3. Updates daily analytics
4. Invalidates cached metrics

---

## 💾 Redis Caching

| Data Type | Cache Key | TTL |
|-----------|-----------|-----|
| Analytics | `analytics:{restaurantId}:{type}:{dates}` | 5 minutes |
| Daily Report | `daily-report:{restaurantId}:{date}` | 1 hour |
| Popular Items | `popular-items:{restaurantId}:{dates}:{limit}` | 10 minutes |

---

## 🧪 Testing

### 1. Start Prerequisites
```bash
# Docker Compose (RabbitMQ, Redis, MongoDB)
docker-compose up -d

# Orders Service
npx nx serve api-orders --watch

# Analytics Service
npx nx serve api-Analytics --watch
```

### 2. Create Orders
Create orders via Orders Service GraphQL (port 4002 or 4000).

### 3. Watch Analytics Logs
You should see:
```
📦 Received order.placed event
📊 Processing order.placed event: ORD-...
✅ Analytics updated for order: ORD-...
```

### 4. Query Analytics Data
Use the GraphQL queries above to fetch analytics.

---

## 📦 Dependencies

The service requires:
- `@nestjs/schedule` (for cron jobs)
- `@prisma/client`
- `@nestjs/graphql`
- `@nestjs/apollo`
- `@nestjs/microservices`
- Redis and RabbitMQ (via shared module)

Install if missing:
```bash
npm install @nestjs/schedule
```

---

## 🔍 Troubleshooting

### Service not receiving events
- Check RabbitMQ connection
- Verify Orders Service is publishing events
- Check queue: `docker exec snackrapido-rabbitmq rabbitmqctl list_queues`

### Database connection failed
- Verify `DATABASE_URL` in `.env.local` (should point to the same database as other services)
- Check MongoDB is running

### Cache not working
- Verify Redis connection
- Check Redis logs: `docker-compose logs redis`

---

## 📝 Next Steps

1. Test event consumption
2. Verify analytics data in database
3. Test GraphQL queries
4. Monitor scheduled tasks
5. Proceed to Phase 7: Search & Recommendations Service

