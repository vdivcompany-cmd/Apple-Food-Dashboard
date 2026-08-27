import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Coupon, CreateCouponDto } from '../../shared/models/coupon.model';

@Injectable({
  providedIn: 'root',
})
export class CouponsService {
  private readonly http = inject(HttpClient);

  readonly coupons = signal<Coupon[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  fetchCoupons(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.coupons.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped: Coupon[] = data.map((c: any) => ({
          _id: c._id || c.id,
          id: c._id || c.id,
          tenantId: c.tenantId,
          code: c.code || '',
          discountType: c.discountType || (c.discountPercentage ? 'PERCENTAGE' : 'FIXED'),
          discountValue: c.discountValue ?? c.discountPercentage ?? 10,
          discountPercentage: c.discountPercentage,
          minOrderAmount: c.minOrderAmount ?? 0,
          maxDiscountCap: c.maxDiscountCap,
          usageLimit: c.usageLimit,
          timesUsed: c.timesUsed ?? 0,
          expiresAt: c.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
          isActive: c.isActive !== false,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
        this.coupons.set(mapped);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('CouponsService.fetchCoupons error:', err);
        this.error.set(err?.error?.message || 'Failed to load coupons');
      },
    });
  }

  async createCoupon(dto: CreateCouponDto): Promise<{ success: boolean; error?: string }> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .post<{ success: boolean; data: any }>(API_ENDPOINTS.coupons.create, dto)
        .toPromise();
      this.isSaving.set(false);
      if (res?.success) {
        this.fetchCoupons();
        return { success: true };
      }
      return { success: false, error: 'Failed to create coupon' };
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('createCoupon error:', err);
      return { success: false, error: err?.error?.message || 'Failed to create coupon' };
    }
  }

  async updateCoupon(id: string, dto: Partial<CreateCouponDto>): Promise<{ success: boolean; error?: string }> {
    this.isSaving.set(true);
    try {
      const res = await this.http
        .put<{ success: boolean; data: any }>(API_ENDPOINTS.coupons.update(id), dto)
        .toPromise();
      this.isSaving.set(false);
      if (res?.success) {
        this.fetchCoupons();
        return { success: true };
      }
      return { success: false, error: 'Failed to update coupon' };
    } catch (err: any) {
      this.isSaving.set(false);
      console.warn('updateCoupon error:', err);
      return { success: false, error: err?.error?.message || 'Failed to update coupon' };
    }
  }

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      await this.http.delete(API_ENDPOINTS.coupons.delete(id)).toPromise();
      this.fetchCoupons();
      return true;
    } catch (err) {
      console.warn('deleteCoupon error:', err);
      this.fetchCoupons();
      return false;
    }
  }

  async toggleActive(coupon: Coupon): Promise<void> {
    const id = coupon._id || coupon.id;
    if (!id) return;
    await this.updateCoupon(id, { isActive: !coupon.isActive });
  }
}
