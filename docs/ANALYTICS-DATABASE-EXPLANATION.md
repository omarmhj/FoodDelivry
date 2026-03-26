# 📊 Analytics Service - Database Structure Explanation

## 📋 Question 1: How Many Tables/Collections?

The Analytics Prisma schema defines **4 collections (tables)**:

1. **`Analytics`** - General analytics metrics
2. **`DailyReport`** - Aggregated daily statistics
3. **`RevenueMetric`** - Individual order revenue tracking
4. **`PopularItem`** - Menu item popularity tracking

---

## 📊 Question 2: What Each Table Means & What Analytics It Tracks

### 1. **Analytics Collection**
**Purpose**: Stores general analytics metrics of various types

**What it tracks**:
- `DAILY_SALES` - Total sales per day
- `POPULAR_ITEMS` - Most ordered items
- `CUSTOMER_TRAFFIC` - Number of customers
- `ORDER_VOLUME` - Number of orders
- `REVENUE` - Revenue metrics
- `AVERAGE_ORDER_VALUE` - Average order amount
- `PEAK_HOURS` - Busiest hours
- `CUSTOMER_RETENTION` - Return customers

**Fields**:
```typescript
{
  id: string
  restaurantId?: string  // null = global metrics
  metricType: AnalyticsType
  value: number          // The metric value
  date: DateTime
  metadata?: Json        // Additional data
}
```

**Example Data**:
```json
{
  "id": "...",
  "restaurantId": "68bc668e799b7bb46a729fab",
  "metricType": "DAILY_SALES",
  "value": 1500.50,
  "date": "2025-11-21T00:00:00Z"
}
```

---

### 2. **DailyReport Collection**
**Purpose**: Pre-aggregated daily statistics for fast reporting

**What it tracks**:
- Total orders per day
- Total revenue per day
- Average order value
- Popular items (top 5)
- Customer count

**Fields**:
```typescript
{
  id: string
  restaurantId?: string
  date: DateTime
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  popularItems?: Json     // Array of top items
  customerCount: number
}
```

**Example Data**:
```json
{
  "id": "...",
  "restaurantId": "68bc668e799b7bb46a729fab",
  "date": "2025-11-21T00:00:00Z",
  "totalOrders": 25,
  "totalRevenue": 1250.75,
  "averageOrderValue": 50.03,
  "popularItems": [
    {"menuItemId": "...", "name": "Pizza Margherita", "count": 10}
  ],
  "customerCount": 20
}
```

**Why it exists**: Instead of calculating these stats every time, we pre-calculate them daily for fast queries.

---

### 3. **RevenueMetric Collection**
**Purpose**: Tracks revenue from each individual order

**What it tracks**:
- Revenue per order
- Hour of day (for peak hours analysis)
- Day of week (for weekly patterns)
- Order details

**Fields**:
```typescript
{
  id: string
  restaurantId?: string
  orderId: string
  orderNumber: string
  amount: number
  date: DateTime
  hour: number          // 0-23 (for peak hours)
  dayOfWeek: number     // 0-6 (Sunday-Saturday)
  metadata?: Json       // Customer ID, items, etc.
}
```

**Example Data**:
```json
{
  "id": "...",
  "restaurantId": "68bc668e799b7bb46a729fab",
  "orderId": "69024165ce5df248207b4d39",
  "orderNumber": "ORD-1761755492839-957",
  "amount": 90.17,
  "date": "2025-11-21T17:31:33Z",
  "hour": 17,           // 5 PM
  "dayOfWeek": 5,        // Friday
  "metadata": {
    "customerId": "68f4de4d4707160b3912ea41",
    "items": [...]
  }
}
```

**Why it exists**: Allows detailed analysis of:
- Peak hours (which hours have most orders)
- Weekly patterns (which days are busiest)
- Revenue trends over time

---

### 4. **PopularItem Collection**
**Purpose**: Tracks which menu items are most popular

**What it tracks**:
- Menu item order count
- Total revenue per item
- Per restaurant and per day

**Fields**:
```typescript
{
  id: string
  restaurantId: string
  menuItemId: string
  menuItemName: string
  orderCount: number      // How many times ordered
  totalRevenue: number     // Total revenue from this item
  date: DateTime
}
```

