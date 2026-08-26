import { AppIconComponent } from '../app-icon/app-icon.component';
﻿import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-dashed border-border rounded-xl">
      <div class="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted mb-4 shadow-sm">
        <app-icon [name]="iconName || 'shopping-bag'" class="w-7 h-7"></app-icon>
      </div>

      <h3 class="text-base font-bold text-text-primary mb-1">
        {{ title }}
      </h3>
      <p class="text-xs text-text-muted max-w-sm mb-5">
        {{ description }}
      </p>

      @if (actionLabel) {
        <button
          type="button"
          (click)="actionClick.emit()"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition"
        >
          <app-icon name="plus" class="w-4 h-4"></app-icon>
          <span>{{ actionLabel }}</span>
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title: string = 'No items found';
  @Input() description: string = 'There are currently no records to display here.';
  @Input() iconName?: string;
  @Input() actionLabel?: string;
  @Output() actionClick = new EventEmitter<void>();
}

