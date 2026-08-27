import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../theme/theme.service';
import { LanguageService } from '../i18n/language.service';
import { OrdersService } from '../../features/orders/orders.service';
import { NotificationsService } from '../../features/notifications/notifications.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { BackendOrder } from '../../shared/models/order.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent, ClickOutsideDirective, EgpCurrencyPipe, RelativeTimePipe],
  template: `
    <!-- Stitch-matched header: bg-surface/90 + backdrop-blur + subtle shadow, h-16 fixed -->
    <header
      class="h-16 bg-surface/90 backdrop-blur-xl border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200 select-none"
      style="box-shadow: 0 1px 8px rgba(0,0,0,0.04);"
    >
      <!-- ── LEFT: Branch name + Role badge ─────────────── -->
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- Branch / context name -->
        <span class="text-xs sm:text-[15px] font-semibold text-text-primary truncate max-w-[140px] sm:max-w-none">
          {{ currentBranch() }}
        </span>
        <!-- Role badge — exact Stitch pattern: rounded-full, secondary-container tint -->
        <span
          class="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex-shrink-0"
          [ngClass]="rolePillClass()"
        >
          {{ userRole() }}
        </span>
      </div>

      <!-- ── RIGHT: Controls & User Dropdown ─────────────── -->
      <div class="flex items-center gap-1.5 sm:gap-2">

        <!-- Language Switcher (EN / AR) -->
        <button
          type="button"
          (click)="toggleLanguage()"
          class="flex items-center gap-1.5 h-9 px-2 sm:px-2.5 rounded-xl bg-surface-container hover:bg-surface-hover border border-border text-[11px] sm:text-[12px] font-semibold text-text-primary transition cursor-pointer"
          [title]="isArabic() ? 'Switch to English' : 'التبديل إلى العربية'"
        >
          <app-icon name="globe" customClass="w-3.5 h-3.5 text-primary"></app-icon>
          <span>{{ isArabic() ? 'English' : 'عربي' }}</span>
        </button>

        <!-- Theme toggle — sun/moon -->
        <button
          type="button"
          (click)="toggleTheme()"
          class="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-hover border border-border flex items-center justify-center text-text-primary transition cursor-pointer"
          [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          @if (isDark()) {
            <app-icon name="sun" customClass="w-4 h-4 text-amber-400"></app-icon>
          } @else {
            <app-icon name="moon" customClass="w-4 h-4 text-primary"></app-icon>
          }
        </button>

        <!-- ── Notification Bell with Live Dropdown ──────── -->
        <div class="relative" appClickOutside (clickOutside)="closeNotifications()">
          <button
            type="button"
            (click)="toggleNotifications()"
            class="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container border transition cursor-pointer"
            [ngClass]="isNotificationsOpen() ? 'bg-surface-container border-border text-primary ring-1 ring-primary/30' : 'border-transparent text-text-muted hover:text-text-primary'"
            title="Notifications & Activity"
          >
            <app-icon name="bell" customClass="w-4 h-4 sm:w-5 sm:h-5"></app-icon>
            
            <!-- Live Badge Counter / Dot -->
            @if (unreadCount() > 0) {
              <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-surface animate-bounce-subtle">
                {{ unreadCount() > 9 ? '9+' : unreadCount() }}
              </span>
            }
          </button>

          <!-- ── Notification Dropdown Panel ──────────────── -->
          @if (isNotificationsOpen()) {
            <div
              class="absolute right-0 top-12 mt-1.5 w-80 sm:w-96 bg-surface rounded-2xl border border-border shadow-elevated z-50 p-3 animate-[fadeIn_0.15s_ease-out] flex flex-col max-h-[480px]"
            >
              <!-- Dropdown Header -->
              <div class="flex items-center justify-between pb-3 border-b border-border">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-black text-text-primary">Notifications</span>
                  @if (unreadCount() > 0) {
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                      {{ unreadCount() }} New
                    </span>
                  }
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    (click)="playChimeTest()"
                    class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container transition text-[11px] font-bold flex items-center gap-1"
                    title="Test audio chime"
                  >
                    <span>🔔 Test</span>
                  </button>

                  <button
                    type="button"
                    (click)="closeNotifications()"
                    class="p-1 rounded-lg text-text-muted hover:text-text-primary transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <!-- Notifications Scrollable Feed -->
              <div class="flex-1 overflow-y-auto py-2 space-y-2 divide-y divide-border/40 text-xs">
                
                <!-- Recent Orders Alert Section -->
                @if (recentOrders().length > 0) {
                  @for (order of recentOrders(); track order._id || order.id) {
                    <div
                      (click)="goToOrder(order)"
                      class="pt-2 first:pt-0 p-2.5 rounded-xl hover:bg-surface-container/80 transition cursor-pointer space-y-1"
                      [ngClass]="order.status === 'PENDING' ? 'bg-primary/5 border border-primary/20' : ''"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <span
                            class="w-2 h-2 rounded-full"
                            [ngClass]="order.status === 'PENDING' ? 'bg-primary animate-pulse' : 'bg-emerald-500'"
                          ></span>
                          <span class="font-mono font-bold text-text-primary">#{{ getOrderNumber(order) }}</span>
                          @if (order.tableNumber) {
                            <span class="px-1.5 py-0.2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-black text-[10px]">
                              Table {{ order.tableNumber }}
                            </span>
                          }
                        </div>
                        <span class="text-[10px] text-text-muted font-medium">{{ order.createdAt | relativeTime }}</span>
                      </div>

                      <div class="flex items-center justify-between text-[11px] text-text-muted">
                        <span>{{ order.customerName || 'Walk-in Guest' }} ({{ order.items.length }} items)</span>
                        <span class="font-bold text-text-primary font-mono">{{ order.totalAmount || order.subtotal || 0 | egpCurrency }}</span>
                      </div>
                    </div>
                  }
                } @else if (notificationsService.notifications().length === 0) {
                  <div class="py-8 text-center text-text-muted space-y-1">
                    <app-icon name="bell" customClass="w-6 h-6 mx-auto opacity-40"></app-icon>
                    <p class="text-xs font-bold">All caught up!</p>
                    <p class="text-[10px]">No new orders or system alerts</p>
                  </div>
                }

                <!-- Recent Notifications Section -->
                @for (notif of notificationsService.notifications().slice(0, 3); track notif._id || notif.id) {
                  <div class="pt-2 p-2 rounded-xl hover:bg-surface-container/60 transition space-y-0.5">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-[11px] text-text-primary truncate max-w-[200px]">
                        {{ notif.messageSubject || 'System Alert' }}
                      </span>
                      <span class="text-[10px] text-text-muted">{{ notif.dispatchedAt | relativeTime }}</span>
                    </div>
                    <p class="text-[11px] text-text-muted line-clamp-1">{{ notif.messageBody }}</p>
                  </div>
                }

              </div>

              <!-- Dropdown Footer -->
              <div class="pt-2 border-t border-border mt-1">
                <a
                  routerLink="/notifications"
                  (click)="closeNotifications()"
                  class="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-hover text-primary font-bold text-center block text-xs transition"
                >
                  View Full Activity & Audit Log →
                </a>
              </div>

            </div>
          }
        </div>

        <!-- Divider -->
        <div class="h-6 w-px bg-border mx-1"></div>

        <!-- ── User Profile Image & Interactive Dropdown Trigger ── -->
        <div
          class="relative"
          appClickOutside
          (clickOutside)="closeDropdown()"
        >
          <button
            type="button"
            (click)="toggleDropdown()"
            class="flex items-center gap-2.5 p-1 rounded-xl hover:bg-surface-container border border-transparent hover:border-border transition cursor-pointer select-none"
            [ngClass]="isDropdownOpen() ? 'bg-surface-container border-border ring-1 ring-primary/30' : ''"
            [title]="isArabic() ? 'قائمة المستخدم والتحكم' : 'User Menu & Session'"
          >
            <!-- User Text info (desktop only) -->
            <div class="text-right hidden md:block">
              <div class="text-[12px] font-bold text-text-primary leading-tight">{{ userName() }}</div>
              <div class="text-[10px] text-text-muted leading-tight">{{ userEmail() }}</div>
            </div>

            <!-- Avatar Circle -->
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[12px] font-bold shadow-sm ring-2 ring-primary/20 flex-shrink-0">
              {{ userInitials() }}
            </div>

            <!-- Chevron indicator -->
            <app-icon
              name="chevron-right"
              customClass="w-3 h-3 text-text-muted transition-transform"
              [class.rotate-90]="isDropdownOpen()"
            ></app-icon>
          </button>

          <!-- ── User Dropdown Panel ─────────────────────── -->
          @if (isDropdownOpen()) {
            <div
              class="absolute right-0 top-12 mt-1.5 w-64 bg-surface rounded-2xl border border-border shadow-elevated z-50 p-2 animate-[fadeIn_0.15s_ease-out]"
            >
              <!-- Dropdown Header: User Info Card -->
              <div class="p-3 rounded-xl bg-surface-container border border-border/60 mb-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                    {{ userInitials() }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-bold text-text-primary truncate leading-tight">
                      {{ userName() }}
                    </div>
                    <div class="text-[10px] text-text-muted truncate mt-0.5">
                      {{ userEmail() }}
                    </div>
                  </div>
                </div>

                <div class="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                  <span class="text-[10px] text-text-muted font-semibold">Role Access</span>
                  <span
                    class="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    [ngClass]="rolePillClass()"
                  >
                    {{ userRole() }}
                  </span>
                </div>
              </div>

              <!-- Menu Action Items -->
              <div class="space-y-0.5">
                <a
                  routerLink="/settings"
                  (click)="closeDropdown()"
                  class="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-hover transition flex items-center gap-2.5"
                >
                  <app-icon name="settings" customClass="w-4 h-4 text-text-muted"></app-icon>
                  <span>{{ isArabic() ? 'إعدادات المطعم' : 'Restaurant Settings' }}</span>
                </a>

                <a
                  routerLink="/branches"
                  (click)="closeDropdown()"
                  class="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-hover transition flex items-center gap-2.5"
                >
                  <app-icon name="building-2" customClass="w-4 h-4 text-text-muted"></app-icon>
                  <span>{{ isArabic() ? 'الفروع والمواقع' : 'Branch Locations' }}</span>
                </a>

                <a
                  routerLink="/notifications"
                  (click)="closeDropdown()"
                  class="w-full px-3 py-2 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-hover transition flex items-center gap-2.5"
                >
                  <app-icon name="bell" customClass="w-4 h-4 text-text-muted"></app-icon>
                  <span>{{ isArabic() ? 'سجل الإشعارات' : 'Activity & Audit Log' }}</span>
                </a>
              </div>

              <div class="h-px bg-border my-1.5 mx-1"></div>

              <!-- Prominent Logout Action -->
              <button
                type="button"
                (click)="onLogout()"
                class="w-full px-3 py-2.5 rounded-xl hover:bg-danger/10 text-danger text-xs font-bold transition flex items-center justify-between group cursor-pointer border border-transparent hover:border-danger/25"
                [title]="isArabic() ? 'تسجيل الخروج من الجلسة' : 'Sign Out of Terminal'"
              >
                <div class="flex items-center gap-2.5">
                  <app-icon name="log-out" customClass="w-4 h-4 text-danger transition-transform group-hover:-translate-x-0.5"></app-icon>
                  <span>{{ isArabic() ? 'تسجيل الخروج' : 'Sign Out Terminal' }}</span>
                </div>
                <span class="text-[10px] uppercase font-bold text-danger/70 group-hover:text-danger">Exit</span>
              </button>
            </div>
          }
        </div>

      </div>
    </header>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly langService = inject(LanguageService);
  private readonly router = inject(Router);
  readonly ordersService = inject(OrdersService);
  readonly notificationsService = inject(NotificationsService);

  readonly isDropdownOpen = signal<boolean>(false);
  readonly isNotificationsOpen = signal<boolean>(false);

  readonly currentBranch  = this.authService.currentBranch;
  readonly restaurantName = this.authService.restaurantName;
  readonly userRole       = this.authService.userRole;

  readonly isArabic = computed(() => this.langService.currentLanguage() === 'ar');
  readonly isDark   = computed(() => this.themeService.theme() === 'dark');
  readonly userName = computed(() => this.authService.currentUser()?.name || 'Staff User');

  readonly unreadCount = computed(() => {
    return this.ordersService.pendingOrders().length;
  });

  readonly recentOrders = computed<BackendOrder[]>(() => {
    return this.ordersService.orders().slice(0, 6);
  });

  readonly userInitials = computed(() => {
    const name = this.userName();
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  });

  readonly userEmail = computed(() => {
    return this.authService.currentUser()?.email || `${this.userRole()}@restaurantos.com`;
  });

  /** Role pill uses secondary-container pattern from Stitch: warm orange tint */
  readonly rolePillClass = computed(() => {
    switch (this.userRole()) {
      case 'owner':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300';
      case 'manager':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300';
      case 'cashier':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      case 'kitchen':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
      default:
        return 'bg-primary/15 text-primary';
    }
  });

  toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) {
      this.isNotificationsOpen.set(false);
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  toggleNotifications(): void {
    this.isNotificationsOpen.update(v => !v);
    if (this.isNotificationsOpen()) {
      this.isDropdownOpen.set(false);
      this.notificationsService.fetchNotifications();
    }
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  playChimeTest(): void {
    this.ordersService.playNewOrderChime();
  }

  goToOrder(order: BackendOrder): void {
    this.closeNotifications();
    this.router.navigate(['/orders']);
  }

  getOrderNumber(order: BackendOrder): string {
    if (order.orderNumber) return String(order.orderNumber);
    if (order._id) return order._id.slice(-4).toUpperCase();
    if (order.id) return order.id.slice(-4).toUpperCase();
    return '0000';
  }

  toggleLanguage(): void {
    this.langService.toggleLanguage();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onLogout(): void {
    this.closeDropdown();
    this.authService.logout();
  }
}
