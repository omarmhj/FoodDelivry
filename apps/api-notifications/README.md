# 📧 Notifications Service (api-notifications)

## Overview
Multi-channel notification service for SnackRapido that handles email, SMS, and push notifications with Redis-based rate limiting.

## Features

### ✅ Implemented
- **RabbitMQ Event Consumers**: Listens to order events
- **Email Notifications**: Order confirmations, status updates
- **SMS Notifications**: Mock implementation (log to console)
- **Push Notifications**: Mock implementation (log to console)
- **Redis Rate Limiting**: Prevents notification spam
- **Notification Logging**: Tracks all sent notifications
- **Database Storage**: Stores notifications for user retrieval

### Event Listeners
- `order.placed` - Order confirmation emails
- `order.status.updated` - Status change notifications
- `order.reviewed` - Restaurant review notifications
- `order.cancelled` - Cancellation notifications

## Architecture

```
┌─────────────────────┐
│   Orders Service    │
│   (api-orders)      │
└──────────┬──────────┘
           │ Publishes events
           ▼
┌─────────────────────┐
│     RabbitMQ        │
│  (notifications_    │
│      queue)         │
└──────────┬──────────┘
           │ Consumes events
           ▼
┌─────────────────────┐
│  Notifications      │
│     Service         │
├─────────────────────┤
│ - Email (SMTP)      │
│ - SMS (Mock)        │
│ - Push (Mock)       │
│ - Rate Limiting     │
└─────────────────────┘
```

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL_NOTIFICATIONS=mongodb://localhost:27017/snackrapido_notifications

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_MAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="SnackRapido <noreply@snackrapido.com>"

# RabbitMQ
RABBITMQ_URL=amqp://admin:rabbit123@localhost:5672

# Redis (for rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123
```

## Rate Limiting

| Channel | Limit | Window |
|---------|-------|--------|
| Email   | 10/hour | 3600s |
| SMS     | 5/hour | 3600s |
| Push    | 20/hour | 3600s |

Rate limits are enforced per user using Redis with automatic TTL expiration.

## Database Schema

### Notification
```prisma
model Notification {
  id        String           @id
  userId    String
  type      NotificationType
  title     String
  message   String
  isRead    Boolean
  metadata  Json?
  createdAt DateTime
  updatedAt DateTime
}
```

### NotificationLog
```prisma
model NotificationLog {
  id             String
  userId         String
  type           String
  channel        String  // EMAIL, SMS, PUSH
  status         String  // SENT, FAILED, PENDING
  recipientEmail String?
  recipientPhone String?
  subject        String?
  content        String
  errorMessage   String?
  sentAt         DateTime?
  createdAt      DateTime
}
```

## Usage

### Start the Service
```bash
npx nx serve api-notifications
```

### Generate Prisma Client
```bash
cd apps/api-notifications
npx prisma generate
```

### Run Migrations (if needed)
```bash
cd apps/api-notifications
npx prisma db push
```

## Notification Types

```typescript
enum NotificationType {
  ORDER_UPDATE
  RESERVATION_CONFIRMATION
  PROMOTION
  SYSTEM_ALERT
  CHAT_MESSAGE
}
```

## Email Templates

### Order Confirmation
- Order number
- Restaurant name
- Total amount
- Delivery details
- Estimated delivery time

### Order Status Update
- Order number
- Current status
- Human-readable status labels

## Testing

### Test Order Placed Event
1. Create an order via Orders Service
2. Check notification logs
3. Verify email sent (check SMTP logs)
4. Verify push notification logged

### Test Rate Limiting
1. Send 11 emails within an hour
2. 11th email should be rejected
3. Check Redis for rate limit counter

## Future Enhancements
- Real SMS integration (Twilio, AWS SNS)
- Real push notifications (Firebase Cloud Messaging)
- Email templates with EJS
- Notification preferences per user
- Scheduled notifications
- Notification batching
- WebSocket for real-time notifications

## Dependencies
- `@nestjs/microservices` - RabbitMQ consumer
- `@nestjs-modules/mailer` - Email sending
- `@prisma/client` - Database ORM
- `ioredis` - Redis client for rate limiting
- `amqplib` - RabbitMQ client

## Logs
Look for these prefixes in logs:
- `📧 NOTIFICATIONS SERVICE` - Service startup
- `📦 Received order.placed event` - Order created
- `🔄 Received order.status.updated event` - Status changed
- `⭐ Received order.reviewed event` - Review added
- `📧 Email sent to` - Email sent successfully
- `📱 SMS MOCK` - SMS mock logged
- `🔔 PUSH MOCK` - Push notification mock logged
- `⚠️ Rate limit exceeded` - Rate limit hit

## Phase 4 Status: ✅ COMPLETED

All Phase 4 objectives achieved:
- ✅ Step 4.1: Created api-notifications microservice with RabbitMQ consumer
- ✅ Step 4.2: Implemented email notifications for order events
- ✅ Step 4.3: Added Redis-based rate limiting
- ✅ Step 4.4: Mocked SMS/push notifications

