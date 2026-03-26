# 📧 Notifications Service - Testing Guide

## 🎯 Overview
The Notifications Service listens to RabbitMQ events and sends multi-channel notifications (Email, SMS, Push) with rate limiting.

---

## 🚀 Step 1: Start the Notifications Service

### Start in a new terminal:
```bash
cd /Users/omarmahjoubi/Non-Synced\ Files/Documents/NestJs-Projects/NestJs/SnackRapido/Food-Delivery-WebApp

# Start the service
npx nx serve api-notifications
```

### Expected Output:
```
✅ Notifications Service is listening on RabbitMQ queue: notifications_queue
🔊 Listening for events:
   - order.placed
   - order.status.updated
   - order.reviewed
   - order.cancelled
```

---

## 🧪 Step 2: Test Notifications via Orders Service

The Notifications Service is **event-driven** (no GraphQL endpoint). It consumes events from RabbitMQ.

### Prerequisites:
1. ✅ Docker Compose running (MongoDB, Redis, RabbitMQ)
2. ✅ api-orders service running (port 4000)
3. ✅ api-notifications service running (background)

---

## 📋 Test Case 1: Order Placed Event

### 1.1: Create an Order
Open `http://localhost:4000/graphql` and run:

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
      specialInstructions: "Extra napkins please"
      items: [
        {
          menuItemId: "68bcb8b9189bb86a04068d83"
          menuItemName: "Pizza Margherita"
          menuItemDescription: "Classic Italian pizza"
          menuItemImage: "https://example.com/pizza.jpg"
          quantity: 2
          unitPrice: 12.99
          specialRequests: "Extra cheese"
        }
      ]
    }
  ) {
    message
    order {
      id
      orderNumber
      status
      total
    }
  }
}
```

### 1.2: Expected Notifications Service Logs
```
🐰 Received event: order.placed
📧 Processing order placed notification
   Order ID: 69024165ce5df248207b4d39
   Order Number: ORD-1761755492839-957
   Customer: John Doe (john@test.com)
   Total: $90.17

✉️ Sending email to: john@test.com
   Subject: Your order has been placed!
   
📱 Sending push notification (MOCK)
   Title: Order Placed Successfully
   Body: Your order #ORD-1761755492839-957 has been placed

💾 Notification saved to database
💾 Notification log created (SENT)
```

### 1.3: Verify in Database
```bash
# Connect to MongoDB
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications"

# Check notifications
db.Notification.find().pretty()

# Check logs
db.NotificationLog.find().pretty()
```

Expected Result:
```javascript
{
  _id: ObjectId("..."),
  userId: "68f4de4d4707160b3912ea41",
  type: "ORDER_UPDATE",
  title: "Order Placed Successfully",
  message: "Your order #ORD-1761755492839-957 has been placed",
  isRead: false,
  metadata: {
    orderId: "69024165ce5df248207b4d39",
    orderNumber: "ORD-1761755492839-957"
  },
  createdAt: ISODate("2025-10-29T21:40:33.841Z")
}
```

---

## 📋 Test Case 2: Order Status Updated Event

### 2.1: Update Order Status
```graphql
mutation UpdateOrderStatus {
  updateOrderStatus(
    updateStatusDto: {
      orderId: "69024165ce5df248207b4d39"
      status: CONFIRMED
      reason: "Restaurant confirmed the order"
    }
  ) {
    message
    order {
      id
      status
    }
  }
}
```

### 2.2: Expected Notifications Service Logs
```
🐰 Received event: order.status.updated
📧 Processing order status update notification
   Order ID: 69024165ce5df248207b4d39
   Previous Status: PENDING
   New Status: CONFIRMED
   
✉️ Sending email to: john@test.com
   Subject: Order Status Updated - CONFIRMED
   
📱 Sending push notification (MOCK)
   Title: Order Status Updated
   Body: Your order is now CONFIRMED

