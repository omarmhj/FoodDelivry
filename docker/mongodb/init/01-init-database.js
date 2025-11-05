// MongoDB initialization script for SnackRapido
// This script runs when the MongoDB container starts for the first time

// Switch to the snackrapido database
db = db.getSiblingDB('snackrapido');

// Create collections with proper indexes
print('Creating SnackRapido database and collections...');

// Users collection
db.createCollection('users');
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "phone_number": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "coordinates": "2dsphere" }); // For geospatial queries

// Restaurants collection
db.createCollection('restaurants');
db.restaurants.createIndex({ "email": 1 }, { unique: true });
db.restaurants.createIndex({ "coordinates": "2dsphere" }); // For geospatial queries
db.restaurants.createIndex({ "name": "text", "description": "text" }); // For text search

// Menus collection
db.createCollection('menus');
db.menus.createIndex({ "restaurantId": 1 });
db.menus.createIndex({ "name": 1, "restaurantId": 1 }, { unique: true });

// Categories collection
db.createCollection('categories');
db.categories.createIndex({ "restaurantId": 1 });
db.categories.createIndex({ "name": 1, "restaurantId": 1 }, { unique: true });

// MenuItems collection
db.createCollection('menuItems');
db.menuItems.createIndex({ "restaurantId": 1 });
db.menuItems.createIndex({ "menuId": 1 });
db.menuItems.createIndex({ "categoryId": 1 });
db.menuItems.createIndex({ "name": "text", "description": "text" }); // For text search
db.menuItems.createIndex({ "price": 1 });
db.menuItems.createIndex({ "available": 1 });

// Images collection
db.createCollection('images');
db.images.createIndex({ "foodId": 1 });
db.images.createIndex({ "public_id": 1 }, { unique: true });

// OperatingHours collection
db.createCollection('operatingHours');
db.operatingHours.createIndex({ "restaurantId": 1 });
db.operatingHours.createIndex({ "dayOfWeek": 1, "restaurantId": 1 }, { unique: true });

// Orders collection (for future use)
db.createCollection('orders');
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "restaurantId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": -1 });

// OrderItems collection (for future use)
db.createCollection('orderItems');
db.orderItems.createIndex({ "orderId": 1 });
db.orderItems.createIndex({ "menuItemId": 1 });

print('SnackRapido database initialized successfully!');
print('Collections created: users, restaurants, menus, categories, menuItems, images, operatingHours, orders, orderItems');
print('Indexes created for optimal performance and geospatial queries');









