import { Role } from '../../shared/models/auth.model';

export interface NavItem {
  id: string;
  label: string;
  labelAr: string;
  route: string;
  iconName: string;
  roles: Role[];
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
  section?: 'operations' | 'management' | 'system';
}

export const NAV_ITEMS: NavItem[] = [
  // Primary Operations
  {
    id: 'dashboard',
    label: 'Dashboard',
    labelAr: 'لوحة التحكم',
    route: '/dashboard',
    iconName: 'layout-dashboard',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'operations',
  },
  {
    id: 'orders',
    label: 'Live Orders',
    labelAr: 'الطلبات المباشرة',
    route: '/orders',
    iconName: 'shopping-bag',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    badge: 'Live',
    badgeVariant: 'success',
    section: 'operations',
  },
  {
    id: 'pos',
    label: 'POS / New Order',
    labelAr: 'نقطة البيع / طلب جديد',
    route: '/pos',
    iconName: 'pos',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },
  {
    id: 'kds',
    label: 'Kitchen Display (KDS)',
    labelAr: 'شاشة المطبخ',
    route: '/kitchen/kds-board',
    iconName: 'chef-hat',
    roles: ['super_admin', 'owner', 'manager', 'kitchen'],
    badge: 'KDS',
    badgeVariant: 'warning',
    section: 'operations',
  },
  {
    id: 'tables',
    label: 'Table Floor Plan',
    labelAr: 'مخطط الطاولات',
    route: '/tables',
    iconName: 'table-restaurant',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },
  {
    id: 'reservations',
    label: 'Reservations',
    labelAr: 'الحجوزات',
    route: '/reservations',
    iconName: 'calendar-check',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },
  {
    id: 'customers',
    label: 'Customers & CRM',
    labelAr: 'العملاء والولاء',
    route: '/customers',
    iconName: 'users',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },

  // Management & Growth
  {
    id: 'menu',
    label: 'Menu & Categories',
    labelAr: 'قائمة الطعام',
    route: '/menu',
    iconName: 'utensils',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'employees',
    label: 'Staff & Roles',
    labelAr: 'فريق العمل',
    route: '/employees',
    iconName: 'badge',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'branches',
    label: 'Branches',
    labelAr: 'الفروع والمواقع',
    route: '/branches',
    iconName: 'store',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'reports',
    label: 'Sales & Analytics',
    labelAr: 'التقارير والمبيعات',
    route: '/reports',
    iconName: 'bar-chart-3',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'coupons',
    label: 'Coupons & Promos',
    labelAr: 'الكوبونات والعروض',
    route: '/coupons',
    iconName: 'ticket',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'feedback',
    label: 'Reviews & Feedback',
    labelAr: 'التقييمات والآراء',
    route: '/feedback',
    iconName: 'star',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },

  // System & Finance
  {
    id: 'billing',
    label: 'Billing & Plan',
    labelAr: 'الاشتراك والفواتير',
    route: '/billing',
    iconName: 'credit-card',
    roles: ['super_admin', 'owner'], // OWNER ONLY
    section: 'system',
  },
  {
    id: 'notifications',
    label: 'Activity & Audit Log',
    labelAr: 'سجل النشاطات',
    route: '/notifications',
    iconName: 'activity',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'system',
  },
  {
    id: 'settings',
    label: 'Settings',
    labelAr: 'إعدادات المطعم',
    route: '/settings',
    iconName: 'settings',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'system',
  },
  {
    id: 'style-guide',
    label: 'Style Guide & UI',
    labelAr: 'دليل التصميم',
    route: '/style-guide',
    iconName: 'palette',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'system',
  },
];
