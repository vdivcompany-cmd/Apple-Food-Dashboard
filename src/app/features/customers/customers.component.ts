import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';
import { CustomersService } from './customers.service';
import { Customer, CreateCustomerPayload } from '../../shared/models/customer.model';
import { BackendOrder } from '../../shared/models/order.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, EgpCurrencyPipe],
  template: `
    <div class="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Customer CRM & Loyalty</h1>
          <p class="text-xs text-text-muted mt-1">Guest profiles, lifetime spend, purchase history, and dining loyalty rewards</p>
        </div>
        <button
          type="button"
          (click)="showAddModal.set(true)"
          class="px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <app-icon name="user-plus" customClass="w-4 h-4"></app-icon>
          <span>+ Add Guest Profile</span>
        </button>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div>
            <span class="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Registered Guests</span>
            <span class="text-2xl font-black text-text-primary">{{ customersService.customers().length }}</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <app-icon name="users" customClass="w-5 h-5"></app-icon>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div>
            <span class="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Total Lifetime Value</span>
            <span class="text-2xl font-black text-emerald-500">{{ totalLifetimeSpend() | egpCurrency }}</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <app-icon name="payments" customClass="w-5 h-5"></app-icon>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div>
            <span class="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Total Loyalty Points</span>
            <span class="text-2xl font-black text-amber-500">{{ totalLoyaltyPoints() }} pts</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <app-icon name="sparkles" customClass="w-5 h-5"></app-icon>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="flex items-center gap-3 bg-surface p-3 rounded-2xl border border-border shadow-card">
        <div class="relative flex-1">
          <app-icon name="search" customClass="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2"></app-icon>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search guests by name, phone number, email..."
            class="w-full pl-9 pr-4 py-2 bg-surface-container border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary font-medium"
          />
        </div>
      </div>

      <!-- Live Customers Table -->
      @if (customersService.isLoading()) {
        <div class="p-16 flex flex-col items-center justify-center gap-3">
          <app-icon name="refresh-cw" customClass="w-8 h-8 text-primary animate-spin"></app-icon>
          <span class="text-xs font-bold text-text-muted">Loading live customer CRM from server...</span>
        </div>
      } @else if (filteredCustomers().length === 0) {
        <div class="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <app-icon name="users" customClass="w-6 h-6"></app-icon>
          </div>
          <h3 class="text-base font-extrabold text-text-primary">No Guests Found</h3>
          <p class="text-xs text-text-muted max-w-sm mx-auto">
            @if (searchQuery()) {
              No customer records match "{{ searchQuery() }}".
            } @else {
              Customer records are automatically created when orders are placed with customer phone numbers or added manually.
            }
          </p>
          @if (!searchQuery()) {
            <button
              type="button"
              (click)="showAddModal.set(true)"
              class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              + Add First Guest Profile
            </button>
          }
        </div>
      } @else {
        <div class="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-container border-b border-border text-text-muted uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th class="px-5 py-3.5">Guest Profile</th>
                  <th class="px-5 py-3.5">Phone Number</th>
                  <th class="px-5 py-3.5">Total Orders</th>
                  <th class="px-5 py-3.5">Lifetime Spend</th>
                  <th class="px-5 py-3.5">Loyalty Balance</th>
                  <th class="px-5 py-3.5">Joined Date</th>
                  <th class="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (cust of filteredCustomers(); track cust._id || cust.id) {
                  <tr
                    (click)="openCustomerProfile(cust)"
                    class="hover:bg-surface-hover transition group cursor-pointer"
                  >
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                          {{ getInitials(cust.name) }}
                        </div>
                        <div>
                          <span class="font-extrabold text-text-primary text-xs block group-hover:text-primary transition">{{ cust.name }}</span>
                          <span class="text-[10px] text-text-muted">{{ cust.email || 'No email registered' }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-1.5 text-text-secondary font-medium">
                        <app-icon name="phone" customClass="w-3.5 h-3.5 text-text-muted"></app-icon>
                        <span>{{ cust.phone }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 font-bold text-text-primary">
                      {{ cust.totalOrders || 0 }} visits
                    </td>
                    <td class="px-5 py-4 font-extrabold text-text-primary">
                      {{ (cust.totalSpend || 0) | egpCurrency }}
                    </td>
                    <td class="px-5 py-4">
                      <span class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold inline-flex items-center gap-1">
                        ★ {{ cust.loyaltyPoints || 0 }} pts
                      </span>
                    </td>
                    <td class="px-5 py-4 text-text-muted font-medium">
                      {{ formatDate(cust.createdAt) }}
                    </td>
                    <td class="px-5 py-4 text-right" (click)="$event.stopPropagation()">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          (click)="openCustomerProfile(cust)"
                          class="p-1.5 text-text-muted hover:text-primary hover:bg-surface-container rounded-lg transition cursor-pointer"
                          title="View customer profile & orders"
                        >
                          <app-icon name="sparkles" customClass="w-4 h-4"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="confirmDelete(cust)"
                          class="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Delete customer record"
                        >
                          <app-icon name="trash-2" customClass="w-4 h-4"></app-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── CUSTOMER PROFILE & ORDER HISTORY MODAL ────────── -->
      @if (customersService.selectedCustomer()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="customersService.selectedCustomer.set(null)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] flex flex-col animate-[fadeIn_0.2s_ease-out]">
            <!-- Modal Header -->
            <div class="flex items-start justify-between border-b border-border pb-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-black text-sm">
                  {{ getInitials(customersService.selectedCustomer()?.name || '') }}
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-text-primary">
                    {{ customersService.selectedCustomer()?.name }}
                  </h3>
                  <div class="flex items-center gap-2 text-xs text-text-muted">
                    <span>{{ customersService.selectedCustomer()?.phone }}</span>
                    @if (customersService.selectedCustomer()?.email) {
                      <span>• {{ customersService.selectedCustomer()?.email }}</span>
                    }
                  </div>
                </div>
              </div>
              <button
                type="button"
                (click)="customersService.selectedCustomer.set(null)"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                <app-icon name="x" customClass="w-4 h-4"></app-icon>
              </button>
            </div>

            <!-- Profile Badges -->
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="p-2.5 bg-surface-container rounded-xl border border-border">
                <span class="text-[10px] font-bold uppercase text-text-muted block">Total Visits</span>
                <span class="text-sm font-black text-text-primary">{{ customersService.selectedCustomer()?.totalOrders || 0 }}</span>
              </div>
              <div class="p-2.5 bg-surface-container rounded-xl border border-border">
                <span class="text-[10px] font-bold uppercase text-text-muted block">Total Spend</span>
                <span class="text-sm font-black text-emerald-500">{{ (customersService.selectedCustomer()?.totalSpend || 0) | egpCurrency }}</span>
              </div>
              <div class="p-2.5 bg-surface-container rounded-xl border border-border">
                <span class="text-[10px] font-bold uppercase text-text-muted block">Loyalty Points</span>
                <span class="text-sm font-black text-amber-500">★ {{ customersService.selectedCustomer()?.loyaltyPoints || 0 }}</span>
              </div>
            </div>

            <!-- Order History List -->
            <div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              <h4 class="text-xs font-extrabold text-text-primary uppercase tracking-wider">Order History</h4>
              
              @if (customersService.isLoadingOrders()) {
                <div class="py-8 flex flex-col items-center justify-center gap-2 text-text-muted text-xs">
                  <app-icon name="refresh-cw" customClass="w-5 h-5 animate-spin text-primary"></app-icon>
                  <span>Loading order history...</span>
                </div>
              } @else if (customersService.customerOrders().length === 0) {
                <div class="p-6 bg-surface-container rounded-xl text-center text-xs text-text-muted border border-border">
                  No orders recorded for this phone number yet.
                </div>
              } @else {
                @for (ord of customersService.customerOrders(); track ord._id || ord.id) {
                  <div class="p-3 bg-surface-container rounded-xl border border-border flex items-center justify-between text-xs">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-text-primary">#{{ getOrderNumber(ord) }}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-surface border border-border text-text-muted">
                          {{ ord.channel || 'DINE_IN' }}
                        </span>
                      </div>
                      <span class="text-[10px] text-text-muted block mt-0.5">
                        {{ ord.items.length || 0 }} items • {{ formatDate(ord.createdAt) }}
                      </span>
                    </div>
                    <div class="text-right">
                      <span class="font-extrabold text-text-primary block">{{ (ord.totalAmount || ord.total || 0) | egpCurrency }}</span>
                      <span class="text-[10px] font-bold uppercase text-emerald-500">{{ ord.status }}</span>
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Modal Footer -->
            <div class="pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                (click)="customersService.selectedCustomer.set(null)"
                class="px-4 py-2 bg-surface-container hover:bg-surface-hover text-text-primary text-xs font-bold rounded-xl border border-border transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ── ADD CUSTOMER PROFILE MODAL ────────────────────── -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showAddModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-sm w-full space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-base font-extrabold text-text-primary">Add Guest Profile</h3>
                <p class="text-xs text-text-muted">Create a customer CRM & loyalty account</p>
              </div>
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                <app-icon name="x" customClass="w-4 h-4"></app-icon>
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block font-bold text-text-primary text-xs mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  [(ngModel)]="newName"
                  placeholder="e.g. Mohamed Salah"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary text-xs mb-1">Phone Number *</label>
                <input
                  type="text"
                  [(ngModel)]="newPhone"
                  placeholder="01012345678"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary text-xs mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  [(ngModel)]="newEmail"
                  placeholder="guest@example.com"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-3 border-t border-border">
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveCustomer()"
                [disabled]="!newName || !newPhone || customersService.isSaving()"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {{ customersService.isSaving() ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export default class CustomersComponent implements OnInit {
  readonly customersService = inject(CustomersService);

  readonly searchQuery = signal<string>('');
  readonly showAddModal = signal<boolean>(false);

  newName = '';
  newPhone = '';
  newEmail = '';

  readonly filteredCustomers = computed(() => {
    let list = this.customersService.customers();
    const q = this.searchQuery().toLowerCase().trim();

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email || '').toLowerCase().includes(q)
      );
    }

    return list;
  });

  readonly totalLifetimeSpend = computed(() => {
    return this.customersService.customers().reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  });

  readonly totalLoyaltyPoints = computed(() => {
    return this.customersService.customers().reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  });

  ngOnInit(): void {
    this.customersService.fetchCustomers();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  getOrderNumber(order: BackendOrder): string {
    if (order.orderNumber) return String(order.orderNumber);
    if (order._id) return order._id.substring(order._id.length - 4).toUpperCase();
    if (order.id) return order.id.substring(order.id.length - 4).toUpperCase();
    return '0000';
  }

  openCustomerProfile(cust: Customer): void {
    this.customersService.selectedCustomer.set(cust);
    const id = cust._id || cust.id;
    if (id) {
      this.customersService.fetchCustomerDetail(id);
    }
  }

  async saveCustomer(): Promise<void> {
    if (!this.newName || !this.newPhone) return;

    const payload: CreateCustomerPayload = {
      name: this.newName.trim(),
      phone: this.newPhone.trim(),
      email: this.newEmail ? this.newEmail.trim() : undefined,
    };

    const ok = await this.customersService.createCustomer(payload);
    if (ok) {
      this.showAddModal.set(false);
      this.newName = '';
      this.newPhone = '';
      this.newEmail = '';
    }
  }

  async confirmDelete(cust: Customer): Promise<void> {
    const id = cust._id || cust.id;
    if (!id) return;
    const confirmed = confirm(`Are you sure you want to remove guest profile "${cust.name}"?`);
    if (confirmed) {
      await this.customersService.deleteCustomer(id);
    }
  }
}
