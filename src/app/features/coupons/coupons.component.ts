import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">Coupons & Promotions</h1>
          <p class="text-xs text-text-muted mt-0.5">Discount promo codes, loyalty campaign vouchers, and percentage discounts</p>
        </div>
        <button class="px-4 py-2 rounded-md bg-[#FF6B00] hover:bg-[#E55F00] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
          <app-icon name="ticket" customClass="w-4 h-4"></app-icon>
          <span>+ Create Coupon</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (coupon of coupons(); track coupon.code) {
          <div class="p-5 rounded-lg bg-surface border border-border shadow-card flex flex-col justify-between hover:border-[#FF6B00]/40 transition">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-base font-black text-[#FF6B00] tracking-wider font-mono">{{ coupon.code }}</span>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">ACTIVE</span>
              </div>
              <p class="text-xs text-text-muted">{{ coupon.desc }}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-border flex justify-between text-xs font-bold text-text-primary">
              <span class="text-[#FF6B00]">{{ coupon.discount }}</span>
              <span class="text-text-muted font-normal">Used {{ coupon.usedCount }} times</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export default class CouponsComponent {
  readonly coupons = signal([
    { code: 'WELCOME20', desc: 'First-time customer dine-in discount', discount: '20% OFF', usedCount: 142 },
    { code: 'BURGERFEST', desc: 'Weekend special on all burgers', discount: '50 EGP OFF', usedCount: 88 },
    { code: 'VIPGUEST', desc: 'VIP Loyalty members discount', discount: '15% OFF', usedCount: 34 },
  ]);
}

