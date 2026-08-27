import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsService } from './notifications.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationLog, DispatchNotificationDto, NotificationChannel } from '../../shared/models/notification.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, RelativeTimePipe],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── HEADER ─────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Activity & Notification Log
            </h1>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Live Stream
            </span>
          </div>
          <p class="text-xs text-text-muted mt-0.5">
            Real-time audit trail of incoming customer orders, staff alerts, SMS broadcasts, and Telegram bot dispatches
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="refreshAll()"
            [disabled]="notificationsService.isLoading()"
            class="p-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-hover text-text-muted hover:text-text-primary transition cursor-pointer"
            title="Refresh logs & orders"
          >
            <app-icon name="refresh-cw" [customClass]="notificationsService.isLoading() ? 'w-4 h-4 animate-spin' : 'w-4 h-4'"></app-icon>
          </button>

          <button
            type="button"
            (click)="ordersService.playNewOrderChime()"
            class="p-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-hover text-text-muted hover:text-text-primary transition cursor-pointer"
            title="Test audio chime alert"
          >
            <app-icon name="bell" customClass="w-4 h-4 text-primary"></app-icon>
          </button>

          <button
            type="button"
            (click)="showDispatchModal.set(true)"
            class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            <app-icon name="send" customClass="w-4 h-4"></app-icon>
            <span>Dispatch Alert</span>
          </button>
        </div>
      </div>

      <!-- ── STATS ROW ──────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <app-icon name="send" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Total Log Entries</span>
            <h3 class="text-lg font-black text-text-primary">{{ combinedLogs().length }}</h3>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <app-icon name="utensils" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Live Orders Stream</span>
            <h3 class="text-lg font-black text-text-primary">{{ ordersService.orders().length }} orders</h3>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <app-icon name="check-circle" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Delivered Alerts</span>
            <h3 class="text-lg font-black text-text-primary">{{ deliveredCount() }}</h3>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <app-icon name="message-square" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Active Channels</span>
            <h3 class="text-lg font-black text-text-primary">Order • Telegram • SMS</h3>
          </div>
        </div>
      </div>

      <!-- ── LOG TABLE ──────────────────────────────────────── -->
      <div class="bg-surface rounded-2xl border border-border shadow-card overflow-hidden space-y-4 p-5">
        
        <!-- Filters -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
          <div class="flex items-center gap-2 flex-wrap text-xs font-bold">
            <button
              type="button"
              (click)="selectedChannelFilter.set('ALL')"
              [ngClass]="selectedChannelFilter() === 'ALL' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              All Events ({{ combinedLogs().length }})
            </button>
            <button
              type="button"
              (click)="selectedChannelFilter.set('ORDER')"
              [ngClass]="selectedChannelFilter() === 'ORDER' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Orders ({{ orderEventsCount() }})
            </button>
            <button
              type="button"
              (click)="selectedChannelFilter.set('TELEGRAM')"
              [ngClass]="selectedChannelFilter() === 'TELEGRAM' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Telegram
            </button>
            <button
              type="button"
              (click)="selectedChannelFilter.set('EMAIL')"
              [ngClass]="selectedChannelFilter() === 'EMAIL' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Email
            </button>
            <button
              type="button"
              (click)="selectedChannelFilter.set('SMS')"
              [ngClass]="selectedChannelFilter() === 'SMS' ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              SMS
            </button>
          </div>

          <div class="text-xs text-text-muted font-bold">
            Showing {{ filteredLogs().length }} entries
          </div>
        </div>

        @if (notificationsService.isLoading() && combinedLogs().length === 0) {
          <div class="p-16 flex flex-col items-center justify-center gap-2">
            <app-icon name="refresh-cw" customClass="w-6 h-6 text-primary animate-spin"></app-icon>
            <span class="text-xs font-bold text-text-muted">Loading activity log stream...</span>
          </div>
        } @else if (filteredLogs().length === 0) {
          <div class="p-12 text-center bg-surface-container/30 rounded-2xl border border-dashed border-border space-y-2">
            <app-icon name="bell" customClass="w-8 h-8 text-text-muted mx-auto"></app-icon>
            <h4 class="text-xs font-extrabold text-text-primary">No Activity Logs Found</h4>
            <p class="text-[11px] text-text-muted">Incoming customer orders and dispatched notifications will stream here automatically.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                  <th class="py-3 px-4 font-bold">Channel</th>
                  <th class="py-3 px-4 font-bold">Source / Recipient</th>
                  <th class="py-3 px-4 font-bold">Event Summary & Payload</th>
                  <th class="py-3 px-4 font-bold">Status</th>
                  <th class="py-3 px-4 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border font-medium">
                @for (n of filteredLogs(); track n._id || n.id) {
                  <tr class="hover:bg-surface-hover/50 transition">
                    
                    <!-- Channel -->
                    <td class="py-3 px-4">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border"
                        [ngClass]="getChannelBadgeClass(n.channel)"
                      >
                        <app-icon [name]="getChannelIcon(n.channel)" customClass="w-3.5 h-3.5"></app-icon>
                        <span>{{ n.channel }}</span>
                      </span>
                    </td>

                    <!-- Recipient / Table -->
                    <td class="py-3 px-4 font-bold text-text-primary whitespace-nowrap">
                      {{ n.recipient }}
                      @if (n.tableNumber) {
                        <span class="ml-1.5 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">
                          Table {{ n.tableNumber }}
                        </span>
                      }
                    </td>

                    <!-- Message Body -->
                    <td class="py-3 px-4 max-w-sm sm:max-w-md">
                      @if (n.messageSubject) {
                        <span class="block font-bold text-text-primary truncate">{{ n.messageSubject }}</span>
                      }
                      <span class="text-text-muted text-[11px] truncate block">{{ n.messageBody }}</span>
                    </td>

                    <!-- Status -->
                    <td class="py-3 px-4 whitespace-nowrap">
                      <span
                        class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border"
                        [ngClass]="getStatusClasses(n.status)"
                      >
                        {{ n.status }}
                      </span>
                    </td>

                    <!-- Timestamp -->
                    <td class="py-3 px-4 text-text-muted text-[11px] whitespace-nowrap">
                      <div>{{ formatDateTime(n.dispatchedAt) }}</div>
                      <div class="text-[10px] text-text-muted/70">{{ n.dispatchedAt | relativeTime }}</div>
                    </td>

                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div>

      <!-- ── DISPATCH NOTIFICATION MODAL ────────────────────── -->
      @if (showDispatchModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showDispatchModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="relative w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-4 animate-scale-up text-xs">
            
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-sm font-extrabold text-text-primary">Dispatch Direct Alert</h3>
                <p class="text-[11px] text-text-muted">Broadcast direct notification to guest or staff</p>
              </div>
              <button
                type="button"
                (click)="showDispatchModal.set(false)"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Target Channel</label>
              <select
                [ngModel]="dispatchChannel()"
                (ngModelChange)="dispatchChannel.set($event)"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition cursor-pointer"
              >
                <option value="TELEGRAM">Telegram Bot Broadcast</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS Message</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Recipient *</label>
              <input
                type="text"
                [ngModel]="dispatchRecipient()"
                (ngModelChange)="dispatchRecipient.set($event)"
                placeholder="e.g. @telegram_user, 01000000000, guest@mail.com"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Subject (Optional)</label>
              <input
                type="text"
                [ngModel]="dispatchSubject()"
                (ngModelChange)="dispatchSubject.set($event)"
                placeholder="e.g. Your Table is Ready!"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Message Body *</label>
              <textarea
                rows="3"
                [ngModel]="dispatchBody()"
                (ngModelChange)="dispatchBody.set($event)"
                placeholder="Write message content..."
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-medium focus:outline-none focus:border-primary transition resize-none"
              ></textarea>
            </div>

            <div class="pt-3 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                (click)="showDispatchModal.set(false)"
                class="px-4 py-2 bg-surface-container hover:bg-surface-hover text-text-primary font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="sendDispatch()"
                [disabled]="notificationsService.isDispatching() || !dispatchRecipient() || !dispatchBody()"
                class="px-5 py-2 bg-primary text-white font-extrabold rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                @if (notificationsService.isDispatching()) {
                  <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                  <span>Sending...</span>
                } @else {
                  <span>Send Notification</span>
                }
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export default class NotificationsComponent implements OnInit {
  readonly notificationsService = inject(NotificationsService);
  readonly ordersService = inject(OrdersService);

  readonly selectedChannelFilter = signal<string>('ALL');
  readonly showDispatchModal = signal<boolean>(false);

  // Dispatch Form Signals
  readonly dispatchChannel = signal<NotificationChannel>('TELEGRAM');
  readonly dispatchRecipient = signal<string>('');
  readonly dispatchSubject = signal<string>('');
  readonly dispatchBody = signal<string>('');

  /**
   * Combine backend notification logs with live order stream events
   */
  readonly combinedLogs = computed<NotificationLog[]>(() => {
    const dbLogs = this.notificationsService.notifications();
    
    // Create live log representations from OrdersService
    const orderLogs: NotificationLog[] = this.ordersService.orders().map((o) => {
      const orderNum = o.orderNumber || (o._id ? o._id.slice(-4).toUpperCase() : 'ORD');
      const tableInfo = o.tableNumber ? `Table ${o.tableNumber}` : (o.channel === 'DINE_IN' ? 'Dine-In' : o.channel);
      return {
        _id: 'ord_log_' + (o._id || o.id),
        id: 'ord_log_' + (o._id || o.id),
        tenantId: o.tenantId || '',
        branchId: o.branchId,
        channel: 'ORDER' as NotificationChannel,
        recipient: o.customerName || (o.tableNumber ? `Table ${o.tableNumber}` : 'Guest Customer'),
        messageSubject: `${o.channel} Order #${orderNum} (${tableInfo})`,
        messageBody: `${o.items?.length || 0} item(s) • Total: ${o.totalAmount || o.subtotal || 0} EGP • Status: ${o.status}`,
        status: (o.status === 'CANCELLED' ? 'FAILED' : 'SENT') as any,
        tableNumber: o.tableNumber ? Number(o.tableNumber) : undefined,
        dispatchedAt: o.createdAt || new Date().toISOString(),
        createdAt: o.createdAt || new Date().toISOString(),
      };
    });

    // Merge and sort newest first
    const merged = [...dbLogs, ...orderLogs];
    return merged.sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime());
  });

  readonly orderEventsCount = computed(() => {
    return this.combinedLogs().filter((n) => n.channel === 'ORDER').length;
  });

  readonly deliveredCount = computed(() => {
    return this.combinedLogs().filter((n) => n.status === 'SENT').length;
  });

  readonly filteredLogs = computed(() => {
    const list = this.combinedLogs();
    const filter = this.selectedChannelFilter();
    if (filter === 'ALL') return list;
    return list.filter((n) => n.channel === filter);
  });

  ngOnInit(): void {
    this.refreshAll();
  }

  refreshAll(): void {
    this.notificationsService.fetchNotifications();
    this.ordersService.fetchOrders(false);
  }

  async sendDispatch(): Promise<void> {
    const recipient = this.dispatchRecipient().trim();
    const body = this.dispatchBody().trim();
    if (!recipient || !body) return;

    const dto: DispatchNotificationDto = {
      channel: this.dispatchChannel(),
      recipient,
      messageSubject: this.dispatchSubject().trim() || undefined,
      messageBody: body,
    };

    const res = await this.notificationsService.dispatchNotification(dto);
    if (res.success) {
      this.showDispatchModal.set(false);
      this.dispatchRecipient.set('');
      this.dispatchSubject.set('');
      this.dispatchBody.set('');
    } else if (res.error) {
      alert(res.error);
    }
  }

  getChannelIcon(channel: string): string {
    switch (channel) {
      case 'ORDER':
        return 'utensils';
      case 'TELEGRAM':
        return 'message-square';
      case 'EMAIL':
        return 'mail';
      case 'SMS':
        return 'phone';
      default:
        return 'bell';
    }
  }

  getChannelBadgeClass(channel: string): string {
    switch (channel) {
      case 'ORDER':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'TELEGRAM':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'EMAIL':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'SMS':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-surface-container text-text-primary border-border';
    }
  }

  getStatusClasses(status: string): string {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'FAILED':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    }
  }

  formatDateTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }
}
