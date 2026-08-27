import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponsService } from './coupons.service';
import { Coupon, CreateCouponDto, CouponDiscountType } from '../../shared/models/coupon.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── HEADER ACTION BAR ──────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Coupons & Promotions
          </h1>
          <p class="text-xs text-text-muted mt-0.5">
            Create discount vouchers, promotional campaigns, and track usage limits
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="couponsService.fetchCoupons()"
            [disabled]="couponsService.isLoading()"
            class="p-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-hover text-text-muted hover:text-text-primary transition cursor-pointer"
            title="Refresh coupons"
          >
            <app-icon name="refresh-cw" [customClass]="couponsService.isLoading() ? 'w-4 h-4 animate-spin' : 'w-4 h-4'"></app-icon>
          </button>

          <button
            type="button"
            (click)="openCreateDrawer()"
            class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      <!-- ── SUMMARY STATS ROW ──────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <app-icon name="ticket" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Active Coupons</span>
            <h3 class="text-lg font-black text-text-primary">{{ activeCouponsCount() }}</h3>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <app-icon name="trending-up" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Total Redemptions</span>
            <h3 class="text-lg font-black text-text-primary">{{ totalRedemptions() }} times</h3>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <app-icon name="clock" customClass="w-5 h-5"></app-icon>
          </div>
          <div>
            <span class="text-[11px] font-bold text-text-muted uppercase">Expiring This Month</span>
            <h3 class="text-lg font-black text-text-primary">{{ expiringSoonCount() }}</h3>
          </div>
        </div>
      </div>

      <!-- ── COUPONS GRID ───────────────────────────────────── -->
      @if (couponsService.isLoading()) {
        <div class="p-16 flex flex-col items-center justify-center gap-2 bg-surface rounded-2xl border border-border">
          <app-icon name="refresh-cw" customClass="w-6 h-6 text-primary animate-spin"></app-icon>
          <span class="text-xs font-bold text-text-muted">Loading promotional campaigns...</span>
        </div>
      } @else if (couponsService.coupons().length === 0) {
        <div class="p-12 text-center bg-surface rounded-2xl border border-dashed border-border space-y-3">
          <app-icon name="ticket" customClass="w-10 h-10 text-text-muted mx-auto"></app-icon>
          <h3 class="text-sm font-extrabold text-text-primary">No Active Coupons Found</h3>
          <p class="text-xs text-text-muted max-w-sm mx-auto">
            Create your first promotional discount voucher to reward loyal customers and drive orders.
          </p>
          <button
            type="button"
            (click)="openCreateDrawer()"
            class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
          >
            + Create First Coupon
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (c of couponsService.coupons(); track c._id || c.id) {
            <div class="bg-surface rounded-2xl border border-border p-5 shadow-card hover:border-primary/40 transition space-y-4 flex flex-col justify-between">
              
              <div class="space-y-3">
                <!-- Top Row: Code & Status Toggle -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-black text-sm tracking-wider px-3 py-1 bg-surface-container border border-border rounded-xl text-primary flex items-center gap-1.5 shadow-xs">
                      <app-icon name="ticket" customClass="w-3.5 h-3.5"></app-icon>
                      <span>{{ c.code }}</span>
                    </span>
                    <button
                      type="button"
                      (click)="copyCode(c.code)"
                      class="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-container rounded-lg transition cursor-pointer"
                      title="Copy coupon code"
                    >
                      <app-icon [name]="copiedCode() === c.code ? 'check' : 'copy'" customClass="w-3.5 h-3.5"></app-icon>
                    </button>
                  </div>

                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      [checked]="c.isActive"
                      (change)="couponsService.toggleActive(c)"
                      class="sr-only peer"
                    />
                    <div class="w-9 h-5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <!-- Discount Value Badge -->
                <div>
                  <h3 class="text-xl font-black text-text-primary">
                    @if (c.discountType === 'PERCENTAGE') {
                      {{ c.discountValue }}% OFF
                    } @else {
                      {{ c.discountValue }} EGP OFF
                    }
                  </h3>
                  <p class="text-[11px] text-text-muted mt-0.5">
                    @if (c.minOrderAmount) {
                      Min. order: {{ c.minOrderAmount }} EGP
                    } @else {
                      No minimum order amount
                    }
                    @if (c.maxDiscountCap) {
                      • Max cap: {{ c.maxDiscountCap }} EGP
                    }
                  </p>
                </div>

                <!-- Usage Progress Bar -->
                <div class="space-y-1.5 pt-2 border-t border-border/60">
                  <div class="flex justify-between text-[11px] font-bold text-text-muted">
                    <span>Usage: {{ c.timesUsed || 0 }} redeemed</span>
                    <span>{{ c.usageLimit ? c.usageLimit + ' max' : 'Unlimited' }}</span>
                  </div>
                  @if (c.usageLimit) {
                    <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div
                        class="bg-primary h-full rounded-full transition-all duration-300"
                        [style.width.%]="getUsagePercent(c)"
                      ></div>
                    </div>
                  }
                </div>

              </div>

              <!-- Footer: Expiry & Delete -->
              <div class="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <div class="flex items-center gap-1.5 text-text-muted font-semibold text-[11px]">
                  <app-icon name="calendar" customClass="w-3.5 h-3.5"></app-icon>
                  <span>Expires: {{ formatDate(c.expiresAt) }}</span>
                </div>

                <button
                  type="button"
                  (click)="deleteCoupon(c)"
                  class="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                  title="Delete coupon"
                >
                  <app-icon name="trash-2" customClass="w-4 h-4"></app-icon>
                </button>
              </div>

            </div>
          }
        </div>
      }

      <!-- ── CREATE / EDIT COUPON DRAWER ────────────────────── -->
      @if (showDrawer()) {
        <div class="fixed inset-0 z-50 overflow-hidden">
          <div (click)="showDrawer.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div class="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
              
              <!-- Drawer Header -->
              <div class="p-6 border-b border-border flex items-center justify-between bg-surface-container/50">
                <div>
                  <h3 class="text-base font-extrabold text-text-primary">Create Promotional Coupon</h3>
                  <p class="text-xs text-text-muted">Set discount type, thresholds, and campaign limits</p>
                </div>
                <button
                  type="button"
                  (click)="showDrawer.set(false)"
                  class="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
                >
                  <app-icon name="x" customClass="w-5 h-5"></app-icon>
                </button>
              </div>

              <!-- Drawer Form Body -->
              <div class="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
                
                <!-- Code -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    [ngModel]="formCode()"
                    (ngModelChange)="formCode.set($event.toUpperCase().trim())"
                    placeholder="e.g. SUMMER25, WELCOME10, VIP50"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-mono font-bold uppercase focus:outline-none focus:border-primary transition"
                  />
                </div>

                <!-- Discount Type Toggle -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">Discount Type *</label>
                  <div class="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl border border-border">
                    <button
                      type="button"
                      (click)="formDiscountType.set('PERCENTAGE')"
                      [ngClass]="formDiscountType() === 'PERCENTAGE' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
                      class="py-2 rounded-lg font-bold transition cursor-pointer"
                    >
                      % Percentage
                    </button>
                    <button
                      type="button"
                      (click)="formDiscountType.set('FIXED')"
                      [ngClass]="formDiscountType() === 'FIXED' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
                      class="py-2 rounded-lg font-bold transition cursor-pointer"
                    >
                      Fixed Amount (EGP)
                    </button>
                  </div>
                </div>

                <!-- Discount Value -->
                <div>
                  <label class="block font-bold text-text-primary mb-1">
                    Discount Value ({{ formDiscountType() === 'PERCENTAGE' ? '%' : 'EGP' }}) *
                  </label>
                  <input
                    type="number"
                    [ngModel]="formDiscountValue()"
                    (ngModelChange)="formDiscountValue.set(+$event)"
                    min="1"
                    [max]="formDiscountType() === 'PERCENTAGE' ? 100 : 10000"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition"
                  />
                </div>

                <!-- Min Order & Max Cap -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Min. Order (EGP)</label>
                    <input
                      type="number"
                      [ngModel]="formMinOrder()"
                      (ngModelChange)="formMinOrder.set(+$event)"
                      min="0"
                      placeholder="0"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-text-primary mb-1">Max Cap (EGP)</label>
                    <input
                      type="number"
                      [ngModel]="formMaxCap()"
                      (ngModelChange)="formMaxCap.set(+$event)"
                      min="0"
                      placeholder="Optional"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <!-- Usage Limit & Expiry -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-text-primary mb-1">Usage Limit</label>
                    <input
                      type="number"
                      [ngModel]="formUsageLimit()"
                      (ngModelChange)="formUsageLimit.set(+$event)"
                      min="1"
                      placeholder="e.g. 100"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label class="block font-bold text-text-primary mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      [ngModel]="formExpiryDate()"
                      (ngModelChange)="formExpiryDate.set($event)"
                      class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
                    />
                  </div>
                </div>

                <!-- Live Preview Calculator -->
                <div class="p-3.5 rounded-xl bg-surface-container/80 border border-border space-y-1.5">
                  <span class="font-extrabold text-text-primary text-[11px]">💡 Live Order Preview (200 EGP Cart):</span>
                  <div class="text-[11px] text-text-muted flex items-center justify-between">
                    <span>Estimated Discount:</span>
                    <span class="font-black text-emerald-500 font-mono">-{{ estimatedDiscount() }} EGP</span>
                  </div>
                  <div class="text-[11px] text-text-muted flex items-center justify-between">
                    <span>Final Price:</span>
                    <span class="font-black text-text-primary font-mono">{{ 200 - estimatedDiscount() }} EGP</span>
                  </div>
                </div>

              </div>

              <!-- Drawer Footer -->
              <div class="p-6 border-t border-border bg-surface-container/50 flex items-center gap-3">
                <button
                  type="button"
                  (click)="showDrawer.set(false)"
                  class="flex-1 py-3 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  (click)="saveCoupon()"
                  [disabled]="couponsService.isSaving() || !formCode() || !formDiscountValue()"
                  class="flex-1 py-3 rounded-xl bg-primary text-white font-extrabold text-xs shadow-md hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  @if (couponsService.isSaving()) {
                    <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                    <span>Saving...</span>
                  } @else {
                    <span>Save Coupon</span>
                  }
                </button>
              </div>

            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export default class CouponsComponent implements OnInit {
  readonly couponsService = inject(CouponsService);

  readonly showDrawer = signal<boolean>(false);
  readonly copiedCode = signal<string | null>(null);

  // Form Signals
  readonly formCode = signal<string>('');
  readonly formDiscountType = signal<CouponDiscountType>('PERCENTAGE');
  readonly formDiscountValue = signal<number>(15);
  readonly formMinOrder = signal<number>(0);
  readonly formMaxCap = signal<number>(0);
  readonly formUsageLimit = signal<number>(100);
  readonly formExpiryDate = signal<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  readonly activeCouponsCount = computed(() => {
    return this.couponsService.coupons().filter((c) => c.isActive).length;
  });

  readonly totalRedemptions = computed(() => {
    return this.couponsService.coupons().reduce((acc, c) => acc + (c.timesUsed || 0), 0);
  });

  readonly expiringSoonCount = computed(() => {
    const monthFromNow = Date.now() + 30 * 86400000;
    return this.couponsService.coupons().filter((c) => {
      const exp = new Date(c.expiresAt).getTime();
      return exp > Date.now() && exp < monthFromNow;
    }).length;
  });

  readonly estimatedDiscount = computed(() => {
    const type = this.formDiscountType();
    const val = this.formDiscountValue() || 0;
    const max = this.formMaxCap() || 9999;
    const sampleCart = 200;

    let discount = 0;
    if (type === 'PERCENTAGE') {
      discount = Math.min((sampleCart * val) / 100, max);
    } else {
      discount = Math.min(val, sampleCart);
    }
    return Math.round(discount);
  });

  ngOnInit(): void {
    this.couponsService.fetchCoupons();
  }

  openCreateDrawer(): void {
    this.formCode.set('');
    this.formDiscountType.set('PERCENTAGE');
    this.formDiscountValue.set(15);
    this.formMinOrder.set(0);
    this.formMaxCap.set(0);
    this.formUsageLimit.set(100);
    this.formExpiryDate.set(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    this.showDrawer.set(true);
  }

  async saveCoupon(): Promise<void> {
    const code = this.formCode().trim().toUpperCase();
    if (!code) return;

    const dto: CreateCouponDto = {
      code,
      discountType: this.formDiscountType(),
      discountValue: this.formDiscountValue(),
      discountPercentage: this.formDiscountType() === 'PERCENTAGE' ? this.formDiscountValue() : undefined,
      minOrderAmount: this.formMinOrder() || undefined,
      maxDiscountCap: this.formMaxCap() || undefined,
      usageLimit: this.formUsageLimit() || undefined,
      expiresAt: new Date(this.formExpiryDate()).toISOString(),
      isActive: true,
    };

    const res = await this.couponsService.createCoupon(dto);
    if (res.success) {
      this.showDrawer.set(false);
    } else if (res.error) {
      alert(res.error);
    }
  }

  async deleteCoupon(coupon: Coupon): Promise<void> {
    const id = coupon._id || coupon.id;
    if (!id) return;
    const ok = confirm(`Are you sure you want to delete coupon ${coupon.code}?`);
    if (ok) {
      await this.couponsService.deleteCoupon(id);
    }
  }

  copyCode(code: string): void {
    navigator.clipboard?.writeText(code);
    this.copiedCode.set(code);
    setTimeout(() => this.copiedCode.set(null), 2000);
  }

  getUsagePercent(c: Coupon): number {
    if (!c.usageLimit) return 0;
    return Math.min(100, Math.round(((c.timesUsed || 0) / c.usageLimit) * 100));
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
