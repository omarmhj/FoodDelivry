# 🔄 Migrate Data from Separate Databases to One Database

## 📋 Overview

This guide will help you migrate existing data from:
- `snackrapido_notifications` → `snackrapido` (or your chosen database)
- `snackrapido_analytics` → `snackrapido` (if it exists)
- Any other separate databases → `snackrapido`

---

## 🎯 Strategy

### Step 1: Backup Everything (Safety First!)
### Step 2: Export Data from Old Databases
### Step 3: Import Data into Consolidated Database
### Step 4: Verify Data Integrity
### Step 5: Update Services to Use New Database
### Step 6: Test Everything
### Step 7: Clean Up Old Databases (Optional)

---

## 📦 Prerequisites

1. **MongoDB Tools** (if using command line):
   ```bash
   # macOS
   brew install mongodb-database-tools
   
   # Or download from: https://www.mongodb.com/try/download/database-tools
   ```

2. **MongoDB Connection Strings**:
   - Old database: `mongodb+srv://...@cluster.mongodb.net/snackrapido_notifications`
   - New database: `mongodb+srv://...@cluster.mongodb.net/snackrapido`

---

## 🔧 Method 1: Using MongoDB Compass (GUI - Easiest)

### Step 1: Connect to Old Database

1. Open **MongoDB Compass**
2. Connect to: `mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9`
3. Navigate to the `Notification` collection
4. Click **Export Collection** → Choose **JSON** or **CSV**
5. Save the file (e.g., `notifications_backup.json`)
6. Repeat for `NotificationLog` collection

### Step 2: Connect to New Database

1. Connect to: `mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9`
2. Navigate to the `Notification` collection
3. Click **Import Data** → Select your backup file
4. Choose **JSON** format
5. Click **Import**
6. Repeat for `NotificationLog`

---

## 🔧 Method 2: Using MongoDB Shell (mongosh) - Recommended

### Step 1: Export Data from Old Database

```bash
# Connect to MongoDB
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9"

# Export Notification collection
mongoexport \
  --uri="mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9" \
  --collection=Notification \
  --out=./backup_notifications.json \
  --jsonArray

# Export NotificationLog collection
mongoexport \
  --uri="mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9" \
  --collection=NotificationLog \
  --out=./backup_notification_logs.json \
  --jsonArray
```

### Step 2: Import Data into New Database

```bash
# Import Notification collection
mongoimport \
  --uri="mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9" \
  --collection=Notification \
  --file=./backup_notifications.json \
  --jsonArray \
  --drop  # Optional: drops existing collection first

# Import NotificationLog collection
mongoimport \
  --uri="mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9" \
  --collection=NotificationLog \
  --file=./backup_notification_logs.json \
  --jsonArray \
  --drop  # Optional: drops existing collection first
```

---

## 🔧 Method 3: Using MongoDB Script (Automated)

Create a migration script:

```javascript
// migrate-data.js
const { MongoClient } = require('mongodb');

const OLD_DB_URI = 'mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9';
const NEW_DB_URI = 'mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9';

async function migrateData() {
  const oldClient = new MongoClient(OLD_DB_URI);
  const newClient = new MongoClient(NEW_DB_URI);

  try {
    // Connect to both databases
    await oldClient.connect();
    await newClient.connect();
    
    const oldDb = oldClient.db('snackrapido_notifications');
    const newDb = newClient.db('snackrapido');

    console.log('📦 Migrating Notification collection...');
    const notifications = await oldDb.collection('Notification').find({}).toArray();
    if (notifications.length > 0) {
      await newDb.collection('Notification').insertMany(notifications);
      console.log(`✅ Migrated ${notifications.length} notifications`);
    } else {
      console.log('ℹ️  No notifications to migrate');
    }

    console.log('📦 Migrating NotificationLog collection...');
    const logs = await oldDb.collection('NotificationLog').find({}).toArray();
    if (logs.length > 0) {
      await newDb.collection('NotificationLog').insertMany(logs);
      console.log(`✅ Migrated ${logs.length} notification logs`);
    } else {
      console.log('ℹ️  No notification logs to migrate');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await oldClient.close();
    await newClient.close();
  }
}

migrateData();
```

Run it:
```bash
node migrate-data.js
```

---

## 🔧 Method 4: Using Prisma Studio (For Small Datasets)

