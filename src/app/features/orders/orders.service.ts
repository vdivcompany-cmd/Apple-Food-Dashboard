import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import {
  BackendOrder,
  BackendOrderStatus,
  CreateOrderPayload,
  OfflineOrderEntry,
} from '../../shared/models/order.model';
import { AuthService } from '../../core/auth/auth.service';

const OFFLINE_QUEUE_KEY = 'restaurant_os_offline_orders_queue';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly orders = signal<BackendOrder[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly lastSynced = signal<Date>(new Date());
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Offline queue
  readonly offlineQueue = signal<OfflineOrderEntry[]>(this.loadOfflineQueue());
  readonly isSyncingOffline = signal<boolean>(false);

  private autoRefreshTimer: any = null;

  // Computed Kanban column groupings
  readonly pendingOrders = computed(() =>
    this.orders().filter((o) => o.status === 'PENDING')
  );

  readonly preparingOrders = computed(() =>
    this.orders().filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING')
  );

  readonly readyOrders = computed(() =>
    this.orders().filter((o) => o.status === 'READY')
  );

  readonly completedOrders = computed(() =>
    this.orders().filter((o) => o.status === 'SERVED' || o.status === 'PAID' || o.status === 'COMPLETED')
  );

  readonly activeOrdersCount = computed(
    () => this.pendingOrders().length + this.preparingOrders().length + this.readyOrders().length
  );

  constructor() {
    // Online / Offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.syncOfflineQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline.set(false);
      });
    }

    // Persist offline queue changes
    effect(() => {
      const queue = this.offlineQueue();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    });

    // Start auto-refresh timer (every 15s)
    this.startAutoRefresh();
  }

  private loadOfflineQueue(): OfflineOrderEntry[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  startAutoRefresh(intervalMs = 15000): void {
    this.stopAutoRefresh();
    this.fetchOrders(true);
    if (typeof window !== 'undefined') {
      this.autoRefreshTimer = setInterval(() => {
        if (this.auth.isAuthenticated() && this.isOnline()) {
          this.fetchOrders(false);
        }
      }, intervalMs);
    }
  }

  stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  fetchOrders(showFullLoader = false): void {
    if (showFullLoader) {
      this.isLoading.set(true);
    } else {
      this.isRefreshing.set(true);
    }
    this.error.set(null);

    this.http.get<{ success: boolean; data: BackendOrder[] }>(API_ENDPOINTS.orders.list).subscribe({
      next: (res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        // Sort descending by createdAt
        const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.orders.set(sorted);
        this.lastSynced.set(new Date());
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (err) => {
        console.warn('OrdersService.fetchOrders failed:', err?.message || err);
        this.error.set(err?.error?.message || 'Failed to fetch live orders');
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
    });
  }

  async createOrder(payload: CreateOrderPayload): Promise<{ success: boolean; order?: BackendOrder; offline?: boolean; error?: string }> {
    // If offline, queue locally
    if (!this.isOnline()) {
      return this.queueOfflineOrder(payload);
    }

    try {
      const res = await this.http
        .post<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.create, payload)
        .toPromise();

      if (res?.success && res.data) {
        // Prepend optimistic order
        this.orders.update((prev) => [res.data, ...prev]);
        return { success: true, order: res.data };
      }
      return { success: false, error: 'Server returned unsuccessful response' };
    } catch (err: any) {
      console.warn('Create order network failure, falling back to offline queue:', err);
      // Fallback to offline queue if network error
      if (!err?.status || err?.status === 0 || err?.status >= 500) {
        return this.queueOfflineOrder(payload);
      }
      return {
        success: false,
        error: err?.error?.message || err?.message || 'Failed to submit order',
      };
    }
  }

  private queueOfflineOrder(payload: CreateOrderPayload): { success: boolean; order: BackendOrder; offline: true } {
    const guid = 'offline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const entry: OfflineOrderEntry = {
      guid,
      payload: { ...payload, offlineGuid: guid },
      queuedAt: new Date().toISOString(),
    };

    this.offlineQueue.update((prev) => [...prev, entry]);

    // Create optimistic local order representation
    const optimisticOrder: BackendOrder = {
      _id: guid,
      id: guid,
      orderNumber: 'OFF-' + guid.substring(guid.length - 4).toUpperCase(),
      channel: payload.channel,
      tableId: payload.tableId,
      tableNumber: payload.tableNumber,
      customerName: payload.customerName || 'Walk-in',
      deliveryAddress: payload.deliveryAddress,
      status: 'PENDING',
      items: payload.items,
      subtotal: payload.subtotal,
      totalAmount: payload.totalAmount,
      offlineGuid: guid,
      createdAt: new Date().toISOString(),
    };

    this.orders.update((prev) => [optimisticOrder, ...prev]);
    return { success: true, order: optimisticOrder, offline: true };
  }

  async confirmCashierOrder(orderId: string): Promise<boolean> {
    try {
      // Optimistic update
      this.orders.update((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: 'CONFIRMED' } : o))
      );

      const res = await this.http
        .post<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.confirmCashier(orderId), {})
        .toPromise();

      if (res?.success && res.data) {
        this.orders.update((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? res.data : o))
        );
        return true;
      }
      return true;
    } catch (err: any) {
      console.error('confirmCashierOrder failed:', err);
      // Revert if error
      this.fetchOrders(false);
      return false;
    }
  }

  async completeOrder(orderId: string): Promise<boolean> {
    try {
      // Optimistic update
      this.orders.update((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
      );

      const res = await this.http
        .post<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.complete(orderId), {})
        .toPromise();

      if (res?.success && res.data) {
        this.orders.update((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? res.data : o))
        );
        return true;
      }
      return true;
    } catch (err: any) {
      console.error('completeOrder failed:', err);
      this.fetchOrders(false);
      return false;
    }
  }

  async updateOrderStatus(orderId: string, status: BackendOrderStatus, notes?: string): Promise<boolean> {
    try {
      this.orders.update((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status } : o))
      );

      const res = await this.http
        .patch<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.updateStatus(orderId), {
          status,
          notes,
        })
        .toPromise();

      if (res?.success && res.data) {
        this.orders.update((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? res.data : o))
        );
        return true;
      }
      return true;
    } catch (err: any) {
      console.error('updateOrderStatus failed:', err);
      this.fetchOrders(false);
      return false;
    }
  }

  async syncOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
    const queue = this.offlineQueue();
    if (queue.length === 0 || this.isSyncingOffline()) return { syncedCount: 0, errors: 0 };

    this.isSyncingOffline.set(true);
    let syncedCount = 0;
    let errors = 0;

    try {
      const ordersToSync = queue.map((q) => q.payload);
      const res = await this.http
        .post<{ success: boolean; data?: any }>(API_ENDPOINTS.orders.offlineSync, {
          orders: ordersToSync,
        })
        .toPromise();

      if (res?.success) {
        syncedCount = queue.length;
        this.offlineQueue.set([]);
      } else {
        // Fallback: sync one by one
        const remainingQueue: OfflineOrderEntry[] = [];
        for (const entry of queue) {
          try {
            const single = await this.http
              .post<{ success: boolean }>(API_ENDPOINTS.orders.create, entry.payload)
              .toPromise();
            if (single?.success) {
              syncedCount++;
            } else {
              remainingQueue.push(entry);
              errors++;
            }
          } catch {
            remainingQueue.push(entry);
            errors++;
          }
        }
        this.offlineQueue.set(remainingQueue);
      }
    } catch (err) {
      console.warn('Batch offline sync failed, attempting individual sync:', err);
      const remainingQueue: OfflineOrderEntry[] = [];
      for (const entry of queue) {
        try {
          const single = await this.http
            .post<{ success: boolean }>(API_ENDPOINTS.orders.create, entry.payload)
            .toPromise();
          if (single?.success) {
            syncedCount++;
          } else {
            remainingQueue.push(entry);
            errors++;
          }
        } catch {
          remainingQueue.push(entry);
          errors++;
        }
      }
      this.offlineQueue.set(remainingQueue);
    } finally {
      this.isSyncingOffline.set(false);
      this.fetchOrders(false);
    }

    return { syncedCount, errors };
  }
}
