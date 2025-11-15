# 🧪 Testing the Notifications Service

## Prerequisites

### 1. Environment Variables
Add these to your `.env` file:

```env
# Notifications Database
DATABASE_URL_NOTIFICATIONS=mongodb://localhost:27017/snackrapido_notifications

# SMTP Configuration (for real emails)
SMTP_HOST=smtp.gmail.com
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="SnackRapido <noreply@snackrapido.com>"

# RabbitMQ
RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
```

### 2. Start Docker Services
```bash
cd Food-Delivery-WebApp
docker-compose up -d
```

Verify services are running:
```bash
docker-compose ps
```

### 3. Generate Prisma Client
```bash
cd apps/api-notifications
npx prisma generate
```

---

## Running the Services

### Terminal 1: Start Notifications Service
```bash
cd Food-Delivery-WebApp
npx nx serve api-notifications
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║ 📧 NOTIFICATIONS SERVICE                                     ║
║ Multi-Channel Notification System                            ║
╚══════════════════════════════════════════════════════════════╝
📧 NOTIFICATIONS SERVICE | ✅ Notifications Service is running
📧 NOTIFICATIONS SERVICE | 🐰 RabbitMQ: Connected to notifications_queue
📧 NOTIFICATIONS SERVICE | 📧 Email Notifications: Ready
📧 NOTIFICATIONS SERVICE | 📱 SMS Notifications: Ready (Mock)
📧 NOTIFICATIONS SERVICE | 🔔 Push Notifications: Ready (Mock)
```

### Terminal 2: Start Orders Service
```bash
cd Food-Delivery-WebApp
npx nx serve api-orders --watch
```

### Terminal 3: Start Users Service (for authentication)
```bash
cd Food-Delivery-WebApp
npx nx serve api-users
```

### Terminal 4: Start Restaurants Service (for validation)
```bash
cd Food-Delivery-WebApp
npx nx serve api-restuarants
```

---

## Test Scenarios

### Test 1: Order Placed Notification

#### Step 1: Create an Order
Go to Orders GraphQL Playground: `http://localhost:4002/graphql`

```graphql
mutation {
  createOrder(
    createOrderDto: {
      customerId: "YOUR_CUSTOMER_ID"
      customerName: "John Doe"
      customerEmail: "john@test.com"
      customerPhone: "1234567890"
      restaurantId: "YOUR_RESTAURANT_ID"
      restaurantName: "Test Restaurant"
      restaurantAddress: "123 Test St"
      deliveryType: DELIVERY
      deliveryAddress: "456 Oak Ave, New York"
      items: [
        {
          menuItemId: "YOUR_MENU_ITEM_ID"
          menuItemName: "Pizza"
          quantity: 2
          unitPrice: 12.99
        }
      ]
      tax: 2.50
      deliveryFee: 5.99
      discount: 0
    }
  ) {
    message
    order {
      id
      orderNumber
      status
    }
  }
}
```

#### Expected Notifications Service Logs:
```
📦 Received order.placed event: {"orderId":"...","orderNumber":"ORD-..."}
✅ Notification created: [notification-id] for user: [customer-id]
📧 Email sent to: john@test.com
🔔 PUSH MOCK | User: [customer-id] | Title: Order Placed | Message: Your order #ORD-... has been placed successfully!
✅ Order placed notifications sent for order: ORD-...
```

#### Verify in Database:
```bash
mongosh mongodb://localhost:27017/snackrapido_notifications

# Check notifications
db.Notification.find({}).pretty()

# Check notification logs
db.NotificationLog.find({}).pretty()
```

---

### Test 2: Order Status Update Notification

#### Step 1: Update Order Status
```graphql
mutation {
  updateOrderStatus(
    updateStatusDto: {
      orderId: "YOUR_ORDER_ID"
      status: CONFIRMED
      reason: "Restaurant confirmed the order"
    }
  ) {
    message
    order {
      id
      orderNumber
      status
    }
  }
}
```

#### Expected Notifications Service Logs:
```
🔄 Received order.status.updated event: ORD-... -> CONFIRMED
✅ Notification created: [notification-id] for user: [customer-id]
📧 Email sent to: john@test.com
🔔 PUSH MOCK | User: [customer-id] | Title: Order Update | Message: Your order #ORD-... is confirmed!
✅ Order status update notifications sent for order: ORD-...
```

---

### Test 3: Multiple Status Updates (Full Order Lifecycle)

Run these mutations in sequence:

```graphql
# 1. CONFIRMED
mutation { updateOrderStatus(updateStatusDto: { orderId: "...", status: CONFIRMED, reason: "..." }) { message } }

# 2. PREPARING
mutation { updateOrderStatus(updateStatusDto: { orderId: "...", status: PREPARING, reason: "..." }) { message } }

# 3. READY
mutation { updateOrderStatus(updateStatusDto: { orderId: "...", status: READY, reason: "..." }) { message } }

# 4. OUT_FOR_DELIVERY
mutation { updateOrderStatus(updateStatusDto: { orderId: "...", status: OUT_FOR_DELIVERY, reason: "..." }) { message } }

# 5. DELIVERED
mutation { updateOrderStatus(updateStatusDto: { orderId: "...", status: DELIVERED, reason: "..." }) { message } }
```

