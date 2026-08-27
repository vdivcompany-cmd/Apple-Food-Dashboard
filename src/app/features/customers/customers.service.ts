import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Customer, CreateCustomerPayload } from '../../shared/models/customer.model';
import { BackendOrder } from '../../shared/models/order.model';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly http = inject(HttpClient);

  readonly customers = signal<Customer[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly customerOrders = signal<BackendOrder[]>([]);
  readonly isLoadingOrders = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchCustomers(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: Customer[] }>(API_ENDPOINTS.customers.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res?.success && Array.isArray(res.data)) {
          this.customers.set(res.data);
        } else {
          this.customers.set([]);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('CustomersService.fetchCustomers error:', err);
        this.error.set(err?.error?.message || 'Failed to load customers');
      },
    });
  }

  fetchCustomerDetail(customerId: string): void {
    this.isLoadingOrders.set(true);
    this.customerOrders.set([]);

    // Fetch customer's orders from live backend orders list filtered by customer/phone
    this.http.get<{ success: boolean; data: BackendOrder[] }>(API_ENDPOINTS.orders.list).subscribe({
      next: (res) => {
        this.isLoadingOrders.set(false);
        if (res?.success && Array.isArray(res.data)) {
          const cust = this.selectedCustomer();
          const custPhone = cust?.phone;
          const custName = cust?.name;
          const custId = cust?.id || cust?._id;

          const filtered = res.data.filter(
            (o) =>
              (custId && (o.customerId === custId || (o as any).customer?._id === custId)) ||
              (custPhone && o.customerPhone === custPhone) ||
              (custName && o.customerName === custName)
          );
          this.customerOrders.set(filtered);
        }
      },
      error: (err) => {
        this.isLoadingOrders.set(false);
        console.warn('CustomersService.fetchCustomerDetail error:', err);
      },
    });
  }

  async createCustomer(payload: CreateCustomerPayload): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .post<{ success: boolean; data: Customer }>(API_ENDPOINTS.customers.create, payload)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.fetchCustomers();
        return true;
      }
      return false;
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('CustomersService.createCustomer error:', err);
      return false;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .delete<{ success: boolean; message: string }>(API_ENDPOINTS.customers.delete(id))
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.fetchCustomers();
        return true;
      }
      return false;
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('CustomersService.deleteCustomer error:', err);
      return false;
    }
  }
}
