export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED';

export interface Reservation {
  id?: string;
  _id?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  guestsCount: number;
  date: string;
  time: string;
  endTime?: string;
  tableId?: string;
  tableNumber?: string | number;
  section?: string;
  zone?: string;
  status: ReservationStatus;
  notes?: string;
  specialRequests?: string;
  occasion?: string;
  createdAt?: string;
  updatedAt?: string;
}