Each status update should trigger:
- ✅ Database notification created
- 📧 Email sent (for important statuses: CONFIRMED, READY, OUT_FOR_DELIVERY, DELIVERED)
- 🔔 Push notification (mock) logged

---

### Test 4: Order Review Notification

#### Step 1: Create a Review
```graphql
mutation {
  createOrderReview(
    reviewDto: {
      orderId: "YOUR_ORDER_ID"
      rating: 5
      comment: "Great food!"
    }
  ) {
    message
    review {
      id
      rating
      comment
    }
  }
}
```

#### Expected Notifications Service Logs:
```
⭐ Received order.reviewed event: {"orderId":"...","rating":5}
✅ Notification created for restaurant: [restaurant-id]
✅ Order review notifications sent for order: [order-id]
```

---

### Test 5: Rate Limiting

#### Step 1: Create 11 Orders Quickly (Same User)
Use a script or send 11 mutations rapidly.

#### Expected Behavior:
- First 10 orders: ✅ Email sent successfully
- 11th order: ⚠️ Rate limit exceeded

#### Expected Log on 11th Order:
```
⚠️ Rate limit exceeded for user: [customer-id]
❌ Failed to send email: Email rate limit exceeded. Please try again later.
```

#### Verify Rate Limit in Redis:
```bash
redis-cli -a redis123
> GET "email_rate_limit:YOUR_CUSTOMER_ID"
"10"
> TTL "email_rate_limit:YOUR_CUSTOMER_ID"
3599  # seconds remaining (approx 1 hour)
```

---

### Test 6: Order Cancellation

#### Step 1: Cancel an Order
```graphql
mutation {
  cancelOrder(
    cancelOrderDto: {
      orderId: "YOUR_ORDER_ID"
      reason: "Customer requested cancellation"
    }
  ) {
    message
    order {
      id
      orderNumber
      status
    }
  }
}
```

#### Expected Notifications Service Logs:
```
❌ Received order.cancelled event: {"orderId":"..."}
✅ Notification created: [notification-id] for user: [customer-id]
📧 Email sent to: customer@example.com
🔔 PUSH MOCK | User: [customer-id] | Title: Order Update | Message: Your order #ORD-... is cancelled!
✅ Order status update notifications sent for order: ORD-...
```

---

## Monitoring & Debugging

### View RabbitMQ Management UI
```
http://localhost:15672
Username: admin
Password: rabbit123
```

Check:
- **Queues** → `notifications_queue`
- **Messages** → Should be consumed immediately
- **Connections** → Notifications service should be connected

### View Redis Data
```bash
redis-cli -a redis123

# List all keys
KEYS *

# Check rate limit for a user
GET "email_rate_limit:USER_ID"
GET "sms_rate_limit:USER_ID"
GET "push_rate_limit:USER_ID"

# Check TTL
TTL "email_rate_limit:USER_ID"
```

### View MongoDB Data
```bash
mongosh mongodb://localhost:27017/snackrapido_notifications

# View all notifications
db.Notification.find({}).pretty()

# View notifications for a specific user
db.Notification.find({ userId: ObjectId("YOUR_USER_ID") }).pretty()

# View all notification logs
db.NotificationLog.find({}).pretty()

# View failed notifications
db.NotificationLog.find({ status: "FAILED" }).pretty()

# Count notifications by channel
db.NotificationLog.aggregate([
  { $group: { _id: "$channel", count: { $sum: 1 } } }
])
```

---

## Troubleshooting

### Issue: Notifications Service Not Receiving Events

**Possible Causes:**
1. RabbitMQ not running
2. Wrong queue name
3. Orders service not publishing events

**Solutions:**
```bash
# Check RabbitMQ
docker-compose logs rabbitmq

# Check Orders service logs for "Event published"
# Check Notifications service logs for "Received event"

# Restart services
docker-compose restart rabbitmq
```

### Issue: Email Not Sending

**Possible Causes:**
1. Invalid SMTP credentials
2. Rate limit exceeded
3. Network/firewall issues

**Solutions:**
```bash
# Check SMTP credentials in .env
# Check rate limit in Redis
redis-cli -a redis123
GET "email_rate_limit:USER_ID"

# Test SMTP connection manually
```

### Issue: Rate Limit Not Working

**Possible Causes:**
1. Redis not running
2. Wrong Redis credentials

**Solutions:**
```bash
# Check Redis
docker-compose logs redis

# Test Redis connection
redis-cli -a redis123
PING  # Should return PONG
```

---

## Success Criteria

✅ **Notifications service starts successfully**
✅ **Consumes events from RabbitMQ**
✅ **Creates notifications in MongoDB**
✅ **Sends emails via SMTP**
✅ **Logs SMS/Push notifications (mock)**
✅ **Enforces rate limits via Redis**
✅ **Logs all notifications to NotificationLog**
✅ **Handles errors gracefully**

---

## Next Steps

After testing:
1. Review notification logs in MongoDB
2. Check email delivery (SMTP logs)
3. Verify rate limiting works
4. Consider implementing:
   - Real SMS integration (Twilio)
   - Real push notifications (Firebase)
   - Email templates with EJS
   - User notification preferences
   - Notification API endpoints

---

## Phase 4: ✅ COMPLETE!

The Notifications Service is fully operational and ready for production use (with real SMS/push integrations when needed).

