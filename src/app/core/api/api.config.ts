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
    categoryDetail: (id: string) => `${environment.apiUrl}/categories/${id}`,
    items: `${environment.apiUrl}/menu`,
    products: `${environment.apiUrl}/menu/products`,
    createItem: `${environment.apiUrl}/menu`,
    updateItem: (id: string) => `${environment.apiUrl}/menu/${id}`,
    deleteItem: (id: string) => `${environment.apiUrl}/menu/${id}`,
    toggleAvailability: (id: string) => `${environment.apiUrl}/menu/${id}/toggle-availability`,
  },
  tables: {
    list: `${environment.apiUrl}/tables`,
    detail: (id: string) => `${environment.apiUrl}/tables/${id}`,
    create: `${environment.apiUrl}/tables`,
    update: (id: string) => `${environment.apiUrl}/tables/${id}`,
    updateStatus: (id: string) => `${environment.apiUrl}/tables/${id}`,
    qrImage: (id: string) => `${environment.apiUrl}/tables/${id}/qr-image`,
  },
  branches: {
    list: `${environment.apiUrl}/branches`,
    detail: (id: string) => `${environment.apiUrl}/branches/${id}`,
    create: `${environment.apiUrl}/branches`,
    update: (id: string) => `${environment.apiUrl}/branches/${id}`,
    delete: (id: string) => `${environment.apiUrl}/branches/${id}`,
  },
  employees: {
    list: `${environment.apiUrl}/employees`,
    detail: (id: string) => `${environment.apiUrl}/employees/${id}`,
    create: `${environment.apiUrl}/employees`,
    update: (id: string) => `${environment.apiUrl}/employees/${id}`,
    delete: (id: string) => `${environment.apiUrl}/employees/${id}`,
  },
  customers: {
    list: `${environment.apiUrl}/customers`,
    detail: (id: string) => `${environment.apiUrl}/customers/${id}`,
    create: `${environment.apiUrl}/customers`,
    update: (id: string) => `${environment.apiUrl}/customers/${id}`,
    delete: (id: string) => `${environment.apiUrl}/customers/${id}`,
  },
  reservations: {
    list: `${environment.apiUrl}/reservations`,
    detail: (id: string) => `${environment.apiUrl}/reservations/${id}`,
    create: `${environment.apiUrl}/reservations`,
    update: (id: string) => `${environment.apiUrl}/reservations/${id}`,
    updateStatus: (id: string) => `${environment.apiUrl}/reservations/${id}`,
    delete: (id: string) => `${environment.apiUrl}/reservations/${id}`,
  },
  coupons: {
    list: `${environment.apiUrl}/coupons`,
  },
  notifications: {
    list: `${environment.apiUrl}/notifications`,
  },
};
