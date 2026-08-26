export interface KpiMetric {
  title: string;
  value: string | number;
  previousValue?: string | number;
  deltaPercentage?: number;
  trend: 'up' | 'down' | 'neutral';
  prefix?: string;
  suffix?: string;
  iconName?: string;
}

export interface SalesReportSummary {
  totalRevenue: number;
  ordersCount: number;
  avgOrderValue: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  salesByHour: { hour: string; sales: number }[];
  salesByPaymentMethod: { method: string; total: number; count: number }[];
}
