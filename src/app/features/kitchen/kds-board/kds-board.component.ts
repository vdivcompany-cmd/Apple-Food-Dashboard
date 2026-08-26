import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { KdsService, KdsStation } from '../kds.service';
import { BackendOrder } from '../../../shared/models/order.model';

@Component({
  selector: 'app-kds-board',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent],
  template: `
    <div class="space-y-4">
      <!-- KDS Header Bar (Stitch Design) -->
      <div class="bg-surface rounded-2xl border border-border p-4 shadow-card flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <!-- Title & Station Navigation Pills -->
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <app-icon name="speed" customClass="w-5 h-5"></app-icon>
            </div>
            <div>
              <h1 class="text-lg font-extrabold text-text-primary tracking-tight">Kitchen Display System</h1>
              <p class="text-xs text-text-muted">Touch-First Station Terminal • Auto-Urgency Escalation</p>
            </div>
          </div>

          <!-- Station Pills -->
          <div class="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-border">
            @for (st of stations; track st.id) {
              <button
                type="button"
                (click)="kdsService.selectedStation.set(st.id)"
                [class]="kdsService.selectedStation() === st.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'"
                class="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                @if (kdsService.selectedStation() === st.id) {
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                }
                <span>{{ st.label }}</span>
              </button>
            }
          </div>

          <!-- Channel Filter Pills -->
          <div class="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-border">
            <button
              type="button"
              (click)="kdsService.selectedChannel.set('ALL')"
              [class]="kdsService.selectedChannel() === 'ALL' ? 'bg-surface text-text-primary font-black shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              All Channels
            </button>
            <button
              type="button"
              (click)="kdsService.selectedChannel.set('DINE_IN')"
              [class]="kdsService.selectedChannel() === 'DINE_IN' ? 'bg-surface text-text-primary font-black shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Dine-In
            </button>
            <button
              type="button"
              (click)="kdsService.selectedChannel.set('TAKEAWAY')"
              [class]="kdsService.selectedChannel() === 'TAKEAWAY' ? 'bg-surface text-text-primary font-black shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Takeaway
            </button>
            <button
              type="button"
              (click)="kdsService.selectedChannel.set('DELIVERY')"
              [class]="kdsService.selectedChannel() === 'DELIVERY' ? 'bg-surface text-text-primary font-black shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Delivery
            </button>
          </div>
        </div>

        <!-- Right Side: Urgency Legend, Avg Prep Time & Sound Toggle -->
        <div class="flex items-center gap-4 self-end lg:self-center">
          <!-- Avg Prep Time -->
          <div class="text-right hidden sm:block">
            <span class="text-[10px] uppercase font-bold text-text-muted block tracking-wider">Avg Prep Time</span>
            <span class="text-sm font-extrabold text-primary">{{ kdsService.avgPrepTimeMinutes() }} mins</span>
          </div>

          <!-- Sound Alert Button -->
          <button
            type="button"
            (click)="kdsService.toggleSound()"
            [class]="kdsService.soundEnabled()
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-surface-container border-border text-text-muted'"
            class="px-3.5 py-2 rounded-xl border text-xs font-extrabold transition flex items-center gap-2 hover:bg-surface-hover cursor-pointer"
            [title]="kdsService.soundEnabled() ? 'Sound alerts enabled' : 'Sound alerts muted'"
          >
            <app-icon [name]="kdsService.soundEnabled() ? 'volume-2' : 'volume-x'" customClass="w-4 h-4"></app-icon>
            <span>{{ kdsService.soundEnabled() ? 'Sound On' : 'Muted' }}</span>
          </button>

          <!-- Auto Refresh Trigger -->
          <button
            type="button"
            (click)="kdsService.ordersService.fetchOrders(false)"
            [disabled]="kdsService.ordersService.isRefreshing()"
            class="p-2 rounded-xl bg-surface-container border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover transition cursor-pointer disabled:opacity-50"
            title="Refresh Kitchen Orders"
          >
            <app-icon name="refresh-cw" [customClass]="kdsService.ordersService.isRefreshing() ? 'w-4 h-4 animate-spin text-primary' : 'w-4 h-4'"></app-icon>
          </button>
        </div>
      </div>

      <!-- Urgency Banner / Tiers Indicator -->
      <div class="flex items-center justify-between px-2 text-xs">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span class="text-text-muted font-bold">&lt; 10m Fresh</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span class="text-text-muted font-bold">10-20m Cooking</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span class="text-red-500 font-extrabold">&gt; 20m Rush / Urgent</span>
          </div>
        </div>

        <div class="text-text-muted font-semibold">
          Active Tickets: <span class="font-bold text-text-primary">{{ kdsService.filteredOrders().length }}</span>
        </div>
      </div>

      <!-- 3-Column KDS Board (Stitch Design Layout) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[640px]">
        
        <!-- COLUMN 1: NEW ORDERS (Confirmed by Cashier, Ready to Start Cooking) -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <!-- Column Header -->
          <div class="p-3.5 bg-blue-500/10 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <h2 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">New Orders (Incoming)</h2>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-500 text-xs font-black">
              {{ kdsService.newOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (kdsService.newOrders().length === 0) {
              <div class="h-48 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="chef-hat" customClass="w-8 h-8 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">No new tickets</p>
                <p class="text-[11px] text-text-muted">Incoming orders from cashier appear here</p>
              </div>
            } @else {
              @for (order of kdsService.newOrders(); track order._id || order.id) {
                <div
                  class="bg-surface-container rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md relative group"
                  [ngClass]="getUrgencyBorderClass(order)"
                >
                  <!-- Card Header: Number, Channel, Live Timer -->
                  <div class="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-base font-black text-text-primary">
                          #{{ getOrderDisplayNumber(order) }}
                        </span>
                        <span class="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-extrabold uppercase text-text-secondary">
                          {{ order.channel }}
                        </span>
                      </div>
                      <div class="text-xs font-bold text-primary mt-0.5">
                        {{ order.channel === 'DINE_IN' ? 'Table ' + (order.tableNumber || '?') : (order.customerName || 'Takeaway') }}
                      </div>
                    </div>

                    <!-- Live Timer Badge -->
                    <div
                      class="px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs"
                      [ngClass]="getTimerBadgeClass(order)"
                    >
                      <app-icon name="timer" customClass="w-3.5 h-3.5"></app-icon>
                      <span>{{ kdsService.getElapsedFormatted(order) }}</span>
                    </div>
                  </div>

                  <!-- Item List -->
                  <div class="space-y-2 py-2.5 border-t border-b border-border/70 text-xs mb-3">
                    @for (item of order.items; track item.productId || item.name) {
                      <div class="flex items-start gap-2">
                        <span class="w-6 h-6 rounded-md bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                          {{ item.quantity }}x
                        </span>
                        <div class="flex-1">
                          <span class="font-bold text-text-primary block">{{ item.name }}</span>
                          @if (item.selectedVariants?.length) {
                            <div class="flex flex-wrap gap-1 mt-0.5">
                              @for (v of item.selectedVariants; track v.variantName || v.variantId) {
                                <span class="text-[10px] px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary font-medium">
                                  {{ v.variantName || v.selectedOptionNames?.join(', ') }}
                                </span>
                              }
                            </div>
                          }
                          @if (item.notes) {
                            <span class="text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded mt-1 inline-block">
                              ⚠️ {{ item.notes }}
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Card Action: Start Preparing Button & Detail Link -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="kdsService.startPreparing(order._id || order.id!)"
                      [disabled]="kdsService.processingOrderId() === (order._id || order.id)"
                      class="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      @if (kdsService.processingOrderId() === (order._id || order.id)) {
                        <app-icon name="refresh-cw" customClass="w-4 h-4 animate-spin"></app-icon>
                      } @else {
                        <app-icon name="chef-hat" customClass="w-4 h-4"></app-icon>
                        <span>Start Cooking</span>
                      }
                    </button>
                    <a
                      [routerLink]="['/kitchen/kds-detail', order._id || order.id]"
                      class="p-3 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary transition"
                      title="View Ticket Details"
                    >
                      <app-icon name="arrow-right" customClass="w-4 h-4"></app-icon>
                    </a>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- COLUMN 2: PREPARING (Cooking in Progress with Interactive Checklist) -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <!-- Column Header -->
          <div class="p-3.5 bg-primary/10 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
              <h2 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Preparing (Cooking)</h2>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-black">
              {{ kdsService.preparingOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (kdsService.preparingOrders().length === 0) {
              <div class="h-48 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="check-circle" customClass="w-8 h-8 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">Kitchen is clear</p>
                <p class="text-[11px] text-text-muted">Active cooking tickets will appear here</p>
              </div>
            } @else {
              @for (order of kdsService.preparingOrders(); track order._id || order.id) {
                <div
                  class="bg-surface-container rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md relative"
                  [ngClass]="getUrgencyBorderClass(order)"
                >
                  <!-- Card Header -->
                  <div class="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-base font-black text-text-primary">
                          #{{ getOrderDisplayNumber(order) }}
                        </span>
                        <span class="px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-extrabold uppercase text-text-secondary">
                          {{ order.channel }}
                        </span>
                      </div>
                      <div class="text-xs font-bold text-primary mt-0.5">
                        {{ order.channel === 'DINE_IN' ? 'Table ' + (order.tableNumber || '?') : (order.customerName || 'Takeaway') }}
                      </div>
                    </div>

                    <!-- Live Timer Badge -->
                    <div
                      class="px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-xs"
                      [ngClass]="getTimerBadgeClass(order)"
                    >
                      <app-icon name="timer" customClass="w-3.5 h-3.5"></app-icon>
                      <span>{{ kdsService.getElapsedFormatted(order) }}</span>
                    </div>
                  </div>

                  <!-- Interactive Item Checklist -->
                  <div class="space-y-2 py-2.5 border-t border-b border-border/70 text-xs mb-3">
                    @for (item of order.items; track item.productId || item.name; let idx = $index) {
                      <div
                        (click)="toggleItemChecked(order._id || order.id!, idx)"
                        class="flex items-start gap-2 p-1.5 rounded-lg hover:bg-surface/50 transition cursor-pointer select-none"
                      >
                        <div
                          class="w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors"
                          [ngClass]="isItemChecked(order._id || order.id!, idx)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-border bg-surface text-transparent'"
                        >
                          <app-icon name="check" customClass="w-3.5 h-3.5"></app-icon>
                        </div>
                        <div class="flex-1" [class.line-through]="isItemChecked(order._id || order.id!, idx)" [class.opacity-60]="isItemChecked(order._id || order.id!, idx)">
                          <span class="font-bold text-text-primary">{{ item.quantity }}x {{ item.name }}</span>
                          @if (item.notes) {
                            <span class="text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/30 px-1.5 py-0.2 rounded block mt-0.5">
                              ⚠️ {{ item.notes }}
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <!-- Actions: Mark Ready Button & Detail Link -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="kdsService.markReady(order._id || order.id!)"
                      [disabled]="kdsService.processingOrderId() === (order._id || order.id)"
                      class="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      @if (kdsService.processingOrderId() === (order._id || order.id)) {
                        <app-icon name="refresh-cw" customClass="w-4 h-4 animate-spin"></app-icon>
                      } @else {
                        <app-icon name="done-all" customClass="w-4 h-4"></app-icon>
                        <span>Mark Ready</span>
                      }
                    </button>
                    <a
                      [routerLink]="['/kitchen/kds-detail', order._id || order.id]"
                      class="p-3 rounded-xl bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary transition"
                      title="View Ticket Details"
                    >
                      <app-icon name="arrow-right" customClass="w-4 h-4"></app-icon>
                    </a>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- COLUMN 3: READY FOR PICKUP (Cooked, Waiting for Runner / Service) -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <!-- Column Header -->
          <div class="p-3.5 bg-emerald-500/10 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h2 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Ready for Pickup</h2>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-black">
              {{ kdsService.readyOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (kdsService.readyOrders().length === 0) {
              <div class="h-48 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="room-service" customClass="w-8 h-8 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">No orders waiting</p>
                <p class="text-[11px] text-text-muted">Cooked dishes waiting for service appear here</p>
              </div>
            } @else {
              @for (order of kdsService.readyOrders(); track order._id || order.id) {
                <div class="bg-surface-container rounded-xl p-4 shadow-sm border border-border/80 flex flex-col justify-between">
                  <!-- Header -->
                  <div>
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span class="text-base font-black text-text-primary block">
                          #{{ getOrderDisplayNumber(order) }}
                        </span>
                        <span class="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                          {{ order.channel === 'DINE_IN' ? 'Table ' + (order.tableNumber || '?') : order.channel }}
                        </span>
                      </div>
                      <span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[11px] font-extrabold flex items-center gap-1">
                        <app-icon name="check" customClass="w-3 h-3"></app-icon>
                        <span>Ready</span>
                      </span>
                    </div>

                    <!-- Runner Callout Box -->
                    <div class="py-3 px-3 bg-surface rounded-xl border border-border my-2 flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <app-icon name="room-service" customClass="w-4 h-4"></app-icon>
                      </div>
                      <div class="text-xs">
                        <p class="font-bold text-text-primary">Waiting for runner / cashier</p>
                        <p class="text-[10px] text-text-muted">{{ order.items.length }} items ready to serve</p>
                      </div>
                    </div>
                  </div>

                  <!-- Clear Ticket Action -->
                  <div class="pt-2">
                    <button
                      type="button"
                      (click)="kdsService.clearTicket(order._id || order.id!)"
                      [disabled]="kdsService.processingOrderId() === (order._id || order.id)"
                      class="w-full py-2.5 rounded-xl bg-surface border border-border hover:border-primary text-text-primary text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <app-icon name="check-circle" customClass="w-4 h-4 text-emerald-500"></app-icon>
                      <span>Clear Ticket</span>
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>

      </div>
    </div>
  `,
})
export default class KdsBoardComponent {
  readonly kdsService = inject(KdsService);

