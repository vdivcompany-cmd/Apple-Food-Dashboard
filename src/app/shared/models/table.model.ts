export type TableStatus = 'available' | 'occupied' | 'reserved' | 'bill_requested' | 'VACANT' | 'OCCUPIED' | 'RESERVED';

export interface RestaurantTable {
  id?: string;
  _id?: string;
  tableNumber: string | number;
  capacity?: number;
  section?: string;
  status?: TableStatus | string;
  isAvailable?: boolean;
  isActive?: boolean;
  currentOrderId?: string;
  currentOrderTotal?: number;
  seatedAt?: string;
  qrCodeUrl?: string;
}