1. **Connect to old database**:
   ```bash
   # Update .env.local temporarily
   DATABASE_URL="mongodb+srv://...@cluster.mongodb.net/snackrapido_notifications"
   
   # Open Prisma Studio
   npx prisma studio --schema=apps/api-notifications/prisma/schema.prisma
   ```

2. **Copy data manually** (for small datasets):
   - View records in Prisma Studio
   - Copy JSON data
   - Switch to new database
   - Paste and create records

---

## ✅ Verification Steps

After migration, verify the data:

```javascript
// verify-migration.js
const { MongoClient } = require('mongodb');

const NEW_DB_URI = 'mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9';

async function verify() {
  const client = new MongoClient(NEW_DB_URI);
  
  try {
    await client.connect();
    const db = client.db('snackrapido');

    // Count notifications
    const notificationCount = await db.collection('Notification').countDocuments();
    console.log(`📊 Notifications: ${notificationCount}`);

    // Count notification logs
    const logCount = await db.collection('NotificationLog').countDocuments();
    console.log(`📊 Notification Logs: ${logCount}`);

    // Sample a few records
    const sampleNotification = await db.collection('Notification').findOne({});
    console.log('📄 Sample Notification:', sampleNotification);

    console.log('✅ Verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await client.close();
  }
}

verify();
```

---

## 🚨 Important Considerations

### 1. **ID Conflicts**

If you're merging data from multiple databases, you might have ID conflicts. Solutions:

**Option A: Keep existing IDs** (if no conflicts):
- Just import as-is

**Option B: Regenerate IDs** (if conflicts exist):
```javascript
// In migration script, regenerate ObjectIds
notifications.forEach(notif => {
  notif._id = new ObjectId(); // Generate new ID
});
```

### 2. **Indexes**

After migration, ensure indexes are created:

```bash
# Push schema to create indexes
npx prisma db push --schema=apps/api-notifications/prisma/schema.prisma
```

### 3. **Relationships**

If data has relationships (e.g., `userId` references), ensure:
- Referenced IDs exist in the new database
- Foreign key relationships are maintained

### 4. **Timestamps**

- `createdAt` and `updatedAt` are preserved
- No need to modify timestamps

---

## 📋 Complete Migration Checklist

- [ ] **Backup old databases** (export data)
- [ ] **Update all `.env.local` files** to use same database name
- [ ] **Export data** from `snackrapido_notifications`
- [ ] **Export data** from `snackrapido_analytics` (if exists)
- [ ] **Import data** into consolidated database
- [ ] **Verify data counts** match
- [ ] **Check sample records** for correctness
- [ ] **Regenerate Prisma clients** for all services
- [ ] **Push all schemas** to create indexes
- [ ] **Test services** with migrated data
- [ ] **Verify all collections** exist in new database
- [ ] **Optional: Delete old databases** (after confirming everything works)

---

## 🎯 Quick Command Summary

```bash
# 1. Export from old database
mongoexport --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido_notifications" \
  --collection=Notification --out=./backup_notifications.json --jsonArray

mongoexport --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido_notifications" \
  --collection=NotificationLog --out=./backup_notification_logs.json --jsonArray

# 2. Import to new database
mongoimport --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido" \
  --collection=Notification --file=./backup_notifications.json --jsonArray

mongoimport --uri="mongodb+srv://...@cluster.mongodb.net/snackrapido" \
  --collection=NotificationLog --file=./backup_notification_logs.json --jsonArray

# 3. Verify
mongosh "mongodb+srv://...@cluster.mongodb.net/snackrapido" \
  --eval "db.Notification.countDocuments()"
```

---

## 🆘 Troubleshooting

### Issue: "Collection already exists"
**Solution**: Use `--drop` flag to replace, or manually delete collection first

### Issue: "Duplicate key error"
**Solution**: IDs conflict - regenerate IDs or skip duplicates

### Issue: "Connection timeout"
**Solution**: Check network, whitelist IP in MongoDB Atlas

### Issue: "Authentication failed"
**Solution**: Verify username/password in connection string

---

## ✅ Success Criteria

After migration, you should have:
- ✅ All `Notification` records in new database
- ✅ All `NotificationLog` records in new database
- ✅ All other service collections in same database
- ✅ All services working with consolidated database
- ✅ No data loss
- ✅ Indexes created properly

---

## 🎉 Next Steps

After successful migration:
1. Test all services
2. Verify data integrity
3. Update documentation
4. Optional: Delete old databases (keep backups!)

Your data is now consolidated! 🚀


