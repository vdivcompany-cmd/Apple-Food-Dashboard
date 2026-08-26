import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { EgpCurrencyPipe } from '../../../shared/pipes/egyptian-currency.pipe';
import { MenuCatalogService } from '../menu-catalog.service';
import { OrdersService } from '../orders.service';
import { MenuItem } from '../../../shared/models/menu.model';
import { BackendOrderChannel, CartItem, CreateOrderPayload } from '../../../shared/models/order.model';
import { RestaurantTable } from '../../../shared/models/table.model';

@Component({
  selector: 'app-pos-order-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, EgpCurrencyPipe, AppIconComponent],
  template: `
    <div class="flex flex-col lg:flex-row gap-5 h-[calc(100vh-7.5rem)] select-none">
      <!-- LEFT: Product Grid & Categories -->
      <div class="flex-1 flex flex-col min-h-0 bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-card overflow-hidden">
        
        <!-- Header Controls: Search & Offline Sync Banner -->
        <div class="flex items-center gap-3 mb-4">
          <div class="relative flex-1">
            <app-icon name="search" customClass="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2"></app-icon>
            <input
              type="text"
              [ngModel]="catalogService.searchQuery()"
              (ngModelChange)="catalogService.searchQuery.set($event)"
              placeholder="Search dishes, drinks, or ingredients..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
            />
            @if (catalogService.searchQuery()) {
              <button
                type="button"
                (click)="catalogService.searchQuery.set('')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <app-icon name="x" customClass="w-3.5 h-3.5"></app-icon>
              </button>
            }
          </div>

          <!-- Offline / Live Status Pill -->
          @if (!ordersService.isOnline()) {
            <div class="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-1.5 shrink-0 animate-pulse">
              <app-icon name="wifi-off" customClass="w-3.5 h-3.5"></app-icon>
              <span>Offline (Queued)</span>
            </div>
          } @else if (ordersService.offlineQueue().length > 0) {
            <button
              type="button"
              (click)="ordersService.syncOfflineQueue()"
              [disabled]="ordersService.isSyncingOffline()"
              class="px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold flex items-center gap-1.5 shrink-0 hover:bg-primary/20 transition cursor-pointer"
            >
              <app-icon name="refresh-cw" [customClass]="ordersService.isSyncingOffline() ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'"></app-icon>
              <span>Sync ({{ ordersService.offlineQueue().length }})</span>
            </button>
          }
        </div>

        <!-- Category Selector (Horizontal Scroll) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-border scrollbar-none">
          <button
            type="button"
            (click)="selectCategory('All')"
            [ngClass]="catalogService.selectedCategory() === 'All' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-text-primary hover:bg-surface-hover border border-border'"
            class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0"
          >
            All Items
          </button>

          @for (cat of catalogService.categories(); track cat.id || cat.name) {
            <button
              type="button"
              (click)="selectCategory(cat.name)"
              [ngClass]="catalogService.selectedCategory() === cat.name ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-text-primary hover:bg-surface-hover border border-border'"
              class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0"
            >
              {{ cat.name }}
            </button>
          }
        </div>

        <!-- Product Grid (Vertical Scroll) -->
        <div class="flex-1 overflow-y-auto pr-1">
          @if (catalogService.isLoading()) {
            <!-- Skeleton Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              @for (n of [1,2,3,4,5,6,7,8]; track n) {
                <div class="rounded-xl border border-border bg-surface-container p-3 animate-pulse flex flex-col justify-between h-44">
                  <div class="w-full h-24 bg-surface-hover rounded-lg"></div>
                  <div class="space-y-2 mt-2">
                    <div class="h-3.5 bg-surface-hover rounded w-3/4"></div>
                    <div class="h-3 bg-surface-hover rounded w-1/2"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (catalogService.filteredProducts().length === 0) {
            <!-- Empty Catalog State -->
            <div class="h-full flex flex-col items-center justify-center p-8 text-center">
              <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-text-muted mb-3 border border-border">
                <app-icon name="utensils" customClass="w-6 h-6"></app-icon>
              </div>
              <h3 class="text-sm font-bold text-text-primary">No items found</h3>
              <p class="text-xs text-text-muted mt-1 max-w-xs">
                @if (catalogService.searchQuery()) {
                  No products matched "{{ catalogService.searchQuery() }}". Try a different search term.
                } @else {
                  No products available in this category.
                }
              </p>
            </div>
          } @else {
            <!-- Products Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start pb-4">
              @for (product of catalogService.filteredProducts(); track product.id || product._id || product.name) {
                <button
                  type="button"
                  (click)="addToCart(product)"
                  class="flex flex-col text-left bg-surface-container hover:bg-surface-hover border border-border hover:border-primary/50 transition-all rounded-xl overflow-hidden shadow-sm active:scale-[0.98] group cursor-pointer"
                >
                  <!-- Image thumbnail with price badge overlay -->
                  <div class="w-full h-24 bg-surface-hover flex items-center justify-center relative overflow-hidden">
                    @if (product.imageUrl) {
                      <img
                        [src]="product.imageUrl"
                        [alt]="product.name"
                        class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    } @else {
                      <span class="text-3xl select-none group-hover:scale-110 transition duration-300">
                        {{ product.emoji || '🍔' }}
                      </span>
                    }

                    <span class="absolute bottom-2 left-2 text-[11px] font-extrabold px-2 py-0.5 bg-primary text-white rounded-md backdrop-blur-sm shadow">
                      {{ product.price | egpCurrency }}
                    </span>
                  </div>

                  <!-- Product details -->
                  <div class="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 class="font-bold text-xs text-text-primary group-hover:text-primary transition line-clamp-1">
                        {{ product.name }}
                      </h4>
                      @if (product.description) {
                        <p class="text-[11px] text-text-muted mt-0.5 line-clamp-2 leading-relaxed">
                          {{ product.description }}
                        </p>
                      }
                    </div>
                  </div>
                </button>
              }
            </div>
          }
        </div>
      </div>

      <!-- RIGHT: Ticket / Cart (Stitch 380px Panel) -->
      <div class="w-full lg:w-[380px] xl:w-[410px] flex flex-col bg-surface rounded-2xl border border-border shadow-card overflow-hidden shrink-0">
        
        <!-- Ticket Header -->
        <div class="p-4 bg-surface-container border-b border-border">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h2 class="text-base font-extrabold text-text-primary tracking-tight">Ticket #{{ ticketNumber() }}</h2>
              <div class="text-[11px] font-semibold text-text-muted mt-0.5 flex items-center gap-2">
                <span class="flex items-center gap-1">
                  <app-icon name="user" customClass="w-3 h-3"></app-icon>
                  <span>Cashier Staff</span>
                </span>
                <span class="w-1 h-1 rounded-full bg-border"></span>
                <span>{{ currentTime() }}</span>
              </div>
            </div>

            @if (cartItems().length > 0) {
              <button
                type="button"
                (click)="clearCart()"
                class="px-2.5 py-1 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition cursor-pointer"
              >
                Clear
              </button>
            }
          </div>

          <!-- Channel Selector Pills (Dine-in / Takeaway / Delivery) -->
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-surface rounded-xl border border-border mb-3">
            <button
              type="button"
              (click)="channel.set('DINE_IN')"
              [ngClass]="channel() === 'DINE_IN' ? 'bg-primary text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary font-medium'"
              class="py-1.5 rounded-lg text-xs transition text-center cursor-pointer"
            >
              Dine-In
            </button>
            <button
              type="button"
              (click)="channel.set('TAKEAWAY')"
              [ngClass]="channel() === 'TAKEAWAY' ? 'bg-primary text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary font-medium'"
              class="py-1.5 rounded-lg text-xs transition text-center cursor-pointer"
            >
              Takeaway
            </button>
            <button
              type="button"
              (click)="channel.set('DELIVERY')"
              [ngClass]="channel() === 'DELIVERY' ? 'bg-primary text-white shadow-sm font-bold' : 'text-text-muted hover:text-text-primary font-medium'"
              class="py-1.5 rounded-lg text-xs transition text-center cursor-pointer"
            >
              Delivery
            </button>
          </div>

          <!-- Channel Specific Inputs -->
          @if (channel() === 'DINE_IN') {
            <!-- Table Selector -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-text-primary shrink-0 flex items-center gap-1.5">
                <app-icon name="table-restaurant" customClass="w-3.5 h-3.5 text-primary"></app-icon>
                <span>Table:</span>
              </span>
              <select
                [ngModel]="selectedTableId()"
                (ngModelChange)="onTableChange($event)"
                class="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-text-primary focus:outline-none focus:border-primary transition"
              >
                <option value="">-- Select Table --</option>
                @for (t of catalogService.tables(); track t._id || t.id || t.tableNumber) {
                  <option [value]="t._id || t.id">
                    Table {{ t.tableNumber }} @if (t.section) { ({{ t.section }}) }
                  </option>
                }
              </select>
            </div>
          } @else if (channel() === 'DELIVERY') {
            <!-- Delivery Details -->
            <div class="space-y-2">
              <input
                type="text"
                [(ngModel)]="customerName"
                placeholder="Customer Name"
                class="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
              />
              <input
                type="text"
                [(ngModel)]="customerPhone"
                placeholder="Phone Number (e.g. +2010...)"
                class="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
              />
              <input
                type="text"
                [(ngModel)]="deliveryAddress"
                placeholder="Delivery Address"
                class="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
              />
            </div>
          } @else {
            <!-- Takeaway Customer Name -->
            <input
              type="text"
              [(ngModel)]="customerName"
              placeholder="Guest Name (Optional)"
              class="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
            />
          }
        </div>

        <!-- Cart Items List (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          @if (cartItems().length === 0) {
            <div class="h-full flex flex-col items-center justify-center p-6 text-center text-text-muted">
              <div class="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-2 border border-border">
                <app-icon name="shopping-bag" customClass="w-5 h-5 opacity-40"></app-icon>
              </div>
              <p class="text-xs font-bold text-text-primary">Cart is empty</p>
              <p class="text-[11px] text-text-muted mt-0.5">Click any menu item on the left to add it.</p>
            </div>
          } @else {
            @for (item of cartItems(); track item.productId; let idx = $index) {
              <div
                class="p-3 rounded-xl border border-border bg-surface-container/60 hover:bg-surface-container transition flex flex-col gap-2"
                [ngClass]="activeCartIndex() === idx ? 'ring-2 ring-primary/40 bg-primary/5' : ''"
                (click)="activeCartIndex.set(idx)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <h5 class="text-xs font-bold text-text-primary">{{ item.name }}</h5>
                    <div class="text-[11px] text-text-muted mt-0.5">
                      {{ item.unitPrice | egpCurrency }} each
                    </div>
                  </div>

                  <div class="text-xs font-extrabold text-text-primary">
                    {{ item.totalPrice | egpCurrency }}
                  </div>
                </div>

                <!-- Quantity Controls & Notes Input -->
                <div class="flex items-center justify-between pt-1 border-t border-border/50">
                  <!-- Quantity stepper -->
                  <div class="flex items-center gap-1.5 bg-surface rounded-lg border border-border p-0.5">
                    <button
                      type="button"
                      (click)="decrementItem(item, $event)"
                      class="w-6 h-6 rounded-md hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary transition cursor-pointer"
                    >
                      <app-icon name="minus" customClass="w-3 h-3"></app-icon>
                    </button>
                    <span class="text-xs font-bold px-1.5 text-text-primary min-w-4 text-center">
                      {{ item.quantity }}
                    </span>
                    <button
                      type="button"
                      (click)="incrementItem(item, $event)"
                      class="w-6 h-6 rounded-md hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-primary transition cursor-pointer"
                    >
                      <app-icon name="plus" customClass="w-3 h-3"></app-icon>
                    </button>
                  </div>

                  <!-- Remove item button -->
                  <button
                    type="button"
                    (click)="removeItem(item.productId, $event)"
                    class="p-1 rounded-md text-text-muted hover:text-red-500 transition cursor-pointer"
                    title="Remove item"
                  >
                    <app-icon name="trash-2" customClass="w-3.5 h-3.5"></app-icon>
                  </button>
                </div>

                <!-- Item Custom Note -->
                <input
                  type="text"
                  [(ngModel)]="item.notes"
                  placeholder="Special instructions (e.g. no onions)..."
                  class="w-full px-2.5 py-1 rounded-lg bg-surface border border-border/60 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
            }
          }
        </div>

        <!-- Ticket Summary & Submit -->
        <div class="p-4 bg-surface-container border-t border-border space-y-3">
          
          <!-- Coupon Code Input -->
          <div class="flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="couponCode"
              placeholder="Coupon Code"
              class="flex-1 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted uppercase tracking-wider focus:outline-none focus:border-primary transition"
            />
            <button
              type="button"
              (click)="applyCoupon()"
              class="px-3 py-1.5 rounded-xl bg-surface border border-border hover:border-primary text-xs font-bold text-text-primary transition cursor-pointer"
            >
              Apply
            </button>
          </div>

          <!-- Total Calculation -->
          <div class="space-y-1.5 pt-2 border-t border-border">
            <div class="flex justify-between text-xs text-text-secondary">
              <span>Subtotal</span>
              <span class="font-semibold">{{ subtotal() | egpCurrency }}</span>
            </div>

            @if (discountAmount() > 0) {
              <div class="flex justify-between text-xs text-emerald-500 font-semibold">
                <span>Discount</span>
                <span>-{{ discountAmount() | egpCurrency }}</span>
              </div>
            }

            <div class="flex justify-between text-sm font-extrabold text-text-primary pt-1 border-t border-border">
              <span>Total Amount</span>
              <span class="text-primary">{{ grandTotal() | egpCurrency }}</span>
            </div>
          </div>

          <!-- Submit Order Button -->
          <button
            type="button"
            (click)="openConfirmModal()"
            [disabled]="isSubmitDisabled() || isSubmitting()"
            class="w-full py-3 rounded-xl bg-primary text-white font-extrabold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @if (isSubmitting()) {
              <app-icon name="refresh-cw" customClass="w-4 h-4 animate-spin"></app-icon>
              <span>Submitting Order...</span>
            } @else {
              <app-icon name="send" customClass="w-4 h-4"></app-icon>
              <span>Send Order to Cashier & Kitchen</span>
            }
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal Overlay -->
    @if (showConfirmModal()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <app-icon name="receipt" customClass="w-5 h-5"></app-icon>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-text-primary">Confirm Order</h3>
                <p class="text-xs text-text-muted">Ticket #{{ ticketNumber() }} • Cash Flow</p>
              </div>
            </div>
            <button
              type="button"
              (click)="showConfirmModal.set(false)"
              class="p-1 rounded-lg text-text-muted hover:text-text-primary"
            >
              <app-icon name="x" customClass="w-4 h-4"></app-icon>
            </button>
          </div>

          <!-- Order Summary Card -->
          <div class="p-3.5 rounded-xl bg-surface-container border border-border space-y-2 text-xs">
            <div class="flex justify-between text-text-secondary">
              <span>Channel:</span>
              <span class="font-bold text-text-primary">{{ channel() }}</span>
            </div>
            @if (channel() === 'DINE_IN') {
              <div class="flex justify-between text-text-secondary">
                <span>Table:</span>
                <span class="font-bold text-text-primary">Table {{ selectedTableNumber() }}</span>
              </div>
            } @else {
              <div class="flex justify-between text-text-secondary">
                <span>Customer:</span>
                <span class="font-bold text-text-primary">{{ customerName || 'Walk-in' }}</span>
              </div>
            }
            <div class="flex justify-between text-text-secondary">
              <span>Items:</span>
              <span class="font-bold text-text-primary">{{ cartItems().length }} items ({{ totalItemQuantity() }} units)</span>
            </div>
            <div class="flex justify-between text-text-secondary pt-2 border-t border-border font-bold">
              <span>Grand Total:</span>
              <span class="text-primary text-sm">{{ grandTotal() | egpCurrency }}</span>
            </div>
          </div>

          <!-- Notification note -->
          <p class="text-[11px] text-text-muted leading-relaxed">
            💡 This order will be queued as <strong>Cash payment</strong> and sent directly to the Cashier & Kitchen live boards for preparation.
          </p>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              (click)="showConfirmModal.set(false)"
              class="py-2.5 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="submitOrder()"
              [disabled]="isSubmitting()"
              class="py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              @if (isSubmitting()) {
                <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                <span>Sending...</span>
              } @else {
                <span>Confirm & Send</span>
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Toast Notification -->
    @if (toastMessage()) {
      <div class="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-surface border border-primary/40 shadow-2xl flex items-center gap-3 animate-fade-in">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
          <app-icon name="check-circle" customClass="w-4 h-4"></app-icon>
        </div>
        <div>
          <p class="text-xs font-bold text-text-primary">{{ toastMessage() }}</p>
          <p class="text-[11px] text-text-muted">Order is now active on the Live Orders board</p>
        </div>
      </div>
    }
  `,
})
export default class PosComponent implements OnInit {
  readonly catalogService = inject(MenuCatalogService);
  readonly ordersService = inject(OrdersService);

