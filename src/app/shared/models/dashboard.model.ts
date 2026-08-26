export interface DashboardKpi {
  todayRevenue: number;
  revenueDeltaPercentage: number;
  totalOrders: number;
  ordersYesterday: number;
  avgOrderValue: number;
  avgOrderValueDelta: number;
  occupiedTables: number;
  totalTables: number;
  tableCapacityPercentage: number;
  availableTables: number;
}

export interface RevenueHourlyPoint {
  hourLabel: string;
  actualRevenue: number;
  targetRevenue: number;
}

export interface TopSellingDish {
  id?: string;
  rank: number;
  name: string;
  nameAr?: string;
  imageUrl?: string;
  ordersCount: number;
  revenue: number;
  category?: string;
  trendPercentage?: number;
}

export interface DashboardOrderSummary {
  id: string;
  orderNumber: string;
  customerName?: string;
  itemsSummary: string;
  channel: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  status: 'received' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  itemsCount: number;
}
