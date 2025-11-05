// Order Service Types

export interface OrderCalculation {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export interface OrderTimeline {
  orderPlaced: Date;
  orderConfirmed?: Date;
  cookingStarted?: Date;
  orderReady?: Date;
  orderPickedUp?: Date;
  orderDelivered?: Date;
  orderCancelled?: Date;
}

export interface OrderMetrics {
  averagePreparationTime: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  coordinates?: {
    type: string;
    coordinates: number[];
  };
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface MenuItemInfo {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  availability: boolean;
}

export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  restaurantName: string;
  status: string;
  total: number;
  estimatedDeliveryTime?: Date;
}

export interface OrderEventData {
  orderId: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: string;
  previousStatus?: string;
  total: number;
  items: Array<{
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
  }>;
  deliveryType: string;
  deliveryAddress?: string;
  timestamp: Date;
  metadata?: any;
}

// Payment related types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  transactionId?: string;
}

// Delivery tracking types
export interface DeliveryTracking {
  orderId: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: Date;
  status: 'assigned' | 'picked_up' | 'en_route' | 'delivered';
}

// Order validation types
export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MenuItemValidation {
  menuItemId: string;
  isAvailable: boolean;
  currentPrice: number;
  maxQuantity?: number;
  error?: string;
}

// Analytics types
export interface OrderAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: Array<{
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByStatus: Record<string, number>;
  ordersByHour: Array<{
    hour: number;
    count: number;
  }>;
}









