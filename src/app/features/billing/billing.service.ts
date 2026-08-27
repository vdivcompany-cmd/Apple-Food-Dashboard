import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Tenant } from '../../shared/models/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private readonly http = inject(HttpClient);

  readonly tenant = signal<Tenant | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchSubscriptionInfo(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tenants.me).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        this.tenant.set(data);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('BillingService.fetchSubscriptionInfo error:', err);
        this.error.set(err?.error?.message || 'Failed to load subscription details');
      },
    });
  }
}
