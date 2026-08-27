export type TableStatus =
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'bill_requested'
  | 'VACANT'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'CLEANING';

export interface RestaurantTable {
  id?: string;
  _id?: string;
  tableNumber: string | number;
  name?: string;
  capacity?: number;
  section?: string;
  zone?: string;
  status?: TableStatus | string;
  isAvailable?: boolean;
  isActive?: boolean;
  shape?: 'round' | 'rect' | 'booth';
  x?: number;
  y?: number;
  currentOrderId?: string;
  currentOrderTotal?: number;
  seatedAt?: string;
  seatedMinutes?: number;
  qrCodeUrl?: string;
}


