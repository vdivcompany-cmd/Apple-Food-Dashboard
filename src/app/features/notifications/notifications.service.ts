import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { NotificationLog, DispatchNotificationDto } from '../../shared/models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly http = inject(HttpClient);

  readonly notifications = signal<NotificationLog[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isDispatching = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchNotifications(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.notifications.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped: NotificationLog[] = data.map((n: any) => ({
          _id: n._id || n.id,
          id: n._id || n.id,
          tenantId: n.tenantId,
          branchId: n.branchId,
          channel: n.channel || 'EMAIL',
          recipient: n.recipient || '',
          messageSubject: n.messageSubject || '',
          messageBody: n.messageBody || '',
          status: (n.status || 'QUEUED').toUpperCase(),
          errorMessage: n.errorMessage,
          tableNumber: n.tableNumber,
          actionMakerId: n.actionMakerId,
          dispatchedAt: n.dispatchedAt || n.createdAt || new Date().toISOString(),
          createdAt: n.createdAt || new Date().toISOString(),
        }));
        this.notifications.set(mapped);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('NotificationsService.fetchNotifications error:', err);
        this.error.set(err?.error?.message || 'Failed to load activity logs');
      },
    });
  }

  async dispatchNotification(dto: DispatchNotificationDto): Promise<{ success: boolean; error?: string }> {
    this.isDispatching.set(true);
    try {
      const res = await this.http
        .post<{ success: boolean; data: any }>(API_ENDPOINTS.notifications.dispatch, dto)
        .toPromise();
      this.isDispatching.set(false);
      if (res?.success) {
        this.fetchNotifications();
        return { success: true };
      }
      return { success: false, error: 'Failed to dispatch notification' };
    } catch (err: any) {
      this.isDispatching.set(false);
      console.warn('dispatchNotification error:', err);
      return { success: false, error: err?.error?.message || 'Failed to dispatch notification' };
    }
  }
}
