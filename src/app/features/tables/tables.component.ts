import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';

interface FloorTable {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'bill_requested';
  orderTotal?: number;
  seatedMinutes?: number;
}

@Component({
  selector: 'app-tables',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, EgpCurrencyPipe, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <app-icon name="grid-2x2" customClass="w-6 h-6 text-[#FF6B00]"></app-icon>
            <span>Table Management & Floor Plan</span>
          </h1>
          <p class="text-xs text-text-muted mt-0.5">Visual dining room layout and table turnover status</p>
        </div>

        <div class="flex items-center gap-2.5 text-xs font-bold">
          <span class="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">● 6 Available</span>
          <span class="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">● 4 Occupied</span>
          <span class="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/30">● 1 Bill Requested</span>
          <span class="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/30">● 1 Reserved</span>
        </div>
      </div>

      <!-- Floor Plan Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        @for (table of tables(); track table.id) {
          <div
            class="p-5 rounded-lg border-2 bg-surface shadow-card hover:border-[#FF6B00]/70 transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
            [ngClass]="getTableBorderClass(table.status)"
          >
            <div class="flex items-start justify-between">
              <span class="text-lg font-black text-text-primary">T-{{ table.number }}</span>
              <span class="text-xs text-text-muted font-bold">{{ table.capacity }} Seats</span>
            </div>

            <div class="my-2">
              <app-status-badge [status]="table.status"></app-status-badge>
              @if (table.orderTotal) {
                <div class="text-xs font-extrabold text-text-primary mt-2">
                  {{ table.orderTotal | egpCurrency }}
                </div>
              }
            </div>

            <div class="text-[11px] font-semibold text-text-muted">
              {{ table.section }} @if (table.seatedMinutes) { • {{ table.seatedMinutes }}m seated }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export default class TablesComponent {
  readonly tables = signal<FloorTable[]>([
    { id: '1', number: '01', capacity: 2, section: 'Main Hall', status: 'available' },
    { id: '2', number: '02', capacity: 2, section: 'Main Hall', status: 'occupied', orderTotal: 340, seatedMinutes: 25 },
    { id: '3', number: '03', capacity: 4, section: 'Main Hall', status: 'available' },
    { id: '4', number: '04', capacity: 4, section: 'Main Hall', status: 'occupied', orderTotal: 420, seatedMinutes: 40 },
    { id: '5', number: '05', capacity: 6, section: 'Family Area', status: 'bill_requested', orderTotal: 960, seatedMinutes: 65 },
    { id: '6', number: '06', capacity: 4, section: 'Family Area', status: 'available' },
    { id: '7', number: '07', capacity: 8, section: 'Family Area', status: 'reserved' },
    { id: '8', number: '08', capacity: 4, section: 'Outdoor Terrace', status: 'occupied', orderTotal: 510, seatedMinutes: 15 },
    { id: '9', number: '09', capacity: 2, section: 'Outdoor Terrace', status: 'available' },
    { id: '10', number: '10', capacity: 4, section: 'Outdoor Terrace', status: 'available' },
    { id: '11', number: '11', capacity: 6, section: 'VIP Lounge', status: 'available' },
    { id: '12', number: '12', capacity: 10, section: 'VIP Lounge', status: 'occupied', orderTotal: 1850, seatedMinutes: 50 },
  ]);

  getTableBorderClass(status: string): string {
    switch (status) {
      case 'available': return 'border-emerald-800/60 hover:border-emerald-500';
      case 'occupied': return 'border-amber-800/60 hover:border-amber-500';
      case 'bill_requested': return 'border-purple-600 bg-purple-950/20 animate-pulse';
      case 'reserved': return 'border-blue-800/60 hover:border-blue-500';
      default: return 'border-[#5A4136]/30';
    }
  }
}