**Example Data**:
```json
{
  "id": "...",
  "restaurantId": "68bc668e799b7bb46a729fab",
  "menuItemId": "68bcb8b9189bb86a04068d83",
  "menuItemName": "Pizza Margherita",
  "orderCount": 45,        // Ordered 45 times today
  "totalRevenue": 584.55,  // Generated $584.55
  "date": "2025-11-21T00:00:00Z"
}
```

**Why it exists**: Helps restaurants understand:
- What items customers love most
- Which items generate most revenue
- Menu optimization opportunities

---

## 🗄️ Question 3 & 4: Database Structure Explained

### MongoDB Structure

In MongoDB, the structure is:
```
MongoDB Cluster
  └── Database (like a folder)
      └── Collection (like a table)
          └── Documents (like rows)
```

### Connection String Format

```
mongodb+srv://username:password@cluster.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority&appName=Cluster9
                                                      ^^^^^^^^^^^^
                                                      This is the database name
```

### Your Current Setup

Based on your services, here's what's happening:

| Service | Database Name | Collections |
|---------|--------------|-------------|
| **Users** | `snackrapido` or `mydatabase` | User, Avatars |
| **Restaurants** | `snackrapido` or `mydatabase` | Restaurant, Menu, Category, MenuItem, etc. |
| **Orders** | `snackrapido` or `mydatabase` | Order, OrderItem, OrderStatusHistory |
| **Notifications** | `snackrapido_notifications` | Notification, NotificationLog |
| **Analytics** | `snackrapido_analytics` | Analytics, DailyReport, RevenueMetric, PopularItem |

### Why Different Database Names?

**Option 1: Same Database (Recommended for Development)**
```
DATABASE_URL="mongodb+srv://...@cluster.mongodb.net/snackrapido?..."
```
- All services use the same database: `snackrapido`
- Collections are separated by name (User, Restaurant, Order, etc.)
- **Pros**: Easier to manage, single connection
- **Cons**: All data in one place

**Option 2: Separate Databases (Recommended for Production)**
```
DATABASE_URL_USERS="mongodb+srv://...@cluster.mongodb.net/snackrapido_users?..."
DATABASE_URL_NOTIFICATIONS="mongodb+srv://...@cluster.mongodb.net/snackrapido_notifications?..."
DATABASE_URL_ANALYTICS="mongodb+srv://...@cluster.mongodb.net/snackrapido_analytics?..."
```
- Each service has its own database
- **Pros**: Better isolation, easier scaling, security
- **Cons**: More databases to manage

### What You're Seeing

If you see collections under `snackrapido_notifications`, it means:
- Your Notifications service connection string has: `.../snackrapido_notifications?...`
- This is a **separate database** from your main `snackrapido` or `mydatabase`

If you see `mydatabase`, it means:
- Some services are using: `.../mydatabase?...`
- This is **another database** (probably your main one)

### Are They Different Databases?

**YES!** In MongoDB:
- `snackrapido_notifications` = **One database**
- `mydatabase` = **Another database**
- `snackrapido_analytics` = **Another database**

They are **separate databases** in the same MongoDB cluster.

---

## 🎯 Recommended Setup

### For Development (Current)
```
All services → snackrapido database
```

### For Production (Better)
```
Users Service → snackrapido_users database
Restaurants Service → snackrapido_restaurants database
Orders Service → snackrapido_orders database
Notifications Service → snackrapido_notifications database
Analytics Service → snackrapido_analytics database
```

---

## 📊 Summary

1. **4 Collections** in Analytics:
   - `Analytics` - General metrics
   - `DailyReport` - Daily summaries
   - `RevenueMetric` - Per-order revenue
   - `PopularItem` - Popular menu items

2. **Analytics tracks**:
   - Sales, revenue, orders
   - Popular items
   - Peak hours
   - Customer behavior

3. **Database names**:
   - `snackrapido_notifications` = Separate database for Notifications
   - `mydatabase` = Your main database
   - They are **different databases** in MongoDB

4. **Why separate databases?**
   - Better organization
   - Easier to scale
   - Better security isolation
   - Easier backup/restore per service


