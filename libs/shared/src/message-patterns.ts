// RabbitMQ Message Patterns
export const MESSAGE_PATTERNS = {
  // User Service Patterns
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  
  // Restaurant Service Patterns
  RESTAURANT_CREATED: 'restaurant.created',
  RESTAURANT_UPDATED: 'restaurant.updated',
  RESTAURANT_DELETED: 'restaurant.deleted',
  RESTAURANT_LOGIN: 'restaurant.login',
  RESTAURANT_LOGOUT: 'restaurant.logout',
  
  // Menu Patterns
  MENU_CREATED: 'menu.created',
  MENU_UPDATED: 'menu.updated',
  MENU_DELETED: 'menu.deleted',
  
  // Menu Item Patterns
  MENU_ITEM_CREATED: 'menu_item.created',
  MENU_ITEM_UPDATED: 'menu_item.updated',
  MENU_ITEM_DELETED: 'menu_item.deleted',
  
  // Category Patterns
  CATEGORY_CREATED: 'category.created',
  CATEGORY_UPDATED: 'category.updated',
  CATEGORY_DELETED: 'category.deleted',
  
  // Order Patterns
  ORDER_CREATED: 'order.created',
  ORDER_PLACED: 'order.placed',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready',
  ORDER_OUT_FOR_DELIVERY: 'order.out_for_delivery',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_STATUS_UPDATED: 'order.status_updated',
  ORDER_REVIEWED: 'order.reviewed',
  ORDER_PAYMENT_PROCESSED: 'order.payment_processed',
  
  // Notification Patterns
  SEND_EMAIL: 'notification.send_email',
  SEND_SMS: 'notification.send_sms',
  SEND_PUSH: 'notification.send_push',
  
  // Cache Patterns
  CACHE_INVALIDATE: 'cache.invalidate',
  CACHE_CLEAR: 'cache.clear',
  
  // Health Check
  HEALTH_CHECK: 'health.check',
} as const;

// Redis Channel Patterns (with wildcard support)
export const REDIS_CHANNELS = {
  USER_EVENTS: 'user.*',
  RESTAURANT_EVENTS: 'restaurant.*',
  MENU_EVENTS: 'menu.*',
  ORDER_EVENTS: 'order.*',
  NOTIFICATION_EVENTS: 'notification.*',
  CACHE_EVENTS: 'cache.*',
  HEALTH_EVENTS: 'health.*',
} as const;

// Redis Message Patterns (for direct messaging)
export const REDIS_MESSAGE_PATTERNS = {
  // User Service Patterns
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  
  // Restaurant Service Patterns
  RESTAURANT_CREATE: 'restaurant.create',
  RESTAURANT_UPDATE: 'restaurant.update',
  RESTAURANT_DELETE: 'restaurant.delete',
  RESTAURANT_LOGIN: 'restaurant.login',
  RESTAURANT_LOGOUT: 'restaurant.logout',
  
  // Menu Patterns
  MENU_CREATE: 'menu.create',
  MENU_UPDATE: 'menu.update',
  MENU_DELETE: 'menu.delete',
  
  // Menu Item Patterns
  MENU_ITEM_CREATE: 'menu_item.create',
  MENU_ITEM_UPDATE: 'menu_item.update',
  MENU_ITEM_DELETE: 'menu_item.delete',
  
  // Order Patterns
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_CANCEL: 'order.cancel',
  ORDER_COMPLETE: 'order.complete',
  
  // Health Check
  HEALTH_CHECK: 'health.check',
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER: (id: string) => `user:${id}`,
  RESTAURANT: (id: string) => `restaurant:${id}`,
  MENU: (id: string) => `menu:${id}`,
  MENU_ITEM: (id: string) => `menu_item:${id}`,
  CATEGORY: (id: string) => `category:${id}`,
  ORDER: (id: string) => `order:${id}`,
  ORDER_STATUS: (id: string) => `order_status:${id}`,
  CUSTOMER_ORDERS: (customerId: string) => `customer_orders:${customerId}`,
  RESTAURANT_ORDERS: (restaurantId: string) => `restaurant_orders:${restaurantId}`,
  RESTAURANTS_NEARBY: (lat: number, lng: number, radius: number) => 
    `restaurants:nearby:${lat}:${lng}:${radius}`,
  USER_SESSION: (userId: string) => `session:user:${userId}`,
  RESTAURANT_SESSION: (restaurantId: string) => `session:restaurant:${restaurantId}`,
} as const;
