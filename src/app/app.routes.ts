import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/rbac/role.guard';
import { ShellComponent } from './core/layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component'),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      // Primary Operations
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/orders/live-board/live-board.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'cashier'])],
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/orders/pos/pos.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'cashier'])],
      },
      {
        path: 'kitchen/kds-board',
        loadComponent: () => import('./features/kitchen/kds-board/kds-board.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'kitchen'])],
      },
      {
        path: 'kitchen/kds-detail/:id',
        loadComponent: () => import('./features/kitchen/kds-detail/kds-detail.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'kitchen'])],
      },
      {
        path: 'kitchen/kds-detail',
        loadComponent: () => import('./features/kitchen/kds-detail/kds-detail.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'kitchen'])],
      },
      {
        path: 'tables',
        loadComponent: () => import('./features/tables/tables.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'cashier'])],
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/reservations/reservations.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'cashier'])],
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customers.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager', 'cashier'])],
      },

      // Management & Operations
      {
        path: 'menu',
        loadComponent: () => import('./features/menu/menu.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employees.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'branches',
        loadComponent: () => import('./features/branches/branches.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'coupons',
        loadComponent: () => import('./features/coupons/coupons.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'feedback',
        loadComponent: () => import('./features/feedback/feedback.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },

      // System & Financial (Billing is Owner only)
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/billing.component'),
        canActivate: [roleGuard(['super_admin', 'owner'])],
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component'),
        canActivate: [roleGuard(['super_admin', 'owner', 'manager'])],
      },

      // Default redirect
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
