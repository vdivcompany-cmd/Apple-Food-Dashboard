export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type BackendOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED';

export type BackendOrderChannel =
  | 'DINE_IN'
  | 'TAKEAWAY'
  | 'DELIVERY'
  | 'QR'
  | 'WEB'
  | 'TELEGRAM';

export interface BackendOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedVariants?: {
    variantId?: string;
    variantName?: string;
    selectedOptionNames?: string[];
    priceDelta?: number;
  }[];
  notes?: string;
}

export interface BackendOrder {
  _id: string;
  id?: string;
  orderNumber?: string | number;
  tenantId?: string;
  branchId?: string;
  channel: BackendOrderChannel;
  tableId?: string;
  tableNumber?: string | number;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    deliveryAddress?: string;
    notes?: string;
  };
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  status: BackendOrderStatus;
  items: BackendOrderItem[];
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  couponCode?: string;
  cashierConfirmation?: {
    confirmedBy?: string;
    confirmedAt?: string;
    notes?: string;
  };
  kitchenExecution?: {
    receivedAt?: string;
    startedAt?: string;
    completedBy?: string;
    completedAt?: string;
    kitchenNotes?: string;
  };
  offlineGuid?: string;
  tableSessionId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  categoryName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
  imageUrl?: string;
  emoji?: string;
}

export interface CreateOrderPayload {
  branchId?: string;
  channel: BackendOrderChannel;
  tableId?: string;
  tableNumber?: string | number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  couponCode?: string;
  discountAmount?: number;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedVariants?: {
      variantId?: string;
      variantName?: string;
      selectedOptionNames?: string[];
      priceDelta?: number;
    }[];
    notes?: string;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  offlineGuid?: string;
}

export interface OfflineOrderEntry {
  guid: string;
  payload: CreateOrderPayload;
  queuedAt: string;
}

export interface OrderItemOption {
  name: string;
  choice: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  options?: OrderItemOption[];
}

export interface Order {
  id: string;
  orderNumber: string;
  tenantId: string;
  branchId: string;
  type: OrderType;
  tableNumber?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
  elapsedMinutes?: number;
}

