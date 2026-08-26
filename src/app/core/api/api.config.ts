import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  auth: {
    login: `${environment.apiUrl}/auth/login`,
    refresh: `${environment.apiUrl}/auth/refresh`,
    me: `${environment.apiUrl}/auth/me`,
  },
  orders: {
    list: `${environment.apiUrl}/orders`,
    create: `${environment.apiUrl}/orders`,
    offlineSync: `${environment.apiUrl}/orders/offline-sync`,
    detail: (id: string) => `${environment.apiUrl}/orders/${id}`,
    updateStatus: (id: string) => `${environment.apiUrl}/orders/${id}`,
    confirmCashier: (id: string) => `${environment.apiUrl}/orders/${id}/confirm-cashier`,
    completeKitchen: (id: string) => `${environment.apiUrl}/orders/${id}/complete-kitchen`,
    complete: (id: string) => `${environment.apiUrl}/orders/${id}/complete`,
  },
  reports: {
    sales: `${environment.apiUrl}/reports/sales`,
    ordersByTable: `${environment.apiUrl}/reports/orders-by-table`,
  },
  menu: {
    catalog: `${environment.apiUrl}/menu`,
    categories: `${environment.apiUrl}/categories`,
    items: `${environment.apiUrl}/menu`,
    products: `${environment.apiUrl}/menu/products`,
  },
  tables: {
    list: `${environment.apiUrl}/tables`,
    detail: (id: string) => `${environment.apiUrl}/tables/${id}`,
  },
  branches: {
    list: `${environment.apiUrl}/branches`,
  },
  employees: {
    list: `${environment.apiUrl}/employees`,
  },
  customers: {
    list: `${environment.apiUrl}/customers`,
  },
  reservations: {
    list: `${environment.apiUrl}/reservations`,
  },
  coupons: {
    list: `${environment.apiUrl}/coupons`,
  },
  notifications: {
    list: `${environment.apiUrl}/notifications`,
  },
};
