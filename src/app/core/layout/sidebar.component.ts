import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../i18n/language.service';
import { NAV_ITEMS, NavItem } from './nav-config';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { OrdersService } from '../../features/orders/orders.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent],
  template: `
    <aside
      class="h-screen bg-surface-container text-text-primary border-r rtl:border-r-0 rtl:border-l border-border flex flex-col transition-all duration-300 select-none z-30 sticky top-0 flex-shrink-0"
      [ngClass]="!isCollapsed() ? 'w-[240px]' : 'w-[72px]'"
    >
      <!-- ── Brand Header ─────────────────────────────── -->
      <div class="h-16 flex items-center px-4 border-b border-border justify-between shrink-0">
        <div class="flex items-center gap-3 overflow-hidden min-w-0">
          <!-- Logo icon: terracotta square like Stitch design -->
          <div
            class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white flex-shrink-0 shadow-sm"
            [title]="isCollapsed() ? 'RestaurantOS' : ''"
          >
            <app-icon name="utensils" customClass="w-4 h-4 text-white"></app-icon>
          </div>
          @if (!isCollapsed()) {
            <span class="text-[15px] font-semibold text-text-primary truncate tracking-tight leading-tight">
              Restaurant<span class="text-primary">OS</span>
            </span>
          }
        </div>

        <!-- Collapse toggle -->
        <button
          type="button"
          (click)="toggleCollapse()"
          class="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors flex-shrink-0 ms-auto cursor-pointer"
          [title]="isCollapsed() ? 'Expand Sidebar' : 'Collapse to Rail'"
        >
          <app-icon [name]="isCollapsed() ? 'chevron-right' : 'chevron-left'" customClass="w-3.5 h-3.5 rtl-flip"></app-icon>
        </button>
      </div>

      <!-- ── Navigation ───────────────────────────────── -->
      <nav class="flex-1 overflow-y-auto py-2 flex flex-col gap-0.5">

        <!-- Operations Section -->
        @if (operationsItems().length) {
          @if (!isCollapsed()) {
            <div class="px-4 pt-3 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {{ roleSection() }}
            </div>
          } @else {
            <div class="py-2 flex justify-center">
              <span class="w-4 h-px bg-border"></span>
            </div>
          }
          @for (item of operationsItems(); track item.id) {
            <a
              [routerLink]="item.route"
              routerLinkActive="!bg-primary/10 !text-primary font-semibold border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              class="flex items-center gap-3 mx-2 px-3 py-2 rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg text-[13px] text-text-primary/75 hover:text-text-primary hover:bg-surface-hover transition-all group relative border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent"
              [class.justify-center]="isCollapsed()"
              [class.mx-0]="isCollapsed()"
              [class.rounded-none]="isCollapsed()"
              [class.px-0]="isCollapsed()"
              [title]="isCollapsed() ? (isArabic() ? item.labelAr : item.label) : ''"
            >
              @if (isCollapsed()) {
                <div class="flex items-center justify-center w-full h-full px-4 py-0.5 relative">
                  <app-icon [name]="item.iconName" customClass="w-5 h-5 flex-shrink-0"></app-icon>
                  @if (getItemBadge(item)) {
                    <span
                      class="absolute top-1 right-2 w-2 h-2 rounded-full"
                      [ngClass]="getItemBadgeVariant(item) === 'warning' ? 'bg-amber-500 animate-pulse' : 'bg-primary'"
                    ></span>
                  }
                </div>
              } @else {
                <app-icon [name]="item.iconName" customClass="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105"></app-icon>
                <span class="truncate flex-1 font-medium">
                  {{ isArabic() ? item.labelAr : item.label }}
                </span>
                @if (getItemBadge(item); as badge) {
                  <span
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider transition-all"
                    [ngClass]="getBadgeClass(getItemBadgeVariant(item))"
                  >
                    {{ badge }}
                  </span>
                }
              }
            </a>
          }
        }

        <!-- Management Section -->
        @if (managementItems().length) {
          @if (!isCollapsed()) {
            <div class="px-4 pt-4 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Management
            </div>
          } @else {
            <div class="py-2 flex justify-center">
              <span class="w-4 h-px bg-border"></span>
            </div>
          }
          @for (item of managementItems(); track item.id) {
            <a
              [routerLink]="item.route"
              routerLinkActive="!bg-primary/10 !text-primary font-semibold border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 mx-2 px-3 py-2 rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg text-[13px] text-text-primary/75 hover:text-text-primary hover:bg-surface-hover transition-all group relative border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent"
              [class.justify-center]="isCollapsed()"
              [class.mx-0]="isCollapsed()"
              [class.rounded-none]="isCollapsed()"
              [class.px-0]="isCollapsed()"
              [title]="isCollapsed() ? (isArabic() ? item.labelAr : item.label) : ''"
            >
              @if (isCollapsed()) {
                <div class="flex items-center justify-center w-full h-full px-4 py-0.5">
                  <app-icon [name]="item.iconName" customClass="w-5 h-5 flex-shrink-0"></app-icon>
                </div>
              } @else {
                <app-icon [name]="item.iconName" customClass="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105"></app-icon>
                <span class="truncate flex-1 font-medium">
                  {{ isArabic() ? item.labelAr : item.label }}
                </span>
                @if (item.badge) {
                  <span
                    class="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                    [ngClass]="getBadgeClass(item.badgeVariant)"
                  >
                    {{ item.badge }}
                  </span>
                }
              }
            </a>
          }
        }

        <!-- System Section -->
        @if (systemItems().length) {
          @if (!isCollapsed()) {
            <div class="px-4 pt-4 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
              System
            </div>
          } @else {
            <div class="py-2 flex justify-center">
              <span class="w-4 h-px bg-border"></span>
            </div>
          }
          @for (item of systemItems(); track item.id) {
            <a
              [routerLink]="item.route"
              routerLinkActive="!bg-primary/10 !text-primary font-semibold border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 mx-2 px-3 py-2 rounded-r-lg rtl:rounded-r-none rtl:rounded-l-lg text-[13px] text-text-primary/75 hover:text-text-primary hover:bg-surface-hover transition-all group relative border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent"
              [class.justify-center]="isCollapsed()"
              [class.mx-0]="isCollapsed()"
              [class.rounded-none]="isCollapsed()"
              [class.px-0]="isCollapsed()"
              [title]="isCollapsed() ? (isArabic() ? item.labelAr : item.label) : ''"
            >
              @if (isCollapsed()) {
                <div class="flex items-center justify-center w-full h-full px-4 py-0.5">
                  <app-icon [name]="item.iconName" customClass="w-5 h-5 flex-shrink-0"></app-icon>
                </div>
              } @else {
                <app-icon [name]="item.iconName" customClass="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105"></app-icon>
                <span class="truncate flex-1 font-medium">
                  {{ isArabic() ? item.labelAr : item.label }}
                </span>
              }
            </a>
          }
        }
      </nav>

      <!-- ── Bottom: User Role Pill & Logout Button ────────── -->
      @if (!isCollapsed()) {
        <div class="p-3 border-t border-border flex flex-col gap-2 shrink-0 bg-surface-container">
          <!-- Role pill card -->
          <div class="px-3 py-2 rounded-xl bg-surface border border-border flex items-center justify-between shadow-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full flex-shrink-0" [ngClass]="roleIndicatorClass()"></span>
              <div class="truncate text-xs font-semibold text-text-primary">
                {{ currentRoleName() }}
              </div>
            </div>
            <span
              class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0"
              [ngClass]="roleBadgeClass()"
            >
              {{ userRole() }}
            </span>
          </div>

          <!-- Sidebar Logout Action Button -->
          <button
            type="button"
            (click)="logout()"
            class="w-full px-3 py-2.5 rounded-xl border border-border bg-surface hover:bg-danger/10 hover:text-danger hover:border-danger/30 text-text-muted text-xs font-bold transition flex items-center justify-between group cursor-pointer"
            [title]="isArabic() ? 'تسجيل الخروج من النظام' : 'Sign Out of Terminal'"
          >
            <div class="flex items-center gap-2">
              <app-icon name="log-out" customClass="w-4 h-4 text-text-muted group-hover:text-danger transition"></app-icon>
              <span>{{ isArabic() ? 'تسجيل الخروج' : 'Sign Out' }}</span>
            </div>
            <span class="text-[10px] uppercase font-bold text-text-muted group-hover:text-danger">Exit</span>
          </button>
        </div>
      } @else {
        <!-- Collapsed: role dot + compact logout -->
        <div class="p-2 border-t border-border flex flex-col items-center gap-2 shrink-0">
          <div
            class="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center"
            [title]="'Active Role: ' + userRole()"
          >
            <span class="w-2.5 h-2.5 rounded-full" [ngClass]="roleIndicatorClass()"></span>
          </div>

          <!-- Collapsed Logout Button -->
          <button
            type="button"
            (click)="logout()"
            class="w-8 h-8 rounded-lg bg-surface hover:bg-danger/10 hover:text-danger hover:border-danger/30 border border-border flex items-center justify-center text-text-muted transition cursor-pointer"
            title="Sign Out Terminal"
          >
            <app-icon name="log-out" customClass="w-4 h-4"></app-icon>
          </button>
        </div>
      }
    </aside>
  `,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly langService = inject(LanguageService);
  readonly ordersService = inject(OrdersService);

  readonly isCollapsed = signal<boolean>(false);
  readonly userRole = this.authService.userRole;
  readonly isArabic = computed(() => this.langService.currentLanguage() === 'ar');

  readonly allowedNavItems = computed<NavItem[]>(() => {
    const role = this.userRole();
    return NAV_ITEMS.filter((item) => role === 'super_admin' || item.roles.includes(role));
  });

  readonly operationsItems = computed<NavItem[]>(() =>
    this.allowedNavItems().filter((i) => i.section === 'operations')
  );

  readonly managementItems = computed<NavItem[]>(() =>
    this.allowedNavItems().filter((i) => i.section === 'management')
  );

  readonly systemItems = computed<NavItem[]>(() =>
    this.allowedNavItems().filter((i) => i.section === 'system')
  );

  /** Section header label adapts to current role */
  readonly roleSection = computed<string>(() => {
    switch (this.userRole()) {
      case 'owner':   return 'Owner / Manager';
      case 'manager': return 'Manager';
      case 'cashier': return 'Cashier';
      case 'kitchen': return 'Kitchen';
      default:        return 'Operations';
    }
  });

  readonly currentRoleName = computed<string>(() => {
    switch (this.userRole()) {
      case 'owner':   return 'Restaurant Owner';
      case 'manager': return 'Branch Manager';
      case 'cashier': return 'Cashier Staff';
      case 'kitchen': return 'Kitchen Display';
      default:        return 'Staff Member';
    }
  });

  getItemBadge(item: NavItem): string | undefined {
    if (item.id === 'orders') {
      const pending = this.ordersService.pendingOrders().length;
      if (pending > 0) return `${pending} New`;
      return 'Live';
    }
    return item.badge;
  }

  getItemBadgeVariant(item: NavItem): 'primary' | 'success' | 'warning' | 'danger' | undefined {
    if (item.id === 'orders') {
      const pending = this.ordersService.pendingOrders().length;
      if (pending > 0) return 'warning';
      return 'success';
    }
    return item.badgeVariant;
  }

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }

  roleIndicatorClass(): string {
    switch (this.userRole()) {
      case 'owner':   return 'bg-purple-400';
      case 'manager': return 'bg-blue-400';
      case 'cashier': return 'bg-emerald-400';
      case 'kitchen': return 'bg-amber-400';
      default:        return 'bg-primary';
    }
  }

  roleBadgeClass(): string {
    switch (this.userRole()) {
      case 'owner':   return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30';
      case 'manager': return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30';
      case 'cashier': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30';
      case 'kitchen': return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30';
      default:        return 'bg-surface-hover text-text-primary border border-border';
    }
  }

  getBadgeClass(variant?: 'primary' | 'success' | 'warning' | 'danger'): string {
    switch (variant) {
      case 'success': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30';
      case 'warning': return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30';
      case 'danger':  return 'bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30';
      default:        return 'bg-primary/10 text-primary border border-primary/30';
    }
  }
}
