export type Role = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'kitchen' | 'table';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  branchId?: string;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    user: User;
    restaurantName?: string;
    branchName?: string;
  };
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  restaurantName: string | null;
  branchName: string | null;
  isLoading: boolean;
  error: string | null;
}
