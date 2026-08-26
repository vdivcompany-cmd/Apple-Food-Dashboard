import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, EgpCurrencyPipe, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <app-icon name="users" customClass="w-6 h-6 text-[#FF6B00]"></app-icon>
            <span>Customer CRM & Loyalty</span>
          </h1>
          <p class="text-xs text-text-muted mt-0.5">Guest profiles, lifetime spend, loyalty points, and purchase frequency</p>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container border-b border-border text-text-muted uppercase font-bold text-[11px]">
            <tr>
              <th class="px-4 py-3">Customer</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3">Total Orders</th>
              <th class="px-4 py-3">Lifetime Spend</th>
              <th class="px-4 py-3">Loyalty Points</th>
              <th class="px-4 py-3">Last Order</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            @for (cust of customers(); track cust.id) {
              <tr class="hover:bg-surface-hover transition">
                <td class="px-4 py-3 font-bold text-text-primary">{{ cust.name }}</td>
                <td class="px-4 py-3 text-text-muted">{{ cust.phone }}</td>
                <td class="px-4 py-3 font-bold text-text-primary">{{ cust.orders }}</td>
                <td class="px-4 py-3 font-extrabold text-text-primary">{{ cust.spend | egpCurrency }}</td>
                <td class="px-4 py-3 font-bold text-[#FF6B00]">★ {{ cust.points }} pts</td>
                <td class="px-4 py-3 text-text-muted">{{ cust.lastVisit }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class CustomersComponent {
  readonly customers = signal([
    { id: '1', name: 'Mohamed Salah', phone: '+20 101 234 5678', orders: 28, spend: 14500, points: 1450, lastVisit: 'Yesterday' },
    { id: '2', name: 'Laila Rostom', phone: '+20 112 345 6789', orders: 14, spend: 6800, points: 680, lastVisit: '3 days ago' },
    { id: '3', name: 'Ahmed Hegazy', phone: '+20 120 456 7890', orders: 9, spend: 3950, points: 395, lastVisit: '1 week ago' },
  ]);
}

