import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { EgpCurrencyPipe } from '../../shared/pipes/egyptian-currency.pipe';
import { EmployeesService } from './employees.service';
import { Employee, CreateEmployeePayload } from '../../shared/models/employee.model';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { RestaurantBranch } from '../branches/branches.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, EgpCurrencyPipe],
  template: `
    <div class="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Staff & Team Management</h1>
          <p class="text-xs text-text-muted mt-1">Operational roles, assigned branches, hourly compensation, and staff active status</p>
        </div>
        <button
          type="button"
          (click)="openAddModal()"
          class="px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <app-icon name="user-check" customClass="w-4 h-4"></app-icon>
          <span>+ Add Staff Member</span>
        </button>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div>
            <span class="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Total Staff</span>
            <span class="text-2xl font-black text-text-primary">{{ employeesService.employees().length }}</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <app-icon name="users" customClass="w-5 h-5"></app-icon>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div>
            <span class="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Active On Duty</span>
            <span class="text-2xl font-black text-emerald-500">{{ activeStaffCount() }}</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <app-icon name="check-circle" customClass="w-5 h-5"></app-icon>
          </div>
        </div>

        <div class="bg-surface p-4 rounded-2xl border border-border flex items-center justify-between shadow-card">
          <div>
            <span class="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Assigned Branches</span>
            <span class="text-2xl font-black text-blue-500">{{ branches().length }}</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <app-icon name="building-2" customClass="w-5 h-5"></app-icon>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-card">
        <div class="relative flex-1 max-w-md">
          <app-icon name="search" customClass="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2"></app-icon>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search staff by name, role, phone..."
            class="w-full pl-9 pr-4 py-2 bg-surface-container border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div class="flex items-center gap-2">
          <select
            [ngModel]="selectedBranchFilter()"
            (ngModelChange)="selectedBranchFilter.set($event)"
            class="px-3 py-2 bg-surface-container border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Branches</option>
            @for (b of branches(); track b._id || b.id) {
              <option [value]="b._id || b.id">{{ b.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Live Staff Table -->
      @if (employeesService.isLoading()) {
        <div class="p-16 flex flex-col items-center justify-center gap-3">
          <app-icon name="refresh-cw" customClass="w-8 h-8 text-primary animate-spin"></app-icon>
          <span class="text-xs font-bold text-text-muted">Loading live staff roster from server...</span>
        </div>
      } @else if (filteredEmployees().length === 0) {
        <div class="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <app-icon name="users" customClass="w-6 h-6"></app-icon>
          </div>
          <h3 class="text-base font-extrabold text-text-primary">No Staff Members Found</h3>
          <p class="text-xs text-text-muted max-w-sm mx-auto">
            @if (searchQuery()) {
              No employees match your search query "{{ searchQuery() }}".
            } @else {
              No staff members registered for this branch yet. Click "+ Add Staff Member" to add team members.
            }
          </p>
          @if (!searchQuery()) {
            <button
              type="button"
              (click)="openAddModal()"
              class="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition cursor-pointer"
            >
              + Add First Staff Member
            </button>
          }
        </div>
      } @else {
        <div class="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-surface-container border-b border-border text-text-muted uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th class="px-5 py-3.5">Staff Member</th>
                  <th class="px-5 py-3.5">Contact</th>
                  <th class="px-5 py-3.5">Position / Role</th>
                  <th class="px-5 py-3.5">Assigned Branch</th>
                  <th class="px-5 py-3.5">Hourly Rate</th>
                  <th class="px-5 py-3.5">Status</th>
                  <th class="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (emp of filteredEmployees(); track emp._id || emp.id) {
                  <tr class="hover:bg-surface-hover transition group">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-surface-container border border-border flex items-center justify-center font-black text-text-primary text-xs shrink-0 shadow-xs">
                          {{ getInitials(emp.fullName || emp.name || 'Staff') }}
                        </div>
                        <div>
                          <span class="font-extrabold text-text-primary text-xs block">{{ emp.fullName || emp.name }}</span>
                          <span class="text-[10px] text-text-muted">{{ emp.position || emp.role || 'Team Member' }}</span>
                        </div>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-1.5 text-text-secondary font-medium">
                        <app-icon name="phone" customClass="w-3.5 h-3.5 text-text-muted"></app-icon>
                        <span>{{ emp.phone || 'N/A' }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4">
                      <span
                        class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1"
                        [ngClass]="getPositionBadgeClasses(emp.position || emp.role || '')"
                      >
                        {{ emp.position || emp.role || 'Staff' }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-text-secondary font-medium">
                      {{ getBranchName(emp.branchId) }}
                    </td>
                    <td class="px-5 py-4 font-bold text-text-primary">
                      {{ (emp.hourlyRate || 0) | egpCurrency }}/hr
                    </td>
                    <td class="px-5 py-4">
                      @if (emp.isActive !== false) {
                        <span class="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold">
                          ACTIVE
                        </span>
                      } @else {
                        <span class="px-2.5 py-1 rounded-full bg-neutral-500/10 text-neutral-500 border border-neutral-500/20 text-[10px] font-extrabold">
                          INACTIVE
                        </span>
                      }
                    </td>
                    <td class="px-5 py-4 text-right">
                      <button
                        type="button"
                        (click)="confirmDelete(emp)"
                        class="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        title="Delete staff record"
                      >
                        <app-icon name="trash-2" customClass="w-4 h-4"></app-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── ADD STAFF MEMBER MODAL ────────────────────────── -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showAddModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <!-- Header -->
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 class="text-base font-extrabold text-text-primary">Add Staff Member</h3>
                <p class="text-xs text-text-muted">Register an employee and assign branch location</p>
              </div>
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                <app-icon name="x" customClass="w-4 h-4"></app-icon>
              </button>
            </div>

            <!-- Form -->
            <div class="space-y-3.5">
              <div>
                <label class="block font-bold text-text-primary text-xs mb-1">Full Name *</label>
                <input
                  type="text"
                  [(ngModel)]="newFullName"
                  placeholder="e.g. Karim El-Sayed"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-text-primary text-xs mb-1">Position / Title *</label>
                  <input
                    type="text"
                    [(ngModel)]="newPosition"
                    placeholder="e.g. Head Chef, Cashier"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label class="block font-bold text-text-primary text-xs mb-1">Phone Number *</label>
                  <input
                    type="text"
                    [(ngModel)]="newPhone"
                    placeholder="+20 100 123 4567"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-text-primary text-xs mb-1">Assigned Branch *</label>
                <select
                  [(ngModel)]="newBranchId"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="" disabled>Select physical branch location</option>
                  @for (b of branches(); track b._id || b.id) {
                    <option [value]="b._id || b.id">{{ b.name }} ({{ b.address }})</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-text-primary text-xs mb-1">Hourly Rate (EGP)</label>
                  <input
                    type="number"
                    [(ngModel)]="newHourlyRate"
                    min="0"
                    placeholder="45"
                    class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div class="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="empActiveToggle"
                    [(ngModel)]="newIsActive"
                    class="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                  <label for="empActiveToggle" class="text-xs font-bold text-text-primary cursor-pointer">
                    Active on Roster
                  </label>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 pt-3 border-t border-border">
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-text-primary hover:bg-surface-container transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveEmployee()"
                [disabled]="!newFullName || !newPosition || !newPhone || !newBranchId || employeesService.isSaving()"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {{ employeesService.isSaving() ? 'Saving...' : 'Add Employee' }}
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
})
export default class EmployeesComponent implements OnInit {
  readonly employeesService = inject(EmployeesService);
  private readonly http = inject(HttpClient);

  readonly branches = signal<RestaurantBranch[]>([]);
  readonly searchQuery = signal<string>('');
  readonly selectedBranchFilter = signal<string>('all');
  readonly showAddModal = signal<boolean>(false);

  newFullName = '';
  newPosition = '';
  newPhone = '';
  newBranchId = '';
  newHourlyRate = 50;
  newIsActive = true;

  readonly filteredEmployees = computed(() => {
    let list = this.employeesService.employees();
    const q = this.searchQuery().toLowerCase().trim();
    const branch = this.selectedBranchFilter();

    if (branch !== 'all') {
      list = list.filter((e) => e.branchId === branch);
    }

    if (q) {
      list = list.filter(
        (e) =>
          (e.fullName || e.name || '').toLowerCase().includes(q) ||
          (e.position || e.role || '').toLowerCase().includes(q) ||
          (e.phone || '').includes(q)
      );
    }

    return list;
  });

  readonly activeStaffCount = computed(() => {
    return this.employeesService.employees().filter((e) => e.isActive !== false).length;
  });

  ngOnInit(): void {
    this.employeesService.fetchEmployees();
    this.fetchBranches();
  }

  private fetchBranches(): void {
    this.http.get<{ success: boolean; data: RestaurantBranch[] }>(API_ENDPOINTS.branches.list).subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data)) {
          this.branches.set(res.data);
          if (res.data.length > 0 && !this.newBranchId) {
            this.newBranchId = res.data[0]._id || res.data[0].id || '';
          }
        }
      },
      error: (err) => console.warn('EmployeesComponent.fetchBranches error:', err),
    });
  }

  getBranchName(branchId?: string): string {
    if (!branchId) return 'Main Branch';
    const found = this.branches().find((b) => (b._id || b.id) === branchId);
    return found ? found.name : 'Main Branch';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  }

  getPositionBadgeClasses(pos: string): string {
    const p = pos.toLowerCase();
    if (p.includes('chef') || p.includes('kitchen') || p.includes('cook')) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    }
    if (p.includes('cashier') || p.includes('pos')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    }
    if (p.includes('manager') || p.includes('lead') || p.includes('supervisor')) {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    }
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
  }

  openAddModal(): void {
    if (this.branches().length > 0 && !this.newBranchId) {
      this.newBranchId = this.branches()[0]._id || this.branches()[0].id || '';
    }
    this.showAddModal.set(true);
  }

  async saveEmployee(): Promise<void> {
    if (!this.newFullName || !this.newPosition || !this.newPhone || !this.newBranchId) return;

    const payload: CreateEmployeePayload = {
      fullName: this.newFullName.trim(),
      position: this.newPosition.trim(),
      phone: this.newPhone.trim(),
      branchId: this.newBranchId,
      hourlyRate: Number(this.newHourlyRate) || 0,
      isActive: this.newIsActive,
    };

    const ok = await this.employeesService.createEmployee(payload);
    if (ok) {
      this.showAddModal.set(false);
      this.newFullName = '';
      this.newPosition = '';
      this.newPhone = '';
    }
  }

  async confirmDelete(emp: Employee): Promise<void> {
    const id = emp._id || emp.id;
    if (!id) return;
    const confirmed = confirm(`Are you sure you want to remove ${emp.fullName || emp.name} from the staff roster?`);
    if (confirmed) {
      await this.employeesService.deleteEmployee(id);
    }
  }
}
