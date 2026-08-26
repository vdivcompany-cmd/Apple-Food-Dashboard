import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RelativeTimePipe, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <app-icon name="bell" customClass="w-6 h-6 text-[#FF6B00]"></app-icon>
          <span>Notifications & Audit Log</span>
        </h1>
        <p class="text-xs text-text-muted mt-0.5">Immutable audit trail of staff actions, cashier reconciliations, and system alerts</p>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card divide-y divide-border">
        @for (log of auditLogs(); track log.id) {
          <div class="p-4 flex items-center justify-between hover:bg-surface-hover transition">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-md bg-surface-container border border-border flex items-center justify-center text-[#FF6B00] font-bold text-xs">
                ⚡
              </div>
              <div>
                <div class="text-xs font-bold text-text-primary">{{ log.action }}</div>
                <div class="text-[11px] text-text-muted">By {{ log.user }} ({{ log.role }})</div>
              </div>
            </div>
            <span class="text-xs text-text-muted font-medium">{{ log.time | relativeTime }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export default class NotificationsComponent {
  readonly auditLogs = signal([
    { id: '1', action: 'Order #104 marked as Paid & Closed (890 EGP)', user: 'Sara Ahmed', role: 'Cashier', time: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: '2', action: 'Menu Item "Smash Bacon Double" price updated to 210 EGP', user: 'Karim El-Sayed', role: 'Owner', time: new Date(Date.now() - 45 * 60000).toISOString() },
    { id: '3', action: 'Staff member "Hassan Tarek" logged in to Downtown Branch', user: 'Hassan Tarek', role: 'Manager', time: new Date(Date.now() - 120 * 60000).toISOString() },
  ]);
}

