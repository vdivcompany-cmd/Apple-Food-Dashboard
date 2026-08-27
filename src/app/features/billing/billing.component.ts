import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from './billing.service';
import { AuthService } from '../../core/auth/auth.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── HEADER ─────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Subscription & Invoices
          </h1>
          <p class="text-xs text-text-muted mt-0.5">
            Manage your RestaurantOS SaaS subscription tier, feature limits, and payment receipts
          </p>
        </div>

        <span class="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-black uppercase self-start sm:self-auto">
          ● Active Subscription
        </span>
      </div>

      <!-- ── ACTIVE PLAN BANNER ─────────────────────────────── -->
      <div class="bg-gradient-to-r from-primary/20 via-surface to-surface border border-primary/40 rounded-2xl p-6 shadow-card space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-primary uppercase tracking-wider">Current Membership</span>
            <h2 class="text-2xl font-black text-text-primary">
              {{ billingService.tenant()?.subscriptionPlan || 'PRO ENTERPRISE' | uppercase }}
            </h2>
            <p class="text-xs text-text-muted">
              Tenant Slug: <span class="font-mono font-bold text-text-primary">{{ billingService.tenant()?.slug || 'apple-food' }}</span>
              • Status: <span class="font-bold text-emerald-500 uppercase">{{ billingService.tenant()?.status || 'active' }}</span>
            </p>
          </div>

          <div class="bg-surface/80 backdrop-blur-xs p-4 rounded-xl border border-border text-right sm:min-w-[180px]">
            <span class="text-[10px] text-text-muted font-bold block uppercase">Next Renewal Date</span>
            <h4 class="text-sm font-black text-text-primary mt-0.5">
              {{ formatDate(billingService.tenant()?.subscriptionExpiresAt) }}
            </h4>
          </div>
        </div>
      </div>

      <!-- ── 3 TIERS COMPARISON ─────────────────────────────── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Starter Tier -->
        <div class="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-5 flex flex-col justify-between opacity-80 hover:opacity-100 transition">
          <div class="space-y-3">
            <div>
              <span class="text-xs font-bold text-text-muted uppercase">Starter Tier</span>
              <h3 class="text-xl font-black text-text-primary mt-0.5">Free Trial</h3>
              <p class="text-[11px] text-text-muted mt-1">For new food trucks & single kiosks</p>
            </div>
            <div class="text-2xl font-black text-text-primary font-mono">0 EGP <span class="text-xs font-normal text-text-muted">/mo</span></div>
            
            <ul class="space-y-2 text-xs text-text-muted font-semibold pt-3 border-t border-border">
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Up to 100 orders/day</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Single Branch</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Basic Menu Manager</span>
              </li>
            </ul>
          </div>

          <button disabled class="w-full py-2.5 rounded-xl bg-surface-container text-text-muted font-bold text-xs cursor-not-allowed">
            Current Tier
          </button>
        </div>

        <!-- Pro Tier (Active) -->
        <div class="bg-surface rounded-2xl border-2 border-primary p-6 shadow-card space-y-5 flex flex-col justify-between relative">
          <div class="absolute -top-3 right-5 bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
            Active Plan
          </div>

          <div class="space-y-3">
            <div>
              <span class="text-xs font-bold text-primary uppercase">Professional</span>
              <h3 class="text-xl font-black text-text-primary mt-0.5">Pro Growth</h3>
              <p class="text-[11px] text-text-muted mt-1">For full-service dining restaurants</p>
            </div>
            <div class="text-2xl font-black text-text-primary font-mono">1,499 EGP <span class="text-xs font-normal text-text-muted">/mo</span></div>
            
            <ul class="space-y-2 text-xs text-text-primary font-semibold pt-3 border-t border-border">
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Unlimited Orders & POS</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Up to 5 Branches</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Live KDS Kitchen Display</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Table Floor Plan Blueprint</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>AI Telegram Ordering Bot</span>
              </li>
            </ul>
          </div>

          <button class="w-full py-2.5 rounded-xl bg-primary text-white font-extrabold text-xs shadow-xs hover:opacity-90 transition cursor-pointer">
            Manage Plan
          </button>
        </div>

        <!-- Enterprise Tier -->
        <div class="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-5 flex flex-col justify-between opacity-80 hover:opacity-100 transition">
          <div class="space-y-3">
            <div>
              <span class="text-xs font-bold text-text-muted uppercase">Enterprise</span>
              <h3 class="text-xl font-black text-text-primary mt-0.5">Multi-Chain VIP</h3>
              <p class="text-[11px] text-text-muted mt-1">For regional chains & franchises</p>
            </div>
            <div class="text-2xl font-black text-text-primary font-mono">3,999 EGP <span class="text-xs font-normal text-text-muted">/mo</span></div>
            
            <ul class="space-y-2 text-xs text-text-muted font-semibold pt-3 border-t border-border">
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Unlimited Branches</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Dedicated Account Manager</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Custom ERP & Accounting API</span>
              </li>
              <li class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>99.99% SLA Guarantee</span>
              </li>
            </ul>
          </div>

          <button class="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-hover text-text-primary font-bold text-xs transition cursor-pointer">
            Contact Sales
          </button>
        </div>

      </div>

      <!-- ── INVOICE HISTORY ────────────────────────────────── -->
      <div class="bg-surface rounded-2xl border border-border p-6 shadow-card space-y-4">
        <h3 class="text-sm font-extrabold text-text-primary border-b border-border pb-3">
          Recent Payment Receipts
        </h3>

        <div class="space-y-2 text-xs">
          <div class="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-border">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <app-icon name="credit-card" customClass="w-4 h-4"></app-icon>
              </div>
              <div>
                <span class="font-bold text-text-primary block">Subscription - Pro Plan (Monthly)</span>
                <span class="text-[10px] text-text-muted">Invoice #INV-2026-0801 • Paid via Card</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-black text-text-primary font-mono">1,499.00 EGP</span>
              <span class="block text-[10px] text-emerald-500 font-bold uppercase">Paid</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
})
export default class BillingComponent implements OnInit {
  readonly billingService = inject(BillingService);
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.billingService.fetchSubscriptionInfo();
  }

  formatDate(d?: string): string {
    if (!d) return 'Never Expiring';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }
}
