import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { EgpCurrencyPipe } from '../../../shared/pipes/egyptian-currency.pipe';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { OrdersService } from '../orders.service';
import { BackendOrder, BackendOrderChannel, BackendOrderStatus } from '../../../shared/models/order.model';

@Component({
  selector: 'app-live-board',
  standalone: true,
  imports: [CommonModule, RouterModule, EgpCurrencyPipe, RelativeTimePipe, AppIconComponent],
  template: `
    <div class="space-y-5 select-none">
      
      <!-- 🔔 New Incoming Order Live Toast Alert -->
      @if (ordersService.hasNewOrderAlert() && ordersService.latestNewOrder(); as newOrder) {
        <div class="p-4 rounded-2xl bg-primary text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in border border-white/20">
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <app-icon name="bell" customClass="w-5 h-5 animate-bounce"></app-icon>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-lg">New Incoming Order</span>
                <span class="text-xs font-black font-mono">#{{ getOrderDisplayNumber(newOrder) }}</span>
                @if (newOrder.tableNumber) {
                  <span class="text-[11px] font-black bg-amber-400 text-neutral-900 px-2 py-0.5 rounded-lg">Table {{ newOrder.tableNumber }}</span>
                }
              </div>
              <p class="text-xs font-medium text-white/90 mt-0.5">
                {{ newOrder.customerName || 'Guest' }} • {{ newOrder.items.length }} items • {{ newOrder.totalAmount || newOrder.subtotal || 0 | egpCurrency }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              (click)="openDetailModal(newOrder); ordersService.dismissNewOrderAlert()"
              class="px-4 py-2 bg-white text-primary rounded-xl text-xs font-black shadow-xs hover:bg-white/90 transition cursor-pointer"
            >
              View Order
            </button>
            <button
              type="button"
              (click)="ordersService.dismissNewOrderAlert()"
              class="p-2 text-white/80 hover:text-white rounded-xl transition cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      }

      <!-- Top Bar: Header & Controls -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">Live Orders Board</h1>
            
            <!-- Auto-Sync Indicator -->
            <div class="flex items-center gap-2 bg-surface-container border border-border px-3 py-1 rounded-full shadow-xs">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span class="text-[11px] font-bold text-text-primary">Auto-sync 15s</span>
            </div>
          </div>
          <p class="text-xs text-text-muted mt-1">Real-time Kanban pipeline for incoming cashier & kitchen orders</p>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Channel Filter Tabs -->
          <div class="flex items-center p-1 bg-surface-container border border-border rounded-xl text-xs font-bold">
            <button
              type="button"
              (click)="channelFilter.set('ALL')"
              [ngClass]="channelFilter() === 'ALL' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              All Channels
            </button>
            <button
              type="button"
              (click)="channelFilter.set('DINE_IN')"
              [ngClass]="channelFilter() === 'DINE_IN' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Dine-In
            </button>
            <button
              type="button"
              (click)="channelFilter.set('TAKEAWAY')"
              [ngClass]="channelFilter() === 'TAKEAWAY' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Takeaway
            </button>
            <button
              type="button"
              (click)="channelFilter.set('DELIVERY')"
              [ngClass]="channelFilter() === 'DELIVERY' ? 'bg-surface text-text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Delivery
            </button>
          </div>

          <!-- Manual Refresh Button -->
          <button
            type="button"
            (click)="ordersService.fetchOrders(true)"
            [disabled]="ordersService.isLoading() || ordersService.isRefreshing()"
            class="px-3 py-2 rounded-xl bg-surface-container border border-border text-xs font-bold text-text-primary hover:bg-surface-hover transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            title="Force refresh orders"
          >
            <app-icon
              name="refresh-cw"
              [customClass]="ordersService.isLoading() || ordersService.isRefreshing() ? 'w-3.5 h-3.5 animate-spin text-primary' : 'w-3.5 h-3.5'"
            ></app-icon>
            <span>Sync</span>
          </button>

          <!-- New Order CTA -->
          <a
            routerLink="/pos"
            class="px-4 py-2 rounded-xl bg-primary text-white text-xs font-extrabold shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>+ New Order (POS)</span>
          </a>
        </div>
      </div>

      <!-- Offline Sync Banner if applicable -->
      @if (ordersService.offlineQueue().length > 0) {
        <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400">
          <div class="flex items-center gap-2 font-bold">
            <app-icon name="wifi-off" customClass="w-4 h-4 text-amber-500"></app-icon>
            <span>You have {{ ordersService.offlineQueue().length }} order(s) stored locally in offline queue.</span>
          </div>
          <button
            type="button"
            (click)="ordersService.syncOfflineQueue()"
            [disabled]="ordersService.isSyncingOffline()"
            class="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold hover:bg-amber-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <app-icon name="refresh-cw" [customClass]="ordersService.isSyncingOffline() ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'"></app-icon>
            <span>Sync to Backend Now</span>
          </button>
        </div>
      }

      <!-- 4 Kanban Columns: Pending -> Preparing -> Ready -> Completed -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        
        <!-- COLUMN 1: PENDING -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden min-h-[600px]">
          <!-- Column Header -->
          <div class="p-3.5 bg-blue-500/10 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h2 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Received / Pending</h2>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black">
              {{ filteredPendingOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (ordersService.isLoading() && filteredPendingOrders().length === 0) {
              @for (n of [1, 2]; track n) {
                <div class="rounded-xl border border-border bg-surface-container p-4 animate-pulse space-y-3 h-36"></div>
              }
            } @else if (filteredPendingOrders().length === 0) {
              <div class="h-44 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="check-circle" customClass="w-6 h-6 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">No pending orders</p>
                <p class="text-[11px] text-text-muted">New POS orders will appear here</p>
              </div>
            } @else {
              @for (order of filteredPendingOrders(); track order._id || order.id) {
                <div
                  class="bg-surface-container hover:bg-surface-hover border border-border hover:border-blue-500/50 rounded-xl p-3.5 shadow-sm transition-all relative group flex flex-col justify-between cursor-pointer"
                  (click)="openDetailModal(order)"
                >
                  <!-- Card Top: Order Number & Relative Time -->
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded-md bg-surface border border-border text-xs font-extrabold text-text-primary">
                      #{{ getOrderDisplayNumber(order) }}
                    </span>
                    <span class="text-[11px] font-bold text-text-muted flex items-center gap-1">
                      <app-icon name="clock" customClass="w-3 h-3"></app-icon>
                      <span>{{ order.createdAt | relativeTime }}</span>
                    </span>
                  </div>

                  <!-- Channel & Table Badge -->
                  <div class="flex items-center gap-2 mb-2.5">
                    <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      @if (order.channel === 'DINE_IN') {
                        <span>T{{ order.tableNumber || '?' }}</span>
                      } @else if (order.channel === 'TAKEAWAY') {
                        <app-icon name="shopping-bag" customClass="w-3.5 h-3.5"></app-icon>
                      } @else {
                        <app-icon name="store" customClass="w-3.5 h-3.5"></app-icon>
                      }
                    </div>
                    <div>
                      <h4 class="text-xs font-extrabold text-text-primary">
                        {{ order.channel === 'DINE_IN' ? 'Table ' + (order.tableNumber || '?') : order.channel }}
                      </h4>
                      <p class="text-[11px] text-text-muted line-clamp-1">
                        {{ order.customerName || 'Walk-in Guest' }}
                      </p>
                    </div>
                  </div>

                  <!-- Order Items summary -->
                  <div class="space-y-1 py-2 border-t border-border/60 text-xs text-text-secondary mb-3">
                    @for (item of order.items.slice(0, 3); track item.productId || item.name) {
                      <div class="flex justify-between items-center text-[11px]">
                        <span class="line-clamp-1 font-medium">{{ item.quantity }}x {{ item.name }}</span>
                        <span class="font-bold text-text-primary shrink-0">{{ item.totalPrice | egpCurrency }}</span>
                      </div>
                    }
                    @if (order.items.length > 3) {
                      <p class="text-[10px] text-text-muted font-bold pt-0.5">+{{ order.items.length - 3 }} more items</p>
                    }
                  </div>

                  <!-- Card Bottom: Total & Action -->
                  <div class="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <span class="text-[10px] text-text-muted uppercase font-bold block">Total</span>
                      <span class="text-xs font-black text-text-primary">{{ order.totalAmount | egpCurrency }}</span>
                    </div>

                    <button
                      type="button"
                      (click)="confirmCashier(order, $event)"
                      [disabled]="processingOrderId() === (order._id || order.id)"
                      class="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                      title="Confirm order and send to Kitchen KDS"
                    >
                      @if (processingOrderId() === (order._id || order.id)) {
                        <app-icon name="refresh-cw" customClass="w-3 h-3 animate-spin"></app-icon>
                      } @else {
                        <app-icon name="send" customClass="w-3 h-3"></app-icon>
                        <span>To Kitchen</span>
                      }
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- COLUMN 2: PREPARING (In Kitchen) -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden min-h-[600px]">
          <!-- Column Header -->
          <div class="p-3.5 bg-primary/10 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <h2 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Preparing (Kitchen)</h2>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-black">
              {{ filteredPreparingOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (filteredPreparingOrders().length === 0) {
              <div class="h-44 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="chef-hat" customClass="w-6 h-6 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">Kitchen is clear</p>
                <p class="text-[11px] text-text-muted">Orders confirmed by cashier cook here</p>
              </div>
            } @else {
              @for (order of filteredPreparingOrders(); track order._id || order.id) {
                <div
                  class="bg-surface-container hover:bg-surface-hover border border-border hover:border-primary/50 rounded-xl p-3.5 shadow-sm transition-all flex flex-col justify-between cursor-pointer"
                  (click)="openDetailModal(order)"
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded-md bg-surface border border-border text-xs font-extrabold text-text-primary">
                      #{{ getOrderDisplayNumber(order) }}
                    </span>
                    <span class="text-[11px] font-bold text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      <app-icon name="clock" customClass="w-3 h-3"></app-icon>
                      <span>Cooking</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-2 mb-2.5">
                    <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      @if (order.channel === 'DINE_IN') {
                        <span>T{{ order.tableNumber || '?' }}</span>
                      } @else {
                        <app-icon name="shopping-bag" customClass="w-3.5 h-3.5"></app-icon>
                      }
                    </div>
                    <div>
                      <h4 class="text-xs font-extrabold text-text-primary">
                        {{ order.channel === 'DINE_IN' ? 'Table ' + (order.tableNumber || '?') : order.channel }}
                      </h4>
                      <p class="text-[11px] text-text-muted">{{ order.customerName || 'Walk-in' }}</p>
                    </div>
                  </div>

                  <!-- Items -->
                  <div class="space-y-1 py-2 border-t border-border/60 text-xs text-text-secondary mb-3">
                    @for (item of order.items.slice(0, 3); track item.productId || item.name) {
                      <div class="flex justify-between items-center text-[11px]">
                        <span class="line-clamp-1 font-medium">{{ item.quantity }}x {{ item.name }}</span>
                        <span class="font-bold text-text-primary shrink-0">{{ item.totalPrice | egpCurrency }}</span>
                      </div>
                    }
                  </div>

                  <!-- Card Bottom: Mark Ready shortcut -->
                  <div class="flex items-center justify-between pt-2 border-t border-border">
                    <span class="text-xs font-black text-text-primary">{{ order.totalAmount | egpCurrency }}</span>
                    <button
                      type="button"
                      (click)="markReady(order, $event)"
                      [disabled]="processingOrderId() === (order._id || order.id)"
                      class="px-2.5 py-1.5 rounded-lg bg-surface border border-border hover:border-primary text-xs font-bold text-text-primary transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mark Ready</span>
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- COLUMN 3: READY (For Pickup / Serving) -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden min-h-[600px]">
          <!-- Column Header -->
          <div class="p-3.5 bg-emerald-500/10 border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Ready to Serve / Pay</h2>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              {{ filteredReadyOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (filteredReadyOrders().length === 0) {
              <div class="h-44 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="payments" customClass="w-6 h-6 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">No orders ready</p>
                <p class="text-[11px] text-text-muted">Cooked orders ready for cashier collection show here</p>
              </div>
            } @else {
              @for (order of filteredReadyOrders(); track order._id || order.id) {
                <div
                  class="bg-surface-container hover:bg-surface-hover border border-border hover:border-emerald-500/50 rounded-xl p-3.5 shadow-sm transition-all flex flex-col justify-between cursor-pointer"
                  (click)="openDetailModal(order)"
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded-md bg-surface border border-border text-xs font-extrabold text-text-primary">
                      #{{ getOrderDisplayNumber(order) }}
                    </span>
                    <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <app-icon name="check" customClass="w-3 h-3"></app-icon>
                      <span>Ready</span>
                    </span>
                  </div>

                  <div class="flex items-center gap-2 mb-2.5">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                      @if (order.channel === 'DINE_IN') {
                        <span>T{{ order.tableNumber || '?' }}</span>
                      } @else {
                        <app-icon name="shopping-bag" customClass="w-3.5 h-3.5"></app-icon>
                      }
                    </div>
                    <div>
                      <h4 class="text-xs font-extrabold text-text-primary">
                        {{ order.channel === 'DINE_IN' ? 'Table ' + (order.tableNumber || '?') : order.channel }}
                      </h4>
                      <p class="text-[11px] text-text-muted">{{ order.customerName || 'Walk-in' }}</p>
                    </div>
                  </div>

                  <div class="space-y-1 py-2 border-t border-border/60 text-xs text-text-secondary mb-3">
                    @for (item of order.items.slice(0, 3); track item.productId || item.name) {
                      <div class="flex justify-between items-center text-[11px]">
                        <span class="line-clamp-1 font-medium">{{ item.quantity }}x {{ item.name }}</span>
                        <span class="font-bold text-text-primary shrink-0">{{ item.totalPrice | egpCurrency }}</span>
                      </div>
                    }
                  </div>

                  <!-- Card Bottom: Mark Paid & Complete Action -->
                  <div class="flex items-center justify-between pt-2 border-t border-border">
                    <span class="text-xs font-black text-text-primary">{{ order.totalAmount | egpCurrency }}</span>
                    
                    <button
                      type="button"
                      (click)="completeOrder(order, $event)"
                      [disabled]="processingOrderId() === (order._id || order.id)"
                      class="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-extrabold hover:bg-emerald-600 transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                      title="Collect cash and complete order"
                    >
                      @if (processingOrderId() === (order._id || order.id)) {
                        <app-icon name="refresh-cw" customClass="w-3 h-3 animate-spin"></app-icon>
                      } @else {
                        <app-icon name="payments" customClass="w-3.5 h-3.5"></app-icon>
                        <span>Mark Paid</span>
                      }
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- COLUMN 4: COMPLETED / SERVED -->
        <div class="flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden min-h-[600px] opacity-80 hover:opacity-100 transition">
          <!-- Column Header -->
          <div class="p-3.5 bg-surface-container-high border-b border-border flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-text-muted"></span>
              <h2 class="text-xs font-extrabold text-text-muted uppercase tracking-wider">Completed / Paid</h2>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-surface text-text-muted text-xs font-black border border-border">
              {{ filteredCompletedOrders().length }}
            </span>
          </div>

          <!-- Cards List -->
          <div class="p-3 flex-1 overflow-y-auto space-y-3">
            @if (filteredCompletedOrders().length === 0) {
              <div class="h-44 flex flex-col items-center justify-center text-center p-4 text-text-muted">
                <app-icon name="receipt" customClass="w-6 h-6 opacity-30 mb-2"></app-icon>
                <p class="text-xs font-bold">No completed orders yet</p>
              </div>
            } @else {
              @for (order of filteredCompletedOrders().slice(0, 15); track order._id || order.id) {
                <div
                  class="bg-surface-container border border-border rounded-xl p-3 shadow-xs flex flex-col justify-between cursor-pointer hover:bg-surface-hover transition"
                  (click)="openDetailModal(order)"
                >
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="font-bold text-text-primary">#{{ getOrderDisplayNumber(order) }}</span>
                    <span class="text-[11px] text-text-muted">{{ order.createdAt | relativeTime }}</span>
                  </div>
                  <div class="text-xs text-text-secondary mb-1">
                    {{ order.channel }} • {{ order.items.length }} items
                  </div>
                  <div class="flex justify-between items-center text-xs pt-1.5 border-t border-border/50 font-bold">
                    <span class="text-emerald-500">Paid (Cash)</span>
                    <span class="text-text-primary">{{ order.totalAmount | egpCurrency }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    @if (selectedOrder()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl border border-border p-6 max-w-lg w-full shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-extrabold text-text-primary">
                Order #{{ getOrderDisplayNumber(selectedOrder()!) }}
              </h3>
              <p class="text-xs text-text-muted mt-0.5">
                Channel: {{ selectedOrder()!.channel }} • {{ selectedOrder()!.createdAt | relativeTime }}
              </p>
            </div>
            <button
              type="button"
              (click)="selectedOrder.set(null)"
              class="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition"
            >
              <app-icon name="x" customClass="w-5 h-5"></app-icon>
            </button>
          </div>

          <!-- Items Table -->
          <div class="max-h-60 overflow-y-auto border border-border rounded-xl p-3 bg-surface-container space-y-2">
            @for (item of selectedOrder()!.items; track item.productId || item.name) {
              <div class="flex justify-between items-center text-xs">
                <div>
                  <div class="font-bold text-text-primary">{{ item.quantity }}x {{ item.name }}</div>
                  @if (item.notes) {
                    <div class="text-[11px] text-text-muted italic">{{ item.notes }}</div>
                  }
                </div>
                <div class="font-extrabold text-text-primary">{{ item.totalPrice | egpCurrency }}</div>
              </div>
            }
          </div>

          <!-- Total & Status -->
          <div class="p-3 bg-surface-container rounded-xl flex justify-between items-center text-sm font-extrabold">
            <span>Total:</span>
            <span class="text-primary text-base">{{ selectedOrder()!.totalAmount | egpCurrency }}</span>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="selectedOrder.set(null)"
              class="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary text-xs font-bold transition"
            >
              Close
            </button>
            @if (selectedOrder()!.status === 'PENDING') {
              <button
                type="button"
                (click)="confirmCashier(selectedOrder()!, $event)"
                class="px-4 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition cursor-pointer"
              >
                Send to Kitchen
              </button>
            } @else if (selectedOrder()!.status === 'CONFIRMED' || selectedOrder()!.status === 'PREPARING') {
              <button
                type="button"
                (click)="markReady(selectedOrder()!, $event)"
                class="px-4 py-2 rounded-xl bg-surface border border-border hover:border-primary text-text-primary text-xs font-bold transition cursor-pointer"
              >
                Mark Ready
              </button>
            } @else if (selectedOrder()!.status === 'READY') {
              <button
                type="button"
                (click)="completeOrder(selectedOrder()!, $event)"
                class="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition cursor-pointer"
              >
                Mark Paid & Complete
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export default class LiveBoardComponent implements OnInit, OnDestroy {
  readonly ordersService = inject(OrdersService);

  readonly channelFilter = signal<'ALL' | BackendOrderChannel>('ALL');
  readonly processingOrderId = signal<string | null>(null);
  readonly selectedOrder = signal<BackendOrder | null>(null);

  readonly filteredPendingOrders = computed(() => {
    const list = this.ordersService.pendingOrders();
    const filter = this.channelFilter();
    return filter === 'ALL' ? list : list.filter((o) => o.channel === filter);
  });

  readonly filteredPreparingOrders = computed(() => {
    const list = this.ordersService.preparingOrders();
    const filter = this.channelFilter();
    return filter === 'ALL' ? list : list.filter((o) => o.channel === filter);
  });

  readonly filteredReadyOrders = computed(() => {
    const list = this.ordersService.readyOrders();
    const filter = this.channelFilter();
    return filter === 'ALL' ? list : list.filter((o) => o.channel === filter);
  });

  readonly filteredCompletedOrders = computed(() => {
    const list = this.ordersService.completedOrders();
    const filter = this.channelFilter();
    return filter === 'ALL' ? list : list.filter((o) => o.channel === filter);
  });

  ngOnInit(): void {
    this.ordersService.requestNotificationPermission();
    this.ordersService.fetchOrders(true);
  }

  ngOnDestroy(): void {
    // Timer is managed in OrdersService
  }

  getOrderDisplayNumber(order: BackendOrder): string {
    if (order.orderNumber) return String(order.orderNumber);
    if (order._id) return order._id.substring(order._id.length - 4).toUpperCase();
    if (order.id) return order.id.substring(order.id.length - 4).toUpperCase();
    return '0000';
  }

  openDetailModal(order: BackendOrder): void {
    this.selectedOrder.set(order);
  }

  async confirmCashier(order: BackendOrder, event: Event): Promise<void> {
    event.stopPropagation();
    const id = order._id || order.id || '';
    if (!id) return;

    this.processingOrderId.set(id);
    await this.ordersService.confirmCashierOrder(id);
    this.processingOrderId.set(null);
    if (this.selectedOrder()) this.selectedOrder.set(null);
  }

  async markReady(order: BackendOrder, event: Event): Promise<void> {
    event.stopPropagation();
    const id = order._id || order.id || '';
    if (!id) return;

    this.processingOrderId.set(id);
    await this.ordersService.updateOrderStatus(id, 'READY');
    this.processingOrderId.set(null);
  }

  async completeOrder(order: BackendOrder, event: Event): Promise<void> {
    event.stopPropagation();
    const id = order._id || order.id || '';
    if (!id) return;

    this.processingOrderId.set(id);
    await this.ordersService.completeOrder(id);
    this.processingOrderId.set(null);
    if (this.selectedOrder()) this.selectedOrder.set(null);
  }
}
