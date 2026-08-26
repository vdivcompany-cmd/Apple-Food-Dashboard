import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusVariant =
  | 'received'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'cancelled'
  | 'available'
  | 'occupied'
  | 'reserved'
  | 'bill_requested'
  | 'active'
  | 'inactive'
  | 'pending'
  | 'paid';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
      [ngClass]="badgeClass()"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass()"></span>
      <span>{{ label() || status() }}</span>
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input<StatusVariant | string>('received');
  readonly label = input<string | undefined>(undefined);

  readonly badgeClass = computed(() => {
    const s = (this.status() || '').toLowerCase();
    switch (s) {
      case 'ready':
      case 'served':
      case 'paid':
      case 'available':
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30';

      case 'preparing':
      case 'occupied':
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30';

      case 'cancelled':
      case 'inactive':
        return 'bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30';

      case 'bill_requested':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 animate-pulse';

      case 'received':
      case 'reserved':
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30';
    }
  });

  readonly dotClass = computed(() => {
    const s = (this.status() || '').toLowerCase();
    switch (s) {
      case 'ready':
      case 'served':
      case 'paid':
      case 'available':
      case 'active':
        return 'bg-emerald-500';
      case 'preparing':
      case 'occupied':
      case 'pending':
        return 'bg-amber-500';
      case 'cancelled':
      case 'inactive':
        return 'bg-red-500';
      case 'bill_requested':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  });
}
