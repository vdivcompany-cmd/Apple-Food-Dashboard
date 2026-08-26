import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrdersService } from '../orders/orders.service';
import { BackendOrder, BackendOrderStatus } from '../../shared/models/order.model';
import { API_ENDPOINTS } from '../../core/api/api.config';

export type KdsStation = 'ALL' | 'GRILL' | 'FRYER' | 'SALAD' | 'DRINKS';
export type KdsUrgencyTier = 'fresh' | 'warning' | 'urgent';

@Injectable({
  providedIn: 'root',
})
export class KdsService {
  private readonly http = inject(HttpClient);
  readonly ordersService = inject(OrdersService);

  // Audio Alerts state
  readonly soundEnabled = signal<boolean>(
    typeof window !== 'undefined' ? localStorage.getItem('kds_sound_enabled') !== 'false' : true
  );

  // Station Filter
  readonly selectedStation = signal<KdsStation>('ALL');

  // Channel Filter
  readonly selectedChannel = signal<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('ALL');

  // Async action locking
  readonly processingOrderId = signal<string | null>(null);

  // Ticking signal for live elapsed time updates without full HTTP refetch
  readonly clockTick = signal<number>(Date.now());

  private previousNewCount = 0;
  private audioCtx: AudioContext | null = null;
  private tickInterval: any = null;

  // Active KDS Orders: CONFIRMED (new to kitchen), PREPARING (cooking), READY (cooked, waiting pickup)
  readonly activeKitchenOrders = computed(() => {
    // depend on clockTick to refresh elapsed calculations reactively
    this.clockTick();
    const all = this.ordersService.orders();
    return all.filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING' || o.status === 'READY');
  });

  // Filtered by Station and Channel
  readonly filteredOrders = computed(() => {
    const station = this.selectedStation();
    const channel = this.selectedChannel();
    return this.activeKitchenOrders().filter((order) => {
      // Channel match
      if (channel !== 'ALL') {
        if (channel === 'DINE_IN' && order.channel !== 'DINE_IN') return false;
        if (channel === 'TAKEAWAY' && order.channel !== 'TAKEAWAY') return false;
        if (channel === 'DELIVERY' && order.channel !== 'DELIVERY') return false;
      }
      // Station match
      if (station !== 'ALL') {
        return this.orderMatchesStation(order, station);
      }
      return true;
    });
  });

  // Column groupings
  readonly newOrders = computed(() =>
    this.filteredOrders().filter((o) => o.status === 'CONFIRMED')
  );

  readonly preparingOrders = computed(() =>
    this.filteredOrders().filter((o) => o.status === 'PREPARING')
  );

  readonly readyOrders = computed(() =>
    this.filteredOrders().filter((o) => o.status === 'READY')
  );

  // Average preparation time in minutes across active tickets
  readonly avgPrepTimeMinutes = computed(() => {
    const active = this.filteredOrders();
    if (active.length === 0) return 0;
    const totalMinutes = active.reduce((sum, o) => sum + this.getElapsedMinutes(o), 0);
    return Math.round(totalMinutes / active.length);
  });

