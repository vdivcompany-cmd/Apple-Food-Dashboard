export interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  address: string;
  phone: string;
  isOpen: boolean;
  activeTablesCount: number;
  activeOrdersCount: number;
  dailyRevenue: number;
  managerName?: string;
}
