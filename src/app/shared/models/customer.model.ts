export interface Customer {
  id?: string;
  _id?: string;
  tenantId?: string;
  name: string;
  phone: string;
  email?: string;
  totalOrders?: number;
  totalSpend?: number;
  loyaltyPoints?: number;
  lastVisit?: string;
  createdAt?: string;
  updatedAt?: string;
  favoriteItems?: string[];
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
}

