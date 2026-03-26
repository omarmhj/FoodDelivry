# 🔄 Consolidate All Services to One Database

## ✅ What I Fixed

I've updated the **Analytics service** to use `DATABASE_URL` instead of `DATABASE_URL_ANALYTICS`, so now all services use the same environment variable.

---

## 📋 Steps to Consolidate

### Step 1: Choose Your Database Name

Decide on a single database name. Recommended: **`snackrapido`**

### Step 2: Update All `.env.local` Files

Make sure all services use the **same database name** in their connection strings.

#### For Users Service (`apps/api-users/.env.local`):
```env
DATABASE_URL=mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9
```

#### For Restaurants Service (`apps/api-restuarants/.env.local`):
```env
DATABASE_URL=mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9
```

#### For Orders Service (`apps/api-orders/.env.local`):
```env
DATABASE_URL=mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9
```

#### For Notifications Service (`apps/api-notifications/.env.local`):
```env
DATABASE_URL=mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9
```

#### For Analytics Service (`apps/api-Analytics/.env.local`):
```env
DATABASE_URL=mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9
```

**Important**: Replace `snackrapido` with your chosen database name, and update the username/password if needed.

---

### Step 3: Regenerate Prisma Clients

After updating the schemas, regenerate all Prisma clients:

```bash
# Users
npx prisma generate --schema=apps/api-users/prisma/schema.prisma

# Restaurants
npx prisma generate --schema=apps/api-restuarants/prisma/schema.prisma

# Orders
npx prisma generate --schema=apps/api-orders/prisma/schema.prisma

# Notifications
npx prisma generate --schema=apps/api-notifications/prisma/schema.prisma

# Analytics
npx prisma generate --schema=apps/api-Analytics/prisma/schema.prisma
```

---

### Step 4: Push All Schemas to the Same Database

```bash
# Users
npx prisma db push --schema=apps/api-users/prisma/schema.prisma

# Restaurants
npx prisma db push --schema=apps/api-restuarants/prisma/schema.prisma

# Orders
npx prisma db push --schema=apps/api-orders/prisma/schema.prisma

# Notifications
npx prisma db push --schema=apps/api-notifications/prisma/schema.prisma

# Analytics
npx prisma db push --schema=apps/api-Analytics/prisma/schema.prisma
```

All collections will now be created in the **same database** (`snackrapido`).

---

## 🗄️ What Happens to Existing Data?

### Option A: Keep Existing Data (Recommended)

If you have data in separate databases (`snackrapido_notifications`, `snackrapido_analytics`, etc.), you can:

1. **Export data from old databases**:
   ```bash
   mongodump --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido_notifications" --out=./backup_notifications
   mongodump --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido_analytics" --out=./backup_analytics
   ```

2. **Import into the main database**:
   ```bash
   mongorestore --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido" ./backup_notifications/snackrapido_notifications
   mongorestore --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido" ./backup_analytics/snackrapido_analytics
   ```

### Option B: Start Fresh

If you don't need the old data, just update the `.env.local` files and push the schemas. The old databases can be deleted later.

---

## ✅ Verification

After consolidation, verify all collections are in one database:

1. **Connect to MongoDB** (via MongoDB Atlas or Compass)
2. **Check the database** (e.g., `snackrapido`)
3. **You should see all collections**:
   - `User`
   - `Avatar`
   - `Restaurant`
   - `Menu`
   - `Category`
   - `MenuItem`
   - `Images`
   - `OperatingHours`
   - `Reviews`
   - `Order`
   - `OrderItem`
   - `OrderStatusHistory`
   - `OrderReview`
   - `Notification`
   - `NotificationLog`
   - `Analytics`
   - `DailyReport`
   - `RevenueMetric`
   - `PopularItem`

---

## 📊 Final Structure

```
MongoDB Cluster
└── snackrapido (database)
    ├── User (collection)
    ├── Avatar (collection)
    ├── Restaurant (collection)
    ├── Menu (collection)
    ├── Category (collection)
    ├── MenuItem (collection)
    ├── Images (collection)
    ├── OperatingHours (collection)
    ├── Reviews (collection)
    ├── Order (collection)
    ├── OrderItem (collection)
    ├── OrderStatusHistory (collection)
    ├── OrderReview (collection)
    ├── Notification (collection)
    ├── NotificationLog (collection)
    ├── Analytics (collection)
    ├── DailyReport (collection)
    ├── RevenueMetric (collection)
    └── PopularItem (collection)
```

---

## 🎯 Benefits of One Database

✅ **Easier to manage** - All data in one place  
✅ **Simpler backups** - One database to backup  
✅ **Easier queries** - Can join data across services (if needed)  
✅ **Lower complexity** - No need to manage multiple databases  
✅ **Perfect for development** - Simpler setup

---

## ⚠️ Note

This setup is **perfect for development**. For production, you might want separate databases for:
- Better isolation
- Independent scaling
- Security boundaries

But for now, one database is **absolutely fine** and actually **simpler**!

---

## 🚀 Quick Command Summary

```bash
# 1. Update all .env.local files to use same database name
# 2. Regenerate Prisma clients
npx prisma generate --schema=apps/api-users/prisma/schema.prisma
npx prisma generate --schema=apps/api-restuarants/prisma/schema.prisma
npx prisma generate --schema=apps/api-orders/prisma/schema.prisma
npx prisma generate --schema=apps/api-notifications/prisma/schema.prisma
npx prisma generate --schema=apps/api-Analytics/prisma/schema.prisma

# 3. Push all schemas
npx prisma db push --schema=apps/api-users/prisma/schema.prisma
npx prisma db push --schema=apps/api-restuarants/prisma/schema.prisma
npx prisma db push --schema=apps/api-orders/prisma/schema.prisma
npx prisma db push --schema=apps/api-notifications/prisma/schema.prisma
npx prisma db push --schema=apps/api-Analytics/prisma/schema.prisma
```

Done! All services now use the same database. 🎉


