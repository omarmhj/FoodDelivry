# 🗑️ Delete `snackrapido_notifications` Database

## ✅ Pre-Deletion Checklist

Before deleting, verify everything is migrated:

- ✅ **Notifications**: 273 records migrated to `mydatabase`
- ✅ **NotificationLogs**: 455 records migrated to `mydatabase`
- ✅ **Analytics collections**: Created in `mydatabase` (no data to migrate)
- ✅ **Notifications service**: Updated to use `mydatabase` in `.env.local`

---

## 🔍 Optional: Final Verification

If you want to double-check before deleting:

```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9"
```

```javascript
// Check what collections exist
show collections

// Count documents in each
db.Notification.countDocuments()
db.NotificationLog.countDocuments()
db.Analytics.countDocuments()
db.DailyReport.countDocuments()
db.RevenueMetric.countDocuments()
db.PopularItem.countDocuments()
```

Then verify in `mydatabase`:
```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster9"
```

```javascript
// Verify counts match
db.Notification.countDocuments()  // Should be 273
db.NotificationLog.countDocuments()  // Should be 455
```

---

## 🗑️ Delete the Database

**⚠️ WARNING: This will permanently delete the database!**

```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/admin?retryWrites=true&w=majority&appName=Cluster9"
```

Then run:
```javascript
use admin

// Drop the database
db.getSiblingDB('snackrapido_notifications').dropDatabase()

print('✅ Deleted snackrapido_notifications database');
```

---

## ✅ Verification After Deletion

Try to connect to the deleted database (should fail):
```bash
mongosh "mongodb+srv://omarmhj9000:Omar123@cluster9.i7i0u.mongodb.net/snackrapido_notifications?retryWrites=true&w=majority&appName=Cluster9"
```

You should get an error like: "Database does not exist" or similar.

---

## 🎉 Done!

All data is now consolidated in `mydatabase`:
- ✅ Users service → `mydatabase`
- ✅ Restaurants service → `mydatabase`
- ✅ Orders service → `mydatabase`
- ✅ Notifications service → `mydatabase`
- ✅ Analytics service → `mydatabase`

Old database deleted! 🚀

