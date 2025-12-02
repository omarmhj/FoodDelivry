/**
 * MongoDB Shell Script: Migrate Notifications Data
 * 
 * Usage:
 *   mongosh "mongodb+srv://...@cluster.mongodb.net/snackrapido?..." --file scripts/migrate-data.mongosh.js
 * 
 * Or copy-paste the contents into mongosh
 */

// Connect to old database
const oldDb = db.getSiblingDB('snackrapido_notifications');
oldDb.getMongo().setReadPref('primary');

// Current database (new/consolidated database)
const newDb = db.getSiblingDB('mydatabase');

print('🚀 Starting Notifications Data Migration\n');
print('📋 Configuration:');
print('   Old Database: snackrapido_notifications');
print('   New Database: mydatabase\n');

// ============================================
// Step 1: Migrate Notification Collection
// ============================================
print('📦 Step 1: Migrating Notification collection...');

const notificationCount = oldDb.Notification.countDocuments();
print(`   Found ${notificationCount} notifications in old database`);

if (notificationCount > 0) {
  const notifications = oldDb.Notification.find({}).toArray();
  print(`   ✅ Fetched ${notifications.length} notifications`);
  
  // Check if collection exists in new database
  const existingCount = newDb.Notification.countDocuments();
  
  if (existingCount > 0) {
    print(`   ⚠️  Warning: ${existingCount} notifications already exist in new database`);
    
    // Get existing IDs
    const existingIds = newDb.Notification.find({}).map(n => n._id.toString());
    const existingIdSet = new Set(existingIds);
    
    // Filter out duplicates
    const newNotifications = notifications.filter(n => !existingIdSet.has(n._id.toString()));
    
    if (newNotifications.length > 0) {
      const result = newDb.Notification.insertMany(newNotifications);
      print(`   ✅ Migrated ${newNotifications.length} new notifications (skipped ${notifications.length - newNotifications.length} duplicates)`);
    } else {
      print('   ℹ️  All notifications already exist in new database. Skipping.');
    }
  } else {
    // No existing data, insert all
    const result = newDb.Notification.insertMany(notifications);
    print(`   ✅ Migrated ${result.insertedIds.length} notifications`);
  }
} else {
  print('   ℹ️  No notifications to migrate');
}

// ============================================
// Step 2: Migrate NotificationLog Collection
// ============================================
print('\n📦 Step 2: Migrating NotificationLog collection...');

const logCount = oldDb.NotificationLog.countDocuments();
print(`   Found ${logCount} notification logs in old database`);

if (logCount > 0) {
  const logs = oldDb.NotificationLog.find({}).toArray();
  print(`   ✅ Fetched ${logs.length} notification logs`);
  
  const existingLogCount = newDb.NotificationLog.countDocuments();
  
  if (existingLogCount > 0) {
    print(`   ⚠️  Warning: ${existingLogCount} logs already exist in new database`);
    
    // Get existing IDs
    const existingLogIds = newDb.NotificationLog.find({}).map(l => l._id.toString());
    const existingLogIdSet = new Set(existingLogIds);
    
    // Filter out duplicates
    const newLogs = logs.filter(l => !existingLogIdSet.has(l._id.toString()));
    
    if (newLogs.length > 0) {
      const result = newDb.NotificationLog.insertMany(newLogs);
      print(`   ✅ Migrated ${newLogs.length} new logs (skipped ${logs.length - newLogs.length} duplicates)`);
    } else {
      print('   ℹ️  All logs already exist in new database. Skipping.');
    }
  } else {
    // No existing data, insert all
    const result = newDb.NotificationLog.insertMany(logs);
    print(`   ✅ Migrated ${result.insertedIds.length} notification logs`);
  }
} else {
  print('   ℹ️  No notification logs to migrate');
}

// ============================================
// Step 3: Verification
// ============================================
print('\n📊 Step 3: Verifying migration...');

const finalNotificationCount = newDb.Notification.countDocuments();
const finalLogCount = newDb.NotificationLog.countDocuments();

print(`   ✅ Final counts in new database:`);
print(`      - Notifications: ${finalNotificationCount}`);
print(`      - Notification Logs: ${finalLogCount}`);

// Sample a record to verify structure
const sampleNotification = newDb.Notification.findOne({});
if (sampleNotification) {
  print('\n   📄 Sample Notification structure:');
  print(`      - ID: ${sampleNotification._id}`);
  print(`      - Type: ${sampleNotification.type || 'N/A'}`);
  print(`      - User ID: ${sampleNotification.userId || 'N/A'}`);
  print(`      - Created: ${sampleNotification.createdAt || 'N/A'}`);
}

print('\n✅ Migration completed successfully!');
print('\n📝 Next steps:');
print('   1. Update .env.local files to use the consolidated database');
print('   2. Regenerate Prisma clients: npx prisma generate');
print('   3. Push schemas: npx prisma db push');
print('   4. Test your services');

