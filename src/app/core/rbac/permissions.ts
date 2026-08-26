import { Role } from '../../shared/models/auth.model';

export interface RoutePermission {
  path: string;
  allowedRoles: Role[];
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: 'dashboard', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'reports', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'menu', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'branches', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'employees', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'reservations', allowedRoles: ['super_admin', 'owner', 'manager', 'cashier'] },
  { path: 'customers', allowedRoles: ['super_admin', 'owner', 'manager', 'cashier'] },
  { path: 'coupons', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'billing', allowedRoles: ['super_admin', 'owner'] }, // Owner only
  { path: 'notifications', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'settings', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'feedback', allowedRoles: ['super_admin', 'owner', 'manager'] },
  { path: 'orders', allowedRoles: ['super_admin', 'owner', 'manager', 'cashier'] },
  { path: 'pos', allowedRoles: ['super_admin', 'owner', 'manager', 'cashier'] },
  { path: 'tables', allowedRoles: ['super_admin', 'owner', 'manager', 'cashier'] },
  { path: 'kitchen/kds-board', allowedRoles: ['super_admin', 'owner', 'manager', 'kitchen'] },
  { path: 'kitchen/kds-detail', allowedRoles: ['super_admin', 'owner', 'manager', 'kitchen'] },
];

export function hasPermission(role: Role, path: string): boolean {
  if (role === 'super_admin') return true;
  const permission = ROUTE_PERMISSIONS.find((p) => p.path === path || path.startsWith(p.path));
  if (!permission) return true; // unlisted paths are open to authenticated users
  return permission.allowedRoles.includes(role);
}
