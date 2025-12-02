/**
 * Migration Script: Move Notifications Data to Consolidated Database
 * 
 * This script migrates Notification and NotificationLog collections
 * from snackrapido_notifications database to the main snackrapido database
 * 
 * Usage:
 *   1. Update OLD_DB_URI and NEW_DB_URI with your connection strings
 *   2. Run: node scripts/migrate-notifications-data.js
 */

const { MongoClient } = require('mongodb');

// ⚠️ UPDATE THESE WITH YOUR ACTUAL CONNECTION STRINGS
const OLD_DB_URI = process.env.OLD_DATABASE_URL || 'mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9';
const NEW_DB_URI = process.env.DATABASE_URL || 'mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido?retryWrites=true&w=majority&appName=Cluster9';

const OLD_DB_NAME = 'snackrapido_notifications';
const NEW_DB_NAME = 'snackrapido';

async function migrateData() {
  const oldClient = new MongoClient(OLD_DB_URI);
  const newClient = new MongoClient(NEW_DB_URI);

  try {
    console.log('🔌 Connecting to databases...');
    await oldClient.connect();
    await newClient.connect();
    
    const oldDb = oldClient.db(OLD_DB_NAME);
    const newDb = newClient.db(NEW_DB_NAME);

    console.log('✅ Connected successfully\n');

    // ============================================
    // Migrate Notification Collection
    // ============================================
    console.log('📦 Step 1: Migrating Notification collection...');
    const notificationCount = await oldDb.collection('Notification').countDocuments();
    console.log(`   Found ${notificationCount} notifications in old database`);

    if (notificationCount > 0) {
      const notifications = await oldDb.collection('Notification').find({}).toArray();
      console.log(`   ✅ Fetched ${notifications.length} notifications`);

      // Check if collection exists in new database
      const existingCount = await newDb.collection('Notification').countDocuments();
      if (existingCount > 0) {
        console.log(`   ⚠️  Warning: ${existingCount} notifications already exist in new database`);
        console.log('   💡 Options:');
        console.log('      1. Skip migration (data already exists)');
        console.log('      2. Merge (add only new records)');
        console.log('      3. Replace (drop and recreate)');
        
        // For safety, we'll merge by default (skip duplicates)
        const existingIds = await newDb.collection('Notification').find({}).project({ _id: 1 }).toArray();
        const existingIdSet = new Set(existingIds.map(doc => doc._id.toString()));
        
        const newNotifications = notifications.filter(notif => !existingIdSet.has(notif._id.toString()));
        
        if (newNotifications.length > 0) {
          await newDb.collection('Notification').insertMany(newNotifications);
          console.log(`   ✅ Migrated ${newNotifications.length} new notifications (skipped ${notifications.length - newNotifications.length} duplicates)`);
        } else {
          console.log('   ℹ️  All notifications already exist in new database. Skipping.');
        }
      } else {
        await newDb.collection('Notification').insertMany(notifications);
        console.log(`   ✅ Migrated ${notifications.length} notifications`);
      }
    } else {
      console.log('   ℹ️  No notifications to migrate');
    }

    // ============================================
    // Migrate NotificationLog Collection
    // ============================================
    console.log('\n📦 Step 2: Migrating NotificationLog collection...');
    const logCount = await oldDb.collection('NotificationLog').countDocuments();
    console.log(`   Found ${logCount} notification logs in old database`);

    if (logCount > 0) {
      const logs = await oldDb.collection('NotificationLog').find({}).toArray();
      console.log(`   ✅ Fetched ${logs.length} notification logs`);

      const existingLogCount = await newDb.collection('NotificationLog').countDocuments();
      if (existingLogCount > 0) {
        console.log(`   ⚠️  Warning: ${existingLogCount} logs already exist in new database`);
        
        const existingLogIds = await newDb.collection('NotificationLog').find({}).project({ _id: 1 }).toArray();
        const existingLogIdSet = new Set(existingLogIds.map(doc => doc._id.toString()));
        
        const newLogs = logs.filter(log => !existingLogIdSet.has(log._id.toString()));
        
        if (newLogs.length > 0) {
          await newDb.collection('NotificationLog').insertMany(newLogs);
          console.log(`   ✅ Migrated ${newLogs.length} new logs (skipped ${logs.length - newLogs.length} duplicates)`);
        } else {
          console.log('   ℹ️  All logs already exist in new database. Skipping.');
        }
      } else {
        await newDb.collection('NotificationLog').insertMany(logs);
        console.log(`   ✅ Migrated ${logs.length} notification logs`);
      }
    } else {
      console.log('   ℹ️  No notification logs to migrate');
    }

    // ============================================
    // Verification
    // ============================================
    console.log('\n📊 Step 3: Verifying migration...');
    const finalNotificationCount = await newDb.collection('Notification').countDocuments();
    const finalLogCount = await newDb.collection('NotificationLog').countDocuments();
    
    console.log(`   ✅ Final counts in new database:`);
    console.log(`      - Notifications: ${finalNotificationCount}`);
    console.log(`      - Notification Logs: ${finalLogCount}`);

    // Sample a record to verify structure
    const sampleNotification = await newDb.collection('Notification').findOne({});
    if (sampleNotification) {
      console.log('\n   📄 Sample Notification structure:');
      console.log(`      - ID: ${sampleNotification._id}`);
      console.log(`      - Type: ${sampleNotification.type || 'N/A'}`);
      console.log(`      - User ID: ${sampleNotification.userId || 'N/A'}`);
      console.log(`      - Created: ${sampleNotification.createdAt || 'N/A'}`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update .env.local files to use the consolidated database');
    console.log('   2. Regenerate Prisma clients: npx prisma generate');
    console.log('   3. Push schemas: npx prisma db push');
    console.log('   4. Test your services');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await oldClient.close();
    await newClient.close();
    console.log('\n🔌 Database connections closed');
  }
}

// Run migration
console.log('🚀 Starting Notifications Data Migration\n');
console.log('📋 Configuration:');
console.log(`   Old Database: ${OLD_DB_NAME}`);
console.log(`   New Database: ${NEW_DB_NAME}\n`);

migrateData()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

