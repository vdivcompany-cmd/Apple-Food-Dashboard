import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, EgpCurrencyPipe, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">Branch Management</h1>
          <p class="text-xs text-text-muted mt-0.5">Physical store locations, operational hours, and branch performance</p>
        </div>
        <button class="px-4 py-2 rounded-md bg-[#FF6B00] hover:bg-[#E55F00] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
          <app-icon name="building-2" customClass="w-4 h-4"></app-icon>
          <span>+ Add New Branch</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (branch of branches(); track branch.id) {
          <div class="bg-surface rounded-lg border border-border p-5 shadow-card hover:border-[#FF6B00]/40 transition">
            <div class="flex items-start justify-between pb-3 border-b border-border mb-3">
              <div>
                <h3 class="font-extrabold text-base text-text-primary">{{ branch.name }}</h3>
                <span class="text-xs text-text-muted">{{ branch.address }}</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[11px] font-bold">● OPEN</span>
            </div>

            <div class="grid grid-cols-3 gap-3 my-3">
              <div class="p-3 rounded-md bg-surface-container border border-border">
                <span class="text-[10px] text-text-muted font-bold uppercase">Active Tables</span>
                <div class="text-sm font-extrabold text-text-primary mt-1">{{ branch.activeTables }} Tables</div>
              </div>
              <div class="p-3 rounded-md bg-surface-container border border-border">
                <span class="text-[10px] text-text-muted font-bold uppercase">Today Orders</span>
                <div class="text-sm font-extrabold text-text-primary mt-1">{{ branch.todayOrders }} Orders</div>
              </div>
              <div class="p-3 rounded-md bg-surface-container border border-border">
                <span class="text-[10px] text-text-muted font-bold uppercase">Today Revenue</span>
                <div class="text-sm font-extrabold text-[#FF6B00] mt-1">{{ branch.todayRevenue | egpCurrency }}</div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export default class BranchesComponent {
  readonly branches = signal([
    { id: '1', name: 'Main Branch — Downtown Cairo', address: '15 Talaat Harb St, Downtown', activeTables: 18, todayOrders: 94, todayRevenue: 32400 },
    { id: '2', name: 'Branch 2 — New Cairo (5th Settlement)', address: 'Point 90 Mall, New Cairo', activeTables: 12, todayOrders: 48, todayRevenue: 16520 },
  ]);
}