  readonly stations: { id: KdsStation; label: string }[] = [
    { id: 'ALL', label: 'All Stations' },
    { id: 'GRILL', label: 'Grill' },
    { id: 'FRYER', label: 'Fryer' },
    { id: 'SALAD', label: 'Salad' },
    { id: 'DRINKS', label: 'Drinks' },
  ];

  // Checklist tracking: map of orderId -> Set of item indices
  private readonly checkedMap = signal<Record<string, boolean[]>>({});

  getOrderDisplayNumber(order: BackendOrder): string {
    if (order.orderNumber) {
      return String(order.orderNumber).replace(/^#/, '');
    }
    const id = order._id || order.id || '';
    return id ? id.slice(-4).toUpperCase() : '----';
  }

  getUrgencyBorderClass(order: BackendOrder): string {
    const mins = this.kdsService.getElapsedMinutes(order);
    const tier = this.kdsService.getUrgencyTier(mins);
    if (tier === 'urgent') {
      return 'border-l-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]';
    }
    if (tier === 'warning') {
      return 'border-l-amber-500';
    }
    return 'border-l-emerald-500';
  }

  getTimerBadgeClass(order: BackendOrder): string {
    const mins = this.kdsService.getElapsedMinutes(order);
    const tier = this.kdsService.getUrgencyTier(mins);
    if (tier === 'urgent') {
      return 'bg-red-500 text-white animate-pulse';
    }
    if (tier === 'warning') {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
  }

  isItemChecked(orderId: string, index: number): boolean {
    return Boolean(this.checkedMap()[orderId]?.[index]);
  }

  toggleItemChecked(orderId: string, index: number): void {
    this.checkedMap.update((prev) => {
      const current = prev[orderId] || [];
      const updated = [...current];
      updated[index] = !updated[index];
      return { ...prev, [orderId]: updated };
    });
  }
}