  constructor() {
    // 10-second timer to update elapsed timers smoothly
    if (typeof window !== 'undefined') {
      this.tickInterval = setInterval(() => {
        this.clockTick.set(Date.now());
      }, 10000);
    }

    // Effect for sound alert when new orders arrive
    effect(() => {
      const currentNew = this.newOrders().length;
      if (currentNew > this.previousNewCount && this.previousNewCount > 0) {
        if (this.soundEnabled()) {
          this.playNewOrderChime();
        }
      }
      this.previousNewCount = currentNew;
    });
  }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kds_sound_enabled', String(next));
      if (next) {
        this.playNewOrderChime(); // Audio test confirmation
      }
    }
  }

  /**
   * Sound alert synthesizer using Web Audio API (zero external asset dependency)
   */
  playNewOrderChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      // High chime chord (E6 -> G#6 -> B6)
      const notes = [1318.51, 1661.22, 1975.53];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (err) {
      console.warn('Web Audio chime not supported or blocked by browser policy', err);
    }
  }

  /**
   * Transition order from CONFIRMED -> PREPARING (Start cooking)
   */
  async startPreparing(orderId: string): Promise<boolean> {
    this.processingOrderId.set(orderId);
    try {
      // Optimistic update
      this.ordersService.orders.update((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: 'PREPARING' as BackendOrderStatus } : o))
      );

      const res = await this.http
        .patch<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.updateStatus(orderId), {
          status: 'PREPARING',
        })
        .toPromise();

      if (res?.success && res.data) {
        this.ordersService.orders.update((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? res.data : o))
        );
      }
      return true;
    } catch (err) {
      console.error('KdsService: startPreparing failed', err);
      this.ordersService.fetchOrders(false);
      return false;
    } finally {
      this.processingOrderId.set(null);
    }
  }

  /**
   * Transition order from PREPARING/CONFIRMED -> READY (Mark Ready via complete-kitchen)
   */
  async markReady(orderId: string, notes?: string): Promise<boolean> {
    this.processingOrderId.set(orderId);
    try {
      // Optimistic update
      this.ordersService.orders.update((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: 'READY' as BackendOrderStatus } : o))
      );

      const res = await this.http
        .post<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.completeKitchen(orderId), {
          kitchenNotes: notes,
        })
        .toPromise();

      if (res?.success && res.data) {
        this.ordersService.orders.update((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? res.data : o))
        );
      }
      return true;
    } catch (err) {
      console.error('KdsService: markReady failed', err);
      this.ordersService.fetchOrders(false);
      return false;
    } finally {
      this.processingOrderId.set(null);
    }
  }

  /**
   * Clear ticket from ready column (SERVED / COMPLETED)
   */
  async clearTicket(orderId: string): Promise<boolean> {
    this.processingOrderId.set(orderId);
    try {
      // Optimistic update
      this.ordersService.orders.update((prev) =>
        prev.map((o) => (o._id === orderId || o.id === orderId ? { ...o, status: 'SERVED' as BackendOrderStatus } : o))
      );

      const res = await this.http
        .patch<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.updateStatus(orderId), {
          status: 'SERVED',
        })
        .toPromise();

      if (res?.success && res.data) {
        this.ordersService.orders.update((prev) =>
          prev.map((o) => (o._id === orderId || o.id === orderId ? res.data : o))
        );
      }
      return true;
    } catch (err) {
      console.error('KdsService: clearTicket failed', err);
      this.ordersService.fetchOrders(false);
      return false;
    } finally {
      this.processingOrderId.set(null);
    }
  }

  /**
   * Helper to compute elapsed time in minutes from order creation or kitchen receipt
   */
  getElapsedMinutes(order: BackendOrder): number {
    const timestamp = order.kitchenExecution?.receivedAt || order.createdAt;
    if (!timestamp) return 0;
    const diffMs = this.clockTick() - new Date(timestamp).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  }

  /**
   * Formatted elapsed time MM:SS
   */
  getElapsedFormatted(order: BackendOrder): string {
    const timestamp = order.kitchenExecution?.receivedAt || order.createdAt;
    if (!timestamp) return '00:00';
    const diffSec = Math.max(0, Math.floor((this.clockTick() - new Date(timestamp).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Urgency tier:
   * fresh: < 10m
   * warning: 10m - 20m
   * urgent: > 20m
   */
  getUrgencyTier(minutes: number): KdsUrgencyTier {
    if (minutes >= 20) return 'urgent';
    if (minutes >= 10) return 'warning';
    return 'fresh';
  }

  private orderMatchesStation(order: BackendOrder, station: KdsStation): boolean {
    const grillKeywords = ['burger', 'steak', 'meat', 'beef', 'chicken', 'patty', 'grill', 'ribeye', 'shawarma'];
    const fryerKeywords = ['fries', 'fried', 'crispy', 'rings', 'tender', 'nugget', 'tenders', 'fryer'];
    const saladKeywords = ['salad', 'caesar', 'green', 'slaw', 'cold', 'starter', 'soup', 'manger'];
    const drinksKeywords = ['drink', 'juice', 'cola', 'pepsi', 'coffee', 'tea', 'water', 'mojito', 'shake'];

    let targetKeywords: string[] = [];
    switch (station) {
      case 'GRILL':
        targetKeywords = grillKeywords;
        break;
      case 'FRYER':
        targetKeywords = fryerKeywords;
        break;
      case 'SALAD':
        targetKeywords = saladKeywords;
        break;
      case 'DRINKS':
        targetKeywords = drinksKeywords;
        break;
      default:
        return true;
    }

    return order.items.some((item) => {
      const name = item.name.toLowerCase();
      return targetKeywords.some((kw) => name.includes(kw));
    });
  }
}