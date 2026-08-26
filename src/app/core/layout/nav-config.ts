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
    iconName: 'LayoutDashboard',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'operations',
  },
  {
    id: 'orders',
    label: 'Live Orders',
    labelAr: 'الطلبات المباشرة',
    route: '/orders',
    iconName: 'ClipboardList',
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
    iconName: 'PlusCircle',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },
  {
    id: 'kds',
    label: 'Kitchen Display (KDS)',
    labelAr: 'شاشة المطبخ',
    route: '/kitchen/kds-board',
    iconName: 'ChefHat',
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
    iconName: 'Grid2X2',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },
  {
    id: 'reservations',
    label: 'Reservations',
    labelAr: 'الحجوزات',
    route: '/reservations',
    iconName: 'CalendarCheck',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },
  {
    id: 'customers',
    label: 'Customers & CRM',
    labelAr: 'العملاء والولاء',
    route: '/customers',
    iconName: 'Users',
    roles: ['super_admin', 'owner', 'manager', 'cashier'],
    section: 'operations',
  },

  // Management & Growth
  {
    id: 'menu',
    label: 'Menu & Categories',
    labelAr: 'قائمة الطعام',
    route: '/menu',
    iconName: 'Utensils',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'employees',
    label: 'Staff & Roles',
    labelAr: 'فريق العمل',
    route: '/employees',
    iconName: 'UserCheck',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'branches',
    label: 'Branches',
    labelAr: 'الفروع والمواقع',
    route: '/branches',
    iconName: 'Building2',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'reports',
    label: 'Sales & Analytics',
    labelAr: 'التقارير والمبيعات',
    route: '/reports',
    iconName: 'BarChart3',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'coupons',
    label: 'Coupons & Promos',
    labelAr: 'الكوبونات والعروض',
    route: '/coupons',
    iconName: 'Ticket',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },
  {
    id: 'feedback',
    label: 'Reviews & Feedback',
    labelAr: 'التقييمات والآراء',
    route: '/feedback',
    iconName: 'Star',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'management',
  },

  // System & Finance
  {
    id: 'billing',
    label: 'Billing & Plan',
    labelAr: 'الاشتراك والفواتير',
    route: '/billing',
    iconName: 'CreditCard',
    roles: ['super_admin', 'owner'], // OWNER ONLY
    section: 'system',
  },
  {
    id: 'notifications',
    label: 'Activity & Audit Log',
    labelAr: 'سجل النشاطات',
    route: '/notifications',
    iconName: 'Bell',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'system',
  },
  {
    id: 'settings',
    label: 'Settings',
    labelAr: 'إعدادات المطعم',
    route: '/settings',
    iconName: 'Settings',
    roles: ['super_admin', 'owner', 'manager'],
    section: 'system',
  },
];
