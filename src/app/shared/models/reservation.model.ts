export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'cancelled'
  | 'no_show'
  | 'PENDING'
  | 'CONFIRMED'
  | 'SEATED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type ReservationChannel = 'TELEGRAM' | 'WEB' | 'WHATSAPP' | 'DASHBOARD';

export interface Reservation {
  id?: string;
  _id?: string;
  tenantId?: string;
  branchId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize?: number;
  guestsCount?: number;
  reservedFor?: string;
  date?: string;
  time?: string;
  endTime?: string;
  tableId?: string;
  tableNumber?: string | number;
  section?: string;
  zone?: string;
  channel?: ReservationChannel | string;
  status: ReservationStatus;
  notes?: string;
  specialRequests?: string;
  occasion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReservationDto {
  tenantId: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservedFor: string;
  channel?: ReservationChannel;
  tableId?: string;
  notes?: string;
}


