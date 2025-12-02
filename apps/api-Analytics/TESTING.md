# 📊 Analytics Service - Testing Guide

## 🧪 Test Cases

### Test Case 1: Order Event Processing

**Objective**: Verify that the Analytics service correctly processes `order.placed` events.

**Steps**:
1. Start the Analytics service:
   ```bash
   npx nx serve api-Analytics --watch
   ```

2. Create an order via Orders Service (http://localhost:4002/graphql):
   ```graphql
   mutation CreateOrder {
     createOrder(
       createOrderDto: {
         customerId: "68f4de4d4707160b3912ea41"
         customerName: "John Doe"
         customerEmail: "john@test.com"
         customerPhone: "1234567890"
         restaurantId: "68bc668e799b7bb46a729fab"
         restaurantName: "Bistro Parisien"
         restaurantAddress: "45 Rue de la République"
         deliveryType: DELIVERY
         deliveryAddress: "456 Oak Ave, New York"
         items: [
           {
             menuItemId: "68bcb8b9189bb86a04068d83"
             menuItemName: "Pizza Margherita"
             quantity: 2
             unitPrice: 12.99
           }
         ]
       }
     ) {
       message
       order {
         id
         orderNumber
         total
       }
     }
   }
   ```

3. **Expected Analytics Service Logs**:
   ```
   📦 [2025-11-21T...] Received order.placed event
   📦 Order Number: ORD-...
   📦 Order ID: ...
   📦 Restaurant ID: 68bc668e799b7bb46a729fab
   📦 Total: $25.98
   📊 Processing order.placed event: ORD-...
   ✅ Analytics updated for order: ORD-...
   ✅ Successfully processed order.placed event
   ```

4. **Verify in Database**:
   ```javascript
   // Connect to MongoDB
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/snackrapido_analytics"
   
   // Check revenue metrics
   db.RevenueMetric.find().sort({createdAt: -1}).limit(5).pretty()
   
   // Check popular items
   db.PopularItem.find().pretty()
   
   // Check daily reports
   db.DailyReport.find().pretty()
   ```

---

### Test Case 2: GraphQL Queries

**Objective**: Verify GraphQL queries work correctly.

**Steps**:
1. Open Analytics GraphQL Playground:
   ```
   http://localhost:4003/graphql
   ```

2. Query Daily Report:
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

3. **Expected Response**:
   ```json
   {
     "data": {
       "getDailyReport": {
         "totalOrders": 5,
         "totalRevenue": 150.50,
         "averageOrderValue": 30.10,
         "customerCount": 5,
         "popularItems": [...]
       }
     }
   }
   ```

4. Query Popular Items:
   ```graphql
   query GetPopularItems {
     getPopularItems(
       restaurantId: "68bc668e799b7bb46a729fab"
       startDate: "2025-11-01"
       endDate: "2025-11-30"
       limit: 5
     ) {
       menuItemName
       orderCount
       totalRevenue
     }
   }
   ```

---

### Test Case 3: Redis Caching

**Objective**: Verify Redis caching improves query performance.

**Steps**:
1. Query analytics data (first time - cache miss):
   ```graphql
   query GetAnalytics {
     getAnalytics(
       restaurantId: "68bc668e799b7bb46a729fab"
       metricType: DAILY_SALES
       startDate: "2025-11-01"
       endDate: "2025-11-30"
     ) {
       metricType
       value
       date
     }
   }
   ```

2. **Expected Logs (First Query)**:
   ```
   📊 Getting analytics: DAILY_SALES for restaurant: 68bc668e799b7bb46a729fab
   💾 Cache miss - fetching from database
   💾 Cached analytics data
   ```

3. **Run the same query again** (cache hit):
   ```
   📊 Getting analytics: DAILY_SALES for restaurant: 68bc668e799b7bb46a729fab
   🎯 Cache hit for analytics: analytics:68bc668e799b7bb46a729fab:DAILY_SALES:...
   ```

4. **Verify in Redis**:
   ```bash
   docker exec -it <redis-container> redis-cli
   KEYS analytics:*
   GET analytics:68bc668e799b7bb46a729fab:DAILY_SALES:...
   TTL analytics:68bc668e799b7bb46a729fab:DAILY_SALES:...
   # Should show ~300 seconds
   ```

---

### Test Case 4: Scheduled Daily Reports

**Objective**: Verify scheduled tasks generate daily reports.

**Steps**:
1. Wait for midnight or manually trigger:
   ```typescript
   // In analytics.scheduler.ts, temporarily change to:
   @Cron(CronExpression.EVERY_MINUTE)
   ```

2. **Expected Logs**:
   ```
   🕐 Scheduled task: Generating daily reports...
   📊 Generating daily reports...
   ✅ Daily reports generated for X restaurants
   ```

3. **Verify Reports Created**:
   ```javascript
   db.DailyReport.find().sort({createdAt: -1}).limit(5).pretty()
   ```

---

### Test Case 5: Multiple Orders

**Objective**: Verify analytics aggregate correctly.

**Steps**:
1. Create 5 orders for the same restaurant
2. Query daily report:
   ```graphql
   query {
     getDailyReport(
       restaurantId: "68bc668e799b7bb46a729fab"
       date: "2025-11-21"
     ) {
       totalOrders
       totalRevenue
       averageOrderValue
     }
   }
   ```

3. **Expected**:
   - `totalOrders`: 5
   - `totalRevenue`: Sum of all order totals
   - `averageOrderValue`: totalRevenue / 5

---

## 🐛 Troubleshooting

### Issue 1: Service Not Starting
```bash
# Check Prisma client
npx prisma generate --schema=apps/api-Analytics/prisma/schema.prisma

# Check environment variables
cat apps/api-Analytics/.env.local
```

### Issue 2: Not Receiving Events
```bash
# Check RabbitMQ
docker-compose logs rabbitmq

# Check queue
docker exec snackrapido-rabbitmq rabbitmqctl list_queues

# Verify Orders Service is publishing events
```

### Issue 3: Database Connection Failed
```bash
# Verify DATABASE_URL (should be the same as other services)
# Check MongoDB Atlas connection

# Test connection
mongosh "your-connection-string"
```

### Issue 4: Cache Not Working
```bash
# Check Redis
docker-compose logs redis

# Test Redis
docker exec -it <redis-container> redis-cli
PING
# Should return: PONG
```

---

## ✅ Success Criteria

- [ ] Service starts without errors
- [ ] Listens to RabbitMQ events
- [ ] Processes `order.placed` events
- [ ] Creates revenue metrics
- [ ] Updates popular items
- [ ] Updates daily reports
- [ ] GraphQL queries work
- [ ] Redis caching works
- [ ] Scheduled tasks execute
- [ ] Cache invalidation works

---

## 📝 Notes

- Analytics are calculated in real-time as orders are created
- Daily reports are generated at midnight
- Cache TTL: 5 minutes (analytics), 1 hour (daily reports), 10 minutes (popular items)
- All metrics are per restaurant and globally aggregated

---

## 🚀 Next Phase

After successful testing, proceed to **Phase 7: Search & Recommendations Service**.

