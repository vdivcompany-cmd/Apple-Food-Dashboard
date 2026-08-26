export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'cancelled';

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  guestsCount: number;
  date: string;
  time: string;
  tableNumber?: string;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
}
