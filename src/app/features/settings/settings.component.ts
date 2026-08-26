import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="space-y-6 max-w-4xl">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <app-icon name="settings" customClass="w-6 h-6 text-[#FF6B00]"></app-icon>
          <span>Restaurant Profile Settings</span>
        </h1>
        <p class="text-xs text-text-muted mt-0.5">Branding, tax identification, AI chatbot kill-switches, and QR themes</p>
      </div>

      <div class="p-6 rounded-lg bg-surface border border-border shadow-card space-y-5">
        <div>
          <label class="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1">Restaurant Brand Name</label>
          <input type="text" value="Apple Food Restaurant" class="w-full px-4 py-2.5 rounded-md border border-border bg-surface-container text-xs font-bold text-text-primary outline-none focus:border-[#FF6B00]" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1">Currency</label>
            <input type="text" value="EGP (Egyptian Pound)" disabled class="w-full px-4 py-2.5 rounded-md border border-border bg-surface-hover text-xs font-semibold text-text-muted" />
          </div>
          <div>
            <label class="block text-xs font-bold text-text-primary uppercase tracking-wider mb-1">Tax Rate</label>
            <input type="text" value="14% VAT" disabled class="w-full px-4 py-2.5 rounded-md border border-border bg-surface-hover text-xs font-semibold text-text-muted" />
          </div>
        </div>

        <div class="p-4 rounded-md bg-surface-container border border-border flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-text-primary">AI Table Chatbot (Customer App)</div>
            <div class="text-[11px] text-text-muted">Allow customers to place orders directly via AI conversation</div>
          </div>
          <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold">ENABLED</span>
        </div>
      </div>
    </div>
  `,
})
export default class SettingsComponent {}

