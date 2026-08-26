import { AppIconComponent } from '../app-icon/app-icon.component';
﻿import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="bg-surface rounded-lg border border-border p-5 shadow-card hover:border-[#FF6B00]/40 transition-all flex flex-col justify-between">
      <div class="flex items-start justify-between">
        <span class="text-[11px] font-bold text-text-muted uppercase tracking-wider">
          {{ title }}
        </span>
        @if (iconName) {
          <div class="w-9 h-9 rounded-lg bg-[#FF6B00]/15 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00]">
            <app-icon [name]="iconName" customClass="w-4 h-4"></app-icon>
          </div>
        }
      </div>

      <div class="my-3">
        <div class="text-2xl lg:text-3xl font-extrabold text-text-primary tracking-tight">
          {{ prefix }}{{ value }}{{ suffix }}
        </div>
      </div>

      @if (deltaPercentage !== undefined || subtitle) {
        <div class="flex items-center gap-2 text-xs">
          @if (deltaPercentage !== undefined) {
            <span
              class="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-[11px]"
              [ngClass]="trend === 'up' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' : trend === 'down' ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30' : 'bg-surface-container text-text-primary'"
            >
              <app-icon [name]="trend === 'up' ? 'trending-up' : 'trending-down'" customClass="w-3 h-3"></app-icon>
              {{ deltaPercentage > 0 ? '+' : '' }}{{ deltaPercentage }}%
            </span>
          }
          <span class="text-text-muted text-xs font-medium">
            {{ subtitle || 'vs last week' }}
          </span>
        </div>
      }
    </div>
  `,
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() iconName?: string;
  @Input() deltaPercentage?: number;
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';
  @Input() subtitle?: string;
}