💾 Notification saved to database
```

---

## 📋 Test Case 3: Order Reviewed Event

### 3.1: Create Order Review
```graphql
mutation CreateOrderReview {
  createOrderReview(
    createReviewDto: {
      orderId: "69024165ce5df248207b4d39"
      rating: 5
      comment: "Amazing pizza! Fast delivery!"
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

### 3.2: Expected Notifications Service Logs
```
🐰 Received event: order.reviewed
📧 Processing order review notification
   Order ID: 69024165ce5df248207b4d39
   Rating: 5/5
   Comment: Amazing pizza! Fast delivery!
   
✉️ Sending email to restaurant: bistro@parisien.fr
   Subject: New Review Received - 5 Stars!
   
💾 Notification saved to database
```

---

## 📋 Test Case 4: Order Cancelled Event

### 4.1: Cancel Order
```graphql
mutation CancelOrder {
  cancelOrder(
    cancelOrderDto: {
      orderId: "69024165ce5df248207b4d39"
      reason: "Customer changed their mind"
    }
  ) {
    message
    order {
      id
      status
    }
  }
}
```

### 4.2: Expected Notifications Service Logs
```
🐰 Received event: order.cancelled
📧 Processing order cancellation notification
   Order ID: 69024165ce5df248207b4d39
   Reason: Customer changed their mind
   
✉️ Sending email to: john@test.com
   Subject: Order Cancelled - Refund Processing
   
📱 Sending push notification (MOCK)
   Title: Order Cancelled
   Body: Your order has been cancelled. Refund will be processed.

💾 Notification saved to database
```

---

## 📋 Test Case 5: Rate Limiting

### 5.1: Send 11 Orders in Quick Succession

Create 11 orders rapidly to trigger rate limiting.

### 5.2: Expected Behavior
- ✅ First 10 orders: Emails sent successfully
- ❌ 11th order: Rate limit hit

### 5.3: Expected Logs
```
⚠️ Rate limit exceeded for user: 68f4de4d4707160b3912ea41
❌ Email rate limit exceeded. Please try again later.
```

### 5.4: Verify Rate Limit in Redis
```bash
# Connect to Redis
docker exec -it <redis-container-id> redis-cli

# Check rate limit key
GET email_rate_limit:68f4de4d4707160b3912ea41
# Returns: "10"

# Check TTL (time remaining)
TTL email_rate_limit:68f4de4d4707160b3912ea41
# Returns: 3245 (seconds remaining until reset)
```

### 5.5: Wait and Retry
After 1 hour (or manually delete the key):
```bash
# Manually reset (for testing)
DEL email_rate_limit:68f4de4d4707160b3912ea41

# Now create another order → Should work
```

---

## 📋 Test Case 6: Verify Email Sending

### 6.1: Check SMTP Configuration
```bash
# View environment variables
cat apps/api-notifications/.env.local
```

Expected:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 6.2: Test Email (if configured)
If you have a real SMTP server:
1. Create an order
2. Check your email inbox
3. You should receive: "Your order has been placed!"

### 6.3: Mock Email (default)
If using mock (console logs):
```
✉️ [MOCK] Email sent to: john@test.com
   Subject: Your order has been placed!
   Content: <html>Your order #ORD-... has been placed</html>
```

---

## 📋 Test Case 7: Database Verification

### 7.1: Check Notifications Collection
```javascript
// Connect to MongoDB
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications"

// Count notifications
db.Notification.countDocuments()
// Expected: 10+ (depends on tests)

// Find by user
db.Notification.find({ userId: "68f4de4d4707160b3912ea41" }).pretty()

// Find unread notifications
db.Notification.find({ isRead: false }).pretty()

// Find by type
db.Notification.find({ type: "ORDER_UPDATE" }).pretty()
```

### 7.2: Check Notification Logs
```javascript
// Count logs
db.NotificationLog.countDocuments()

// Find failed notifications
db.NotificationLog.find({ status: "FAILED" }).pretty()

// Find by channel
db.NotificationLog.find({ channel: "EMAIL" }).pretty()
```

---

## 📊 Expected Results Summary

| Test Case | Event | Expected Notifications | Database Records |
|-----------|-------|------------------------|------------------|
| Order Created | `order.placed` | Email + Push (2) | 2 notifications, 2 logs |
| Status Updated | `order.status.updated` | Email + Push (2) | 2 notifications, 2 logs |
| Order Reviewed | `order.reviewed` | Email to restaurant (1) | 1 notification, 1 log |
| Order Cancelled | `order.cancelled` | Email + Push (2) | 2 notifications, 2 logs |
| 11th Email | Rate limit | ❌ Blocked | 0 (blocked) |

---

## 🐛 Troubleshooting

### Issue 1: Service Not Starting
```bash
# Check if port is in use
lsof -ti:3004

# Check Prisma client
npx prisma generate --schema=apps/api-notifications/prisma/schema.prisma

# Check environment variables
cat apps/api-notifications/.env.local
```

### Issue 2: Not Receiving Events
```bash
# Check RabbitMQ
docker-compose logs rabbitmq

# Check queue
docker exec -it <rabbitmq-container> rabbitmqctl list_queues

# Expected: notifications_queue
```

### Issue 3: Email Not Sending
```bash
# Check SMTP logs in service
# Verify SMTP credentials
# Check if using mock or real SMTP

# If using Gmail, enable "App Passwords"
```

### Issue 4: Rate Limit Not Working
```bash
# Check Redis connection
docker-compose logs redis

# Check Redis keys
docker exec -it <redis-container> redis-cli
KEYS email_rate_limit:*
```

---

## ✅ Success Criteria

- [ ] Service starts without errors
- [ ] Listens to RabbitMQ events
- [ ] Creates database notifications
- [ ] Logs notification attempts
- [ ] Rate limiting works (10 emails/hour)
- [ ] TTL resets after 1 hour
- [ ] Mock SMS/Push work (console logs)
- [ ] Email sending works (or logs correctly)

---

## 🎯 Next Steps After Testing

1. ✅ Verify all 4 event types work
2. ✅ Confirm rate limiting
3. ✅ Check database records
4. 🚀 Proceed to **Phase 5: Reservations Service**

---

## 📝 Quick Test Commands

```bash
# Start service
npx nx serve api-notifications

# Watch logs
docker-compose logs -f rabbitmq redis mongodb

# Check Redis
docker exec -it <redis-container> redis-cli
KEYS *

# Check MongoDB
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications"
db.Notification.find().count()
```

---

**Ready to test? Start the service and create an order!** 🚀

