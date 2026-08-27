export type CouponDiscountType = 'PERCENTAGE' | 'FIXED';

export interface Coupon {
  _id?: string;
  id?: string;
  tenantId?: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountPercentage?: number;
  minOrderAmount?: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  timesUsed?: number;
  expiresAt: string;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponDto {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountPercentage?: number;
  minOrderAmount?: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  expiresAt: string;
  isActive?: boolean;
}
