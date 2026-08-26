import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="space-y-6 max-w-4xl">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-bold mb-2">
          👑 OWNER ONLY SCREEN
        </div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <app-icon name="credit-card" customClass="w-6 h-6 text-[#FF6B00]"></app-icon>
          <span>Billing & Subscription</span>
        </h1>
        <p class="text-xs text-text-muted mt-0.5">Manage your RestaurantOS SaaS plan, active branches quota, and invoice history</p>
      </div>

      <div class="p-6 rounded-lg bg-surface border border-[#FF6B00]/30 shadow-card">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-[#FF6B00] uppercase tracking-wider">Current Plan</span>
            <h2 class="text-2xl font-black text-text-primary mt-1">Enterprise Cloud Tier</h2>
            <p class="text-xs text-text-muted mt-1">Unlimited branches • Unlimited KDS screens • Priority 24/7 SLA</p>
          </div>
          <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black">ACTIVE</span>
        </div>
      </div>
    </div>
  `,
})
export default class BillingComponent {}

