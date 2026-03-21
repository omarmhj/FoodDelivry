// Base message interface
export interface BaseMessage {
  id: string;
  timestamp: Date;
  source: string;
  version: string;
}

// User related messages
export interface UserCreatedMessage extends BaseMessage {
  type: 'user.created';
  data: {
    userId: string;
    email: string;
    name: string;
  };
}

export interface UserUpdatedMessage extends BaseMessage {
  type: 'user.updated';
  data: {
    userId: string;
    email?: string;
    name?: string;
    updatedFields: string[];
  };
}

// Restaurant related messages
export interface RestaurantCreatedMessage extends BaseMessage {
  type: 'restaurant.created';
  data: {
    restaurantId: string;
    name: string;
    email: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export interface RestaurantUpdatedMessage extends BaseMessage {
  type: 'restaurant.updated';
  data: {
    restaurantId: string;
    name?: string;
    email?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    updatedFields: string[];
  };
}

// Menu related messages
export interface MenuCreatedMessage extends BaseMessage {
  type: 'menu.created';
  data: {
    menuId: string;
    restaurantId: string;
    name: string;
  };
}

export interface MenuItemCreatedMessage extends BaseMessage {
  type: 'menu_item.created';
  data: {
    menuItemId: string;
    restaurantId: string;
    menuId: string;
    categoryId: string;
    name: string;
    price: number;
  };
}

// Notification messages
export interface EmailNotificationMessage extends BaseMessage {
  type: 'notification.send_email';
  data: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  };
}

// Cache messages
export interface CacheInvalidateMessage extends BaseMessage {
  type: 'cache.invalidate';
  data: {
    pattern: string;
    keys?: string[];
  };
}

// Union type for all message types
export type MessageType = 
  | UserCreatedMessage
  | UserUpdatedMessage
  | RestaurantCreatedMessage
  | RestaurantUpdatedMessage
  | MenuCreatedMessage
  | MenuItemCreatedMessage
  | EmailNotificationMessage
  | CacheInvalidateMessage;












