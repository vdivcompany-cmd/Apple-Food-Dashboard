import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { KdsService } from '../kds.service';
import { OrdersService } from '../../orders/orders.service';
import { BackendOrder } from '../../../shared/models/order.model';
import { API_ENDPOINTS } from '../../../core/api/api.config';

@Component({
  selector: 'app-kds-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent, RelativeTimePipe],
  template: `
    <div class="max-w-5xl mx-auto space-y-5">
      <!-- Top Navigation & Status Bar -->
      <div class="flex items-center justify-between">
        <a
          routerLink="/kitchen/kds-board"
          class="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors py-2 px-3 rounded-xl bg-surface border border-border hover:bg-surface-hover text-xs font-bold"
        >
          <app-icon name="arrow-left" customClass="w-4 h-4"></app-icon>
          <span>Back to KDS Board</span>
        </a>

        @if (order()) {
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-surface-container border border-border text-text-primary font-extrabold text-xs rounded-full uppercase tracking-wider">
              {{ order()!.channel }}
            </span>
            @if (isUrgent()) {
              <span class="px-3 py-1 bg-red-500 text-white font-black text-xs rounded-full uppercase tracking-wider animate-pulse shadow-sm flex items-center gap-1">
                <app-icon name="flame" customClass="w-3.5 h-3.5"></app-icon>
                <span>RUSH (&gt;20m)</span>
              </span>
            } @else {
              <span class="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-full">
                {{ order()!.status }}
              </span>
            }
          </div>
        }
      </div>

      <!-- Loading / Not Found State -->
      @if (isLoading()) {
        <div class="h-64 flex flex-col items-center justify-center text-center p-8 bg-surface rounded-2xl border border-border">
          <app-icon name="refresh-cw" customClass="w-8 h-8 animate-spin text-primary mb-3"></app-icon>
          <p class="text-sm font-bold text-text-primary">Loading kitchen ticket...</p>
        </div>
      } @else if (!order()) {
        <div class="h-64 flex flex-col items-center justify-center text-center p-8 bg-surface rounded-2xl border border-border">
          <app-icon name="chef-hat" customClass="w-10 h-10 opacity-30 mb-3"></app-icon>
          <h3 class="text-base font-extrabold text-text-primary">Ticket Not Found</h3>
          <p class="text-xs text-text-muted mt-1">This ticket may have been completed or removed.</p>
          <a routerLink="/kitchen/kds-board" class="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">
            Return to Board
          </a>
        </div>
      } @else {
        <!-- Main 2-Column Stitch Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <!-- Left Column (Items Breakdown) -->
          <div class="lg:col-span-8 space-y-5">
            <div class="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-5">
              <!-- Order Header Meta -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
                <div>
                  <h1 class="text-2xl font-black text-text-primary tracking-tight">
                    Order #{{ getOrderDisplayNumber(order()!) }}
                  </h1>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1.5 font-medium">
                    <span class="flex items-center gap-1">
                      <app-icon name="clock" customClass="w-3.5 h-3.5"></app-icon>
                      <span>{{ order()!.createdAt | relativeTime }}</span>
                    </span>
                    <span>•</span>
                    <span class="flex items-center gap-1 font-bold text-primary">
                      <app-icon name="timer" customClass="w-3.5 h-3.5"></app-icon>
                      <span>{{ kdsService.getElapsedFormatted(order()!) }} elapsed</span>
                    </span>
                    <span>•</span>
                    <span class="flex items-center gap-1">
                      <app-icon name="table-restaurant" customClass="w-3.5 h-3.5"></app-icon>
                      <span>{{ order()!.channel === 'DINE_IN' ? 'Table ' + (order()!.tableNumber || '?') : (order()!.customerName || 'Takeaway') }}</span>
                    </span>
                  </div>
                </div>

                <!-- Status Badge -->
                <div>
                  <span
                    [class]="order()!.status === 'READY'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : order()!.status === 'PREPARING'
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'"
                    class="px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider block text-center"
                  >
                    {{ order()!.status }}
                  </span>
                </div>
              </div>

              <!-- Items Detailed List -->
              <div class="space-y-4">
                <h3 class="text-xs font-black uppercase tracking-wider text-text-secondary">
                  Ticket Items ({{ order()!.items.length }})
                </h3>

                <div class="space-y-3">
                  @for (item of order()!.items; track item.productId || item.name; let idx = $index) {
                    <div
                      (click)="toggleItemChecked(idx)"
                      class="flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none"
                      [ngClass]="isItemChecked(idx)
                        ? 'bg-surface-container/60 border-emerald-500/30 opacity-75'
                        : 'bg-surface-container hover:bg-surface-hover border-border'"
                    >
                      <!-- Quantity Box -->
                      <div class="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center font-black text-base text-primary shrink-0 shadow-xs">
                        {{ item.quantity }}x
                      </div>

                      <!-- Item Info & Modifiers -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-extrabold text-text-primary" [class.line-through]="isItemChecked(idx)">
                            {{ item.name }}
                          </h4>
                        </div>

                        <!-- Modifiers / Variants Chips -->
                        @if (item.selectedVariants?.length) {
                          <div class="flex flex-wrap gap-1.5 mt-2">
                            @for (v of item.selectedVariants; track v.variantName || v.variantId) {
                              <span class="px-2 py-0.5 rounded-lg bg-surface border border-border text-[11px] font-semibold text-text-secondary">
                                {{ v.variantName || v.selectedOptionNames?.join(', ') }}
                              </span>
                            }
                          </div>
                        }

                        <!-- Special Notes & Allergies -->
                        @if (item.notes) {
                          <div class="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-black">
                            <span>⚠️ SPECIAL: {{ item.notes }}</span>
                          </div>
                        }
                      </div>

                      <!-- Interactive Checkmark Button -->
                      <button
                        type="button"
                        class="w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform active:scale-90"
                        [ngClass]="isItemChecked(idx)
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'border-border bg-surface text-transparent hover:border-primary'"
                      >
                        <app-icon name="check" customClass="w-5 h-5"></app-icon>
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (Instructions, Progress & Massive Bump Action) -->
          <div class="lg:col-span-4 space-y-5">
            <!-- Special Instructions Card -->
            <div class="bg-surface rounded-2xl border border-border p-5 shadow-card space-y-3">
              <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-text-primary">
                <app-icon name="clipboard-list" customClass="w-4 h-4 text-primary"></app-icon>
                <span>Kitchen Notes</span>
              </div>
              <div class="p-3.5 bg-surface-container rounded-xl text-xs text-text-secondary leading-relaxed border border-border">
                @if (order()!.customer?.notes || order()!.cashierConfirmation?.notes) {
                  <p class="font-medium italic">
                    "{{ order()!.customer?.notes || order()!.cashierConfirmation?.notes }}"
                  </p>
                } @else {
                  <p class="text-text-muted italic">No special order notes provided.</p>
                }
              </div>
            </div>

            <!-- Preparation Progress & Bump Card -->
            <div class="bg-surface rounded-2xl border border-border p-5 shadow-card space-y-5">
              <div>
                <div class="flex justify-between items-center text-xs font-bold mb-2">
                  <span class="text-text-secondary">Prep Checklist</span>
                  <span class="text-primary font-black">{{ checkedCount() }} / {{ order()!.items.length }} Done</span>
                </div>
                <div class="w-full bg-surface-container h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    class="bg-primary h-full rounded-full transition-all duration-300"
                    [style.width.%]="progressPercentage()"
                  ></div>
                </div>
              </div>

              <!-- Main Touch Bump Button -->
              @if (order()!.status === 'CONFIRMED') {
                <button
                  type="button"
                  (click)="startCooking()"
                  [disabled]="isSubmitting()"
                  class="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  @if (isSubmitting()) {
                    <app-icon name="refresh-cw" customClass="w-5 h-5 animate-spin"></app-icon>
                  } @else {
                    <app-icon name="chef-hat" customClass="w-5 h-5"></app-icon>
                    <span>Start Cooking</span>
                  }
                </button>
              } @else if (order()!.status === 'PREPARING') {
                <button
                  type="button"
                  (click)="bumpToReady()"
                  [disabled]="isSubmitting()"
                  class="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  @if (isSubmitting()) {
                    <app-icon name="refresh-cw" customClass="w-5 h-5 animate-spin"></app-icon>
                  } @else {
                    <app-icon name="done-all" customClass="w-5 h-5"></app-icon>
                    <span>Bump Order (Mark Ready)</span>
                  }
                </button>
              } @else {
                <button
                  type="button"
                  (click)="clearAndBack()"
                  [disabled]="isSubmitting()"
                  class="w-full py-4 rounded-xl bg-surface border border-border hover:border-primary text-text-primary font-black text-sm uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <app-icon name="check-circle" customClass="w-5 h-5 text-emerald-500"></app-icon>
                  <span>Clear Ticket</span>
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export default class KdsDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly kdsService = inject(KdsService);
  readonly ordersService = inject(OrdersService);

  readonly orderId = signal<string>('');
  readonly localOrder = signal<BackendOrder | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  readonly checkedItems = signal<boolean[]>([]);

  readonly order = computed<BackendOrder | null>(() => {
    const id = this.orderId();
    if (!id) return null;
    const foundInStore = this.ordersService.orders().find((o) => o._id === id || o.id === id);
    return foundInStore || this.localOrder();
  });

  readonly isUrgent = computed(() => {
    const ord = this.order();
    if (!ord) return false;
    return this.kdsService.getElapsedMinutes(ord) >= 20;
  });

  readonly checkedCount = computed(() => {
    return this.checkedItems().filter(Boolean).length;
  });

  readonly progressPercentage = computed(() => {
    const ord = this.order();
    if (!ord || ord.items.length === 0) return 0;
    return Math.round((this.checkedCount() / ord.items.length) * 100);
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.orderId.set(id);
        this.loadOrder(id);
      }
    });
  }

  async loadOrder(id: string): Promise<void> {
    const exists = this.ordersService.orders().find((o) => o._id === id || o.id === id);
    if (!exists) {
      this.isLoading.set(true);
      try {
        const res = await this.http
          .get<{ success: boolean; data: BackendOrder }>(API_ENDPOINTS.orders.detail(id))
          .toPromise();
        if (res?.success && res.data) {
          this.localOrder.set(res.data);
        }
      } catch (err) {
        console.error('KdsDetail: fetch order failed', err);
      } finally {
        this.isLoading.set(false);
      }
    }
  }

  getOrderDisplayNumber(order: BackendOrder): string {
    if (order.orderNumber) {
      return String(order.orderNumber).replace(/^#/, '');
    }
    const id = order._id || order.id || '';
    return id ? id.slice(-4).toUpperCase() : '----';
  }

  isItemChecked(index: number): boolean {
    return Boolean(this.checkedItems()[index]);
  }

  toggleItemChecked(index: number): void {
    this.checkedItems.update((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  }

  async startCooking(): Promise<void> {
    const ord = this.order();
    if (!ord) return;
    this.isSubmitting.set(true);
    try {
      await this.kdsService.startPreparing(ord._id || ord.id!);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async bumpToReady(): Promise<void> {
    const ord = this.order();
    if (!ord) return;
    this.isSubmitting.set(true);
    try {
      const ok = await this.kdsService.markReady(ord._id || ord.id!);
      if (ok) {
        this.router.navigate(['/kitchen/kds-board']);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async clearAndBack(): Promise<void> {
    const ord = this.order();
    if (!ord) return;
    this.isSubmitting.set(true);
    try {
      await this.kdsService.clearTicket(ord._id || ord.id!);
      this.router.navigate(['/kitchen/kds-board']);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

