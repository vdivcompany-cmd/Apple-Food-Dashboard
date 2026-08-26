import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">Staff & Roles</h1>
          <p class="text-xs text-text-muted mt-0.5">Manage team members, roles (Owner, Manager, Cashier, Kitchen), and branch assignments</p>
        </div>
        <button class="px-4 py-2 rounded-md bg-[#FF6B00] hover:bg-[#E55F00] text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer">
          <app-icon name="user-check" customClass="w-4 h-4"></app-icon>
          <span>+ Add Staff Member</span>
        </button>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-container border-b border-border text-text-muted uppercase font-bold text-[11px]">
            <tr>
              <th class="px-4 py-3">Staff Member</th>
              <th class="px-4 py-3">Email</th>
              <th class="px-4 py-3">Assigned Role</th>
              <th class="px-4 py-3">Branch</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            @for (emp of staff(); track emp.id) {
              <tr class="hover:bg-surface-hover transition">
                <td class="px-4 py-3 font-bold text-text-primary">{{ emp.name }}</td>
                <td class="px-4 py-3 text-text-muted">{{ emp.email }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" [ngClass]="getRoleBadge(emp.role)">
                    {{ emp.role }}
                  </span>
                </td>
                <td class="px-4 py-3 text-text-secondary font-medium">{{ emp.branch }}</td>
                <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] font-bold">ACTIVE</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export default class EmployeesComponent {
  readonly staff = signal([
    { id: '1', name: 'Karim El-Sayed', email: 'owner@applefood.eg', role: 'owner', branch: 'All Branches' },
    { id: '2', name: 'Hassan Tarek', email: 'manager.cairo@applefood.eg', role: 'manager', branch: 'Main Branch — Downtown' },
    { id: '3', name: 'Sara Ahmed', email: 'cashier.sara@applefood.eg', role: 'cashier', branch: 'Main Branch — Downtown' },
    { id: '4', name: 'Chef Mahmoud', email: 'kitchen.lead@applefood.eg', role: 'kitchen', branch: 'Main Branch — Downtown' },
  ]);

  getRoleBadge(role: string): string {
    switch (role) {
      case 'owner': return 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30';
      case 'manager': return 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30';
      case 'cashier': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30';
      case 'kitchen': return 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30';
      default: return 'bg-surface-hover text-text-primary border border-border';
    }
  }
}

