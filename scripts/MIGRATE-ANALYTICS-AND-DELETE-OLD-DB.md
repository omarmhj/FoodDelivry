# 🔄 Migrate Analytics & Delete Old Database

## 📋 Step 1: Check What Analytics Collections Exist

First, let's see what Analytics collections are in `snackrapido_notifications`:

```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9"
```

Then run:
```javascript
show collections

// Check for Analytics collections:
// - Analytics
// - DailyReport
// - RevenueMetric
// - PopularItem

// Count documents
db.Analytics.countDocuments()
db.DailyReport.countDocuments()
db.RevenueMetric.countDocuments()
db.PopularItem.countDocuments()
```

---

## 🚀 Step 2: Migrate Analytics Collections

Connect to `mydatabase`:

```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster9"
```

Then run this migration code:

```javascript
// Migrate Analytics collections from snackrapido_notifications to mydatabase
const oldDb = db.getSiblingDB('snackrapido_notifications');

// Migrate Analytics collection
print('📦 Migrating Analytics collection...');
const analytics = oldDb.Analytics.find({}).toArray();
if (analytics.length > 0) {
  db.Analytics.insertMany(analytics);
  print('✅ Migrated ' + analytics.length + ' analytics records');
} else {
  print('ℹ️  No analytics records to migrate');
}

// Migrate DailyReport collection
print('\n📦 Migrating DailyReport collection...');
const dailyReports = oldDb.DailyReport.find({}).toArray();
if (dailyReports.length > 0) {
  db.DailyReport.insertMany(dailyReports);
  print('✅ Migrated ' + dailyReports.length + ' daily reports');
} else {
  print('ℹ️  No daily reports to migrate');
}

// Migrate RevenueMetric collection
print('\n📦 Migrating RevenueMetric collection...');
const revenueMetrics = oldDb.RevenueMetric.find({}).toArray();
if (revenueMetrics.length > 0) {
  db.RevenueMetric.insertMany(revenueMetrics);
  print('✅ Migrated ' + revenueMetrics.length + ' revenue metrics');
} else {
  print('ℹ️  No revenue metrics to migrate');
}

// Migrate PopularItem collection
print('\n📦 Migrating PopularItem collection...');
const popularItems = oldDb.PopularItem.find({}).toArray();
if (popularItems.length > 0) {
  db.PopularItem.insertMany(popularItems);
  print('✅ Migrated ' + popularItems.length + ' popular items');
} else {
  print('ℹ️  No popular items to migrate');
}

// Final counts
print('\n📊 Final counts in mydatabase:');
print('   Analytics: ' + db.Analytics.countDocuments());
print('   DailyReport: ' + db.DailyReport.countDocuments());
print('   RevenueMetric: ' + db.RevenueMetric.countDocuments());
print('   PopularItem: ' + db.PopularItem.countDocuments());
print('\n✅ Analytics migration completed!');
```

---

## 🗑️ Step 3: Delete Old Database

**⚠️ WARNING: This will permanently delete the `snackrapido_notifications` database!**

Make sure you've migrated everything first!

```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/admin?retryWrites=true&w=majority&appName=Cluster9"
```

Then:
```javascript
// Switch to admin database
use admin

// Drop the old database
db.getSiblingDB('snackrapido_notifications').dropDatabase()

print('✅ Deleted snackrapido_notifications database');
```

---

## 🔧 Step 4: Fix Prisma Generate

The error happened because you ran it from the service directory. Run from the **root** of the project:

```bash
cd /Users/omarmahjoubi/Non-Synced\ Files/Documents/NestJs-Projects/NestJs/SnackRapido/Food-Delivery-WebApp

npx prisma generate --schema=apps/api-Analytics/prisma/schema.prisma
```

---

## 📊 Step 5: Push Schema to Create Indexes

```bash
npx prisma db push --schema=apps/api-Analytics/prisma/schema.prisma
```

This will create the Analytics collections with proper indexes in `mydatabase`.

---

## ✅ Step 6: Verify Everything

In mongosh connected to `mydatabase`:

```javascript
use mydatabase

show collections

// You should see ALL collections:
// - User, Avatar (Users service)
// - Restaurant, Menu, Category, MenuItem, etc. (Restaurants service)
// - Order, OrderItem, OrderStatusHistory, OrderReview (Orders service)
// - Notification, NotificationLog (Notifications service)
// - Analytics, DailyReport, RevenueMetric, PopularItem (Analytics service)
```

---

## 🎯 Summary

1. ✅ Check what Analytics collections exist in old DB
2. ✅ Migrate Analytics collections to `mydatabase`
3. ✅ Delete `snackrapido_notifications` database
4. ✅ Fix Prisma generate (run from root)
5. ✅ Push schema to create indexes
6. ✅ Verify all collections in `mydatabase`

All done! Everything consolidated in `mydatabase`! 🚀

