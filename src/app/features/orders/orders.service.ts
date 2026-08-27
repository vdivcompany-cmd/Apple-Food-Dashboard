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

  // Table number cache (tableId -> table.number)
  readonly tableMap = signal<Map<string, number>>(new Map());

  // Offline queue
  readonly offlineQueue = signal<OfflineOrderEntry[]>(this.loadOfflineQueue());
  readonly isSyncingOffline = signal<boolean>(false);

  // New incoming order notification signals
  readonly latestNewOrder = signal<BackendOrder | null>(null);
  readonly hasNewOrderAlert = signal<boolean>(false);

  private isInitialFetch = true;
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

    // Fetch tables lookup cache
    this.fetchTablesMap();

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

  fetchTablesMap(): void {
    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tables.list).subscribe({
      next: (res) => {
        const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const map = new Map<string, number>();
        rawList.forEach((t: any) => {
          const id = t._id || t.id;
          if (id && t.number !== undefined) {
            map.set(String(id), Number(t.number));
          }
        });
        this.tableMap.set(map);
      },
      error: (err) => {
        console.warn('OrdersService.fetchTablesMap failed:', err);
      },
    });
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
        const prevList = this.orders();
        const prevIds = new Set(prevList.map((o) => o._id || o.id));

        // Enrich with tableNumber if missing but tableId is known
        const tMap = this.tableMap();
        const enriched = data.map((o: any) => {
          let tNum = o.tableNumber;
          if (tNum === undefined || tNum === null || tNum === '') {
            if (o.tableId && tMap.has(String(o.tableId))) {
              tNum = tMap.get(String(o.tableId));
            }
          }
          return {
            ...o,
            tableNumber: tNum,
          };
        });

        // Sort descending by createdAt
        const sorted = enriched.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Check for newly arrived PENDING orders
        if (!this.isInitialFetch && prevList.length > 0) {
          const newlyArrived = sorted.filter((o: any) => {
            const id = o._id || o.id;
            return !prevIds.has(id) && o.status === 'PENDING';
          });

          if (newlyArrived.length > 0) {
            this.playNewOrderChime();
            this.showNativeNotification(newlyArrived);
            this.latestNewOrder.set(newlyArrived[0]);
            this.hasNewOrderAlert.set(true);
          }
        }

        this.isInitialFetch = false;
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

  /**
   * Synthesize crisp 2-tone order bell alert (880Hz -> 1174.66Hz)
   */
  playNewOrderChime(): void {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1: High chime (880 Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: Bright finish (1174.66 Hz - D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.12);
      gain2.gain.setValueAtTime(0.35, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('playNewOrderChime failed:', e);
    }
  }

  /**
   * Send browser native Notification banner
   */
  showNativeNotification(newOrders: BackendOrder[]): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const latest = newOrders[0];
      const tableInfo = latest.tableNumber
        ? ` (Table ${latest.tableNumber})`
        : latest.channel === 'DINE_IN'
        ? ' (Dine-In)'
        : ` (${latest.channel})`;

      const title =
        newOrders.length === 1
          ? `🔔 New Order #${latest.orderNumber || latest._id?.slice(-4) || 'New'}`
          : `🔔 ${newOrders.length} New Orders Received!`;

      const body =
        newOrders.length === 1
          ? `${latest.customerName || 'Guest'}${tableInfo} • Total: ${latest.totalAmount || latest.subtotal || 0} EGP`
          : `Latest: #${latest.orderNumber || latest._id?.slice(-4) || ''}${tableInfo} • Click to view live board`;

      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'restaurant_new_order_' + Date.now(),
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('showNativeNotification failed:', e);
    }
  }

  async requestNotificationPermission(): Promise<void> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {
          console.warn('Notification.requestPermission error:', e);
        }
      }
    }
  }

  dismissNewOrderAlert(): void {
    this.hasNewOrderAlert.set(false);
    this.latestNewOrder.set(null);
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
