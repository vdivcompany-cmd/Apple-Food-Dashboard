import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { AuthService } from '../../core/auth/auth.service';

export interface RestaurantBranch {
  _id?: string;
  id?: string;
  tenantId?: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
  tableCount?: number;
  createdAt?: string;
}

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">Branch Management</h1>
          <p class="text-xs text-text-muted mt-1">Physical restaurant locations, active floor status, address details, and store scope</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="px-4 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <app-icon name="building-2" customClass="w-4 h-4"></app-icon>
          <span>+ Add New Branch</span>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="p-16 flex flex-col items-center justify-center gap-3">
          <app-icon name="refresh-cw" customClass="w-8 h-8 text-primary animate-spin"></app-icon>
          <span class="text-xs font-bold text-text-muted">Loading live branches from server...</span>
        </div>
      } @else if (branches().length === 0) {
        <!-- Empty State -->
        <div class="bg-surface rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <app-icon name="building-2" customClass="w-6 h-6"></app-icon>
          </div>
          <h3 class="text-base font-extrabold text-text-primary">No Branches Found</h3>
          <p class="text-xs text-text-muted max-w-sm mx-auto">Create your restaurant's first branch location to begin configuring dining tables, menus, and staff.</p>
          <button
            type="button"
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:opacity-90 transition cursor-pointer inline-flex items-center gap-2"
          >
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>Create First Branch</span>
          </button>
        </div>
      } @else {
        <!-- Branch Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (branch of branches(); track branch._id || branch.id) {
            <div class="bg-surface rounded-2xl border border-border p-6 shadow-card hover:border-primary/40 transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between pb-3 border-b border-border mb-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="p-1.5 rounded-xl bg-primary/10 text-primary">
                        <app-icon name="building-2" customClass="w-4 h-4"></app-icon>
                      </span>
                      <h3 class="font-extrabold text-base text-text-primary">{{ branch.name }}</h3>
                    </div>
                    <span class="text-[11px] font-mono text-text-muted block pl-7">slug: {{ branch.slug }}</span>
                  </div>
                  
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border"
                    [ngClass]="branch.isActive !== false ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'"
                  >
                    {{ branch.isActive !== false ? '● ACTIVE' : '○ INACTIVE' }}
                  </span>
                </div>

                <div class="space-y-2.5 text-xs text-text-muted mb-4">
                  <div class="flex items-center gap-2">
                    <app-icon name="map-pin" customClass="w-3.5 h-3.5 text-text-muted shrink-0"></app-icon>
                    <span class="font-medium text-text-secondary">{{ branch.address || 'No street address specified' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-icon name="phone" customClass="w-3.5 h-3.5 text-text-muted shrink-0"></app-icon>
                    <span class="font-medium text-text-secondary">{{ branch.phone || 'No phone recorded' }}</span>
                  </div>
                  @if (branch.tableCount) {
                    <div class="flex items-center gap-2">
                      <app-icon name="utensils" customClass="w-3.5 h-3.5 text-text-muted shrink-0"></app-icon>
                      <span class="font-medium text-text-secondary">{{ branch.tableCount }} Dining Tables</span>
                    </div>
                  }
                </div>
              </div>

              <div class="pt-4 border-t border-border flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="openEditModal(branch)"
                    class="p-2 text-text-muted hover:text-text-primary hover:bg-surface-container rounded-xl transition cursor-pointer"
                    title="Edit branch details"
                  >
                    <app-icon name="edit" customClass="w-4 h-4"></app-icon>
                  </button>
                  <button
                    type="button"
                    (click)="confirmDelete(branch)"
                    class="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                    title="Delete branch"
                  >
                    <app-icon name="trash-2" customClass="w-4 h-4"></app-icon>
                  </button>
                </div>

                <button
                  type="button"
                  (click)="setCurrentBranch(branch)"
                  [ngClass]="isCurrentBranch(branch) ? 'bg-primary text-white border-primary' : 'bg-surface-container hover:bg-surface-hover text-text-primary border-border'"
                  class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5"
                >
                  @if (isCurrentBranch(branch)) {
                    <app-icon name="check-circle" customClass="w-3.5 h-3.5"></app-icon>
                    <span>Current Active</span>
                  } @else {
                    <span>Select Scope</span>
                  }
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── ADD / EDIT BRANCH MODAL ────────────────────────── -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"></div>

          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 class="text-base font-extrabold text-text-primary">
                  {{ editingBranchId ? 'Edit Restaurant Branch' : 'Add Restaurant Branch' }}
                </h3>
                <p class="text-xs text-text-muted">Physical store details and location slug</p>
              </div>
              <button (click)="showModal.set(false)" class="p-1.5 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-container cursor-pointer">
                <app-icon name="x" customClass="w-4 h-4"></app-icon>
              </button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs font-bold text-text-primary block mb-1">Branch Name *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  (ngModelChange)="onNameChange()"
                  placeholder="e.g. Downtown Cairo Branch"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="text-xs font-bold text-text-primary block mb-1">Branch Slug *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.slug"
                  placeholder="e.g. downtown-cairo"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs font-mono text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="text-xs font-bold text-text-primary block mb-1">Street Address *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.address"
                  placeholder="e.g. 15 Talaat Harb St, Downtown, Cairo"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="text-xs font-bold text-text-primary block mb-1">Phone Number *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.phone"
                  placeholder="+20 100 123 4567"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="branchActiveToggle"
                  [(ngModel)]="formData.isActive"
                  class="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <label for="branchActiveToggle" class="text-xs font-bold text-text-primary cursor-pointer">
                  Branch is open and operating
                </label>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3 border-t border-border">
              <button
                type="button"
                (click)="showModal.set(false)"
                class="flex-1 py-2.5 rounded-xl border border-border text-text-primary text-xs font-bold hover:bg-surface-container cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveBranch()"
                [disabled]="isSaving() || !formData.name || !formData.slug || !formData.address || !formData.phone"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:opacity-90 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                @if (isSaving()) {
                  <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                  <span>Saving...</span>
                } @else {
                  <span>{{ editingBranchId ? 'Save Changes' : 'Create Branch' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export default class BranchesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly branches = signal<RestaurantBranch[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly showModal = signal<boolean>(false);

  editingBranchId: string | null = null;
  formData = {
    name: '',
    slug: '',
    address: '',
    phone: '',
    isActive: true,
  };

  ngOnInit(): void {
    this.fetchBranches();
  }

  onNameChange(): void {
    if (!this.editingBranchId && this.formData.name) {
      this.formData.slug = this.formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
  }

  fetchBranches(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: RestaurantBranch[] }>(API_ENDPOINTS.branches.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (Array.isArray(res?.data)) {
          this.branches.set(res.data);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('Failed to fetch branches:', err);
      },
    });
  }

  openCreateModal(): void {
    this.editingBranchId = null;
    this.formData = {
      name: '',
      slug: '',
      address: '',
      phone: '',
      isActive: true,
    };
    this.showModal.set(true);
  }

  openEditModal(branch: RestaurantBranch): void {
    this.editingBranchId = branch._id || branch.id || null;
    this.formData = {
      name: branch.name || '',
      slug: branch.slug || '',
      address: branch.address || '',
      phone: branch.phone || '',
      isActive: branch.isActive !== false,
    };
    this.showModal.set(true);
  }

  saveBranch(): void {
    if (!this.formData.name || !this.formData.slug || !this.formData.address || !this.formData.phone) return;
    this.isSaving.set(true);

    const payload = {
      name: this.formData.name.trim(),
      slug: this.formData.slug.trim(),
      address: this.formData.address.trim(),
      phone: this.formData.phone.trim(),
      isActive: this.formData.isActive,
    };

    if (this.editingBranchId) {
      this.http.put<{ success: boolean; data: RestaurantBranch }>(API_ENDPOINTS.branches.update(this.editingBranchId), payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showModal.set(false);
          this.fetchBranches();
        },
        error: (err) => {
          this.isSaving.set(false);
          console.warn('Update branch error:', err);
        },
      });
    } else {
      this.http.post<{ success: boolean; data: RestaurantBranch }>(API_ENDPOINTS.branches.create, payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showModal.set(false);
          this.fetchBranches();
        },
        error: (err) => {
          this.isSaving.set(false);
          console.warn('Create branch error:', err);
        },
      });
    }
  }

  confirmDelete(branch: RestaurantBranch): void {
    const id = branch._id || branch.id;
    if (!id) return;
    const confirmed = confirm(`Are you sure you want to delete branch "${branch.name}"?`);
    if (confirmed) {
      this.http.delete(API_ENDPOINTS.branches.delete(id)).subscribe({
        next: () => this.fetchBranches(),
        error: (err) => console.warn('Delete branch error:', err),
      });
    }
  }

  isCurrentBranch(branch: RestaurantBranch): boolean {
    const id = branch._id || branch.id;
    return id === this.authService.branchId() || branch.name === this.authService.currentBranch();
  }

  setCurrentBranch(branch: RestaurantBranch): void {
    const id = branch._id || branch.id;
    if (id) {
      this.authService.currentBranch.set(branch.name);
    }
  }
}
