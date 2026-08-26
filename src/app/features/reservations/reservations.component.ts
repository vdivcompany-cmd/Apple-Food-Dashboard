import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
            <app-icon name="calendar-check" customClass="w-6 h-6 text-[#FF6B00]"></app-icon>
            <span>Reservations Board</span>
          </h1>
          <p class="text-xs text-text-muted mt-0.5">Guest bookings, seating schedules, and VIP table assignments</p>
        </div>
        <button class="px-4 py-2 rounded-md bg-[#FF6B00] hover:bg-[#E55F00] text-white text-xs font-bold shadow-sm transition cursor-pointer">
          + New Booking
        </button>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container border-b border-border text-text-muted uppercase font-bold text-[11px]">
            <tr>
              <th class="px-4 py-3">Guest Name</th>
              <th class="px-4 py-3">Phone</th>
              <th class="px-4 py-3">Guests</th>
              <th class="px-4 py-3">Date & Time</th>
              <th class="px-4 py-3">Assigned Table</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            @for (res of bookings(); track res.id) {
              <tr class="hover:bg-surface-hover transition">
                <td class="px-4 py-3 font-bold text-text-primary">{{ res.name }}</td>
                <td class="px-4 py-3 text-text-muted">{{ res.phone }}</td>
                <td class="px-4 py-3 font-bold text-text-primary">{{ res.guests }} Guests</td>
                <td class="px-4 py-3 font-medium text-text-secondary">{{ res.date }} at {{ res.time }}</td>
                <td class="px-4 py-3 font-bold text-[#FF6B00]">{{ res.table }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="res.status"></app-status-badge></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class ReservationsComponent {
  readonly bookings = signal([
    { id: '1', name: 'Dr. Sherif Mansour', phone: '+20 100 123 4567', guests: 4, date: 'Today', time: '8:30 PM', table: 'Table #12 VIP', status: 'confirmed' },
    { id: '2', name: 'Eng. Youssef Nabil', phone: '+20 111 987 6543', guests: 2, date: 'Today', time: '9:00 PM', table: 'Table #02', status: 'pending' },
    { id: '3', name: 'Nouran Khalil', phone: '+20 122 555 8899', guests: 6, date: 'Tomorrow', time: '7:00 PM', table: 'Table #05 Family', status: 'confirmed' },
  ]);
}

