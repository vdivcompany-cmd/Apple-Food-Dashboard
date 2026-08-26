export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'cashier' | 'kitchen';
  branchId: string;
  branchName?: string;
  status: 'active' | 'inactive' | 'on_leave';
  hourlyRate?: number;
  joinedDate: string;
  avatarUrl?: string;
}
