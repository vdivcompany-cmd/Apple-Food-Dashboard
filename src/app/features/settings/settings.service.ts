import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Tenant, UpdateProfileDto, UpdateSettingsDto } from '../../shared/models/tenant.model';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly http = inject(HttpClient);

  readonly profile = signal<Tenant | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  fetchProfile(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tenants.profile).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        this.profile.set(data);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('SettingsService.fetchProfile error, fallback to /tenants/me:', err);
        // Fallback to /tenants/me
        this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.tenants.me).subscribe({
          next: (res2) => {
            const data2 = res2?.data || res2;
            this.profile.set(data2);
          },
          error: (err2) => {
            this.error.set(err2?.error?.message || 'Failed to load restaurant profile');
          },
        });
      },
    });
  }

  async updateProfile(dto: UpdateProfileDto): Promise<{ success: boolean; error?: string }> {
    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const res = await this.http
        .put<{ success: boolean; data: any }>(API_ENDPOINTS.tenants.updateProfile, dto)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.successMessage.set('Restaurant profile updated successfully');
        this.fetchProfile();
        return { success: true };
      }
      return { success: false, error: 'Failed to update profile' };
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('updateProfile error:', err);
      const msg = err?.error?.message || 'Failed to update profile';
      this.error.set(msg);
      return { success: false, error: msg };
    }
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<{ success: boolean; error?: string }> {
    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    try {
      const res = await this.http
        .patch<{ success: boolean; data: any }>(API_ENDPOINTS.tenants.updateSettings, dto)
        .toPromise();

      this.isSaving.set(false);
      if (res?.success) {
        this.successMessage.set('System preferences updated successfully');
        this.fetchProfile();
        return { success: true };
      }
      return { success: false, error: 'Failed to update system preferences' };
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('updateSettings error:', err);
      const msg = err?.error?.message || 'Failed to update system preferences';
      this.error.set(msg);
      return { success: false, error: msg };
    }
  }
}