  readonly ticketNumber = signal<number>(Math.floor(1000 + Math.random() * 9000));
  readonly currentTime = signal<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  readonly channel = signal<BackendOrderChannel>('DINE_IN');
  readonly selectedTableId = signal<string>('');
  readonly selectedTableNumber = signal<string | number>('');

  customerName = '';
  customerPhone = '';
  deliveryAddress = '';
  couponCode = '';

  readonly cartItems = signal<CartItem[]>([]);
  readonly activeCartIndex = signal<number>(-1);
  readonly discountAmount = signal<number>(0);
  readonly isSubmitting = signal<boolean>(false);
  readonly showConfirmModal = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  readonly subtotal = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.totalPrice, 0)
  );

  readonly grandTotal = computed(() =>
    Math.max(0, this.subtotal() - this.discountAmount())
  );

  readonly totalItemQuantity = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  readonly isSubmitDisabled = computed(() => {
    if (this.cartItems().length === 0) return true;
    if (this.channel() === 'DINE_IN' && !this.selectedTableId()) return true;
    if (this.channel() === 'DELIVERY' && !this.deliveryAddress.trim()) return true;
    return false;
  });

  ngOnInit(): void {
    this.catalogService.fetchCatalog();
    this.catalogService.fetchTables();

    // Refresh time string every minute
    setInterval(() => {
      this.currentTime.set(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
  }

  selectCategory(catName: string): void {
    this.catalogService.selectedCategory.set(catName);
  }

  onTableChange(tableId: string): void {
    this.selectedTableId.set(tableId);
    const tbl = this.catalogService.tables().find((t) => (t._id || t.id) === tableId);
    this.selectedTableNumber.set(tbl ? tbl.tableNumber : '');
  }

  addToCart(product: MenuItem): void {
    const pId = product.id || product._id || product.name;
    const existing = this.cartItems().find((i) => i.productId === pId);

    if (existing) {
      this.cartItems.update((items) =>
        items.map((i) =>
          i.productId === pId
            ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
            : i
        )
      );
    } else {
      const newItem: CartItem = {
        productId: pId,
        name: product.name,
        categoryName: product.categoryName || product.category,
        unitPrice: product.price,
        quantity: 1,
        totalPrice: product.price,
        imageUrl: product.imageUrl,
        emoji: product.emoji,
      };
      this.cartItems.update((items) => [...items, newItem]);
    }
  }

  incrementItem(item: CartItem, event: Event): void {
    event.stopPropagation();
    this.cartItems.update((items) =>
      items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
          : i
      )
    );
  }

  decrementItem(item: CartItem, event: Event): void {
    event.stopPropagation();
    if (item.quantity <= 1) {
      this.removeItem(item.productId, event);
      return;
    }
    this.cartItems.update((items) =>
      items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.unitPrice }
          : i
      )
    );
  }

  removeItem(productId: string, event: Event): void {
    event.stopPropagation();
    this.cartItems.update((items) => items.filter((i) => i.productId !== productId));
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.discountAmount.set(0);
    this.couponCode = '';
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) return;
    // Example discount: 10% on valid coupon
    const discount = Math.round(this.subtotal() * 0.1);
    this.discountAmount.set(discount);
    this.showToast(`Coupon applied! ${discount} EGP discount`);
  }

  openConfirmModal(): void {
    if (this.isSubmitDisabled()) return;
    this.showConfirmModal.set(true);
  }

  async submitOrder(): Promise<void> {
    this.isSubmitting.set(true);

    const payload: CreateOrderPayload = {
      channel: this.channel(),
      tableId: this.channel() === 'DINE_IN' ? this.selectedTableId() : undefined,
      tableNumber: this.channel() === 'DINE_IN' ? this.selectedTableNumber() : undefined,
      customerName: this.customerName.trim() || 'Walk-in',
      customerPhone: this.customerPhone.trim() || undefined,
      deliveryAddress: this.channel() === 'DELIVERY' ? this.deliveryAddress.trim() : undefined,
      couponCode: this.couponCode.trim() || undefined,
      discountAmount: this.discountAmount(),
      items: this.cartItems().map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes,
      })),
      subtotal: this.subtotal(),
      taxAmount: 0,
      totalAmount: this.grandTotal(),
    };

    const res = await this.ordersService.createOrder(payload);
    this.isSubmitting.set(false);
    this.showConfirmModal.set(false);

    if (res.success) {
      this.showToast(
        res.offline
          ? `Order #${this.ticketNumber()} saved offline! Will sync when connected.`
          : `Order #${this.ticketNumber()} submitted to Kitchen!`
      );
      this.clearCart();
      this.ticketNumber.set(Math.floor(1000 + Math.random() * 9000));
    } else {
      alert(res.error || 'Failed to create order');
    }
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }
}
