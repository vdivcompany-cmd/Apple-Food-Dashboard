export type NotificationChannel = 'EMAIL' | 'TELEGRAM' | 'SMS' | 'WHATSAPP' | 'SYSTEM' | 'ORDER';
export type NotificationStatus = 'QUEUED' | 'SENT' | 'FAILED';

export interface NotificationLog {
  _id?: string;
  id?: string;
  tenantId: string;
  branchId?: string;
  channel: NotificationChannel;
  recipient: string;
  messageSubject?: string;
  messageBody: string;
  status: NotificationStatus;
  errorMessage?: string;
  tableNumber?: number;
  actionMakerId?: string;
  dispatchedAt: string;
  createdAt: string;
}

export interface DispatchNotificationDto {
  channel: NotificationChannel;
  recipient: string;
  messageSubject?: string;
  messageBody: string;
  tableNumber?: number;
  branchId?: string;
}
