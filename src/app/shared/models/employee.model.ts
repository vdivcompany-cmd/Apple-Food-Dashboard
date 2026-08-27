export interface Employee {
  id?: string;
  _id?: string;
  tenantId?: string;
  branchId: string;
  branchName?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone: string;
  role?: 'owner' | 'manager' | 'cashier' | 'kitchen' | string;
  position?: string;
  hourlyRate?: number;
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'on_leave' | string;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
}

export interface CreateEmployeePayload {
  branchId: string;
  fullName: string;
  position: string;
  phone: string;
  hourlyRate?: number;
  isActive?: boolean;
}

