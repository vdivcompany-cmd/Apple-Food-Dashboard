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
    <div class="space-y-6 animate-fade-in">
      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-text-primary tracking-tight">Branch Management</h1>
          <p class="text-xs text-text-muted mt-0.5">Physical store locations, operational status, and branch assignments</p>
        </div>
        <button
          type="button"
          (click)="showAddModal.set(true)"
          class="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <app-icon name="building-2" customClass="w-4 h-4"></app-icon>
          <span>+ Add New Branch</span>
        </button>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="p-12 flex flex-col items-center justify-center gap-3">
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
          <p class="text-xs text-text-muted max-w-sm mx-auto">Create your restaurant's first branch location to begin configuring tables and seating zones.</p>
          <button
            type="button"
            (click)="showAddModal.set(true)"
            class="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover transition cursor-pointer inline-flex items-center gap-2"
          >
            <app-icon name="plus" customClass="w-4 h-4"></app-icon>
            <span>Create First Branch</span>
          </button>
        </div>
      } @else {
        <!-- Branch Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (branch of branches(); track branch._id || branch.id) {
            <div class="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div class="flex items-start justify-between pb-3 border-b border-border mb-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <app-icon name="building-2" customClass="w-4 h-4"></app-icon>
                      </span>
                      <h3 class="font-extrabold text-base text-text-primary">{{ branch.name }}</h3>
                    </div>
                    <span class="text-[11px] font-mono text-text-muted block pl-7">slug: {{ branch.slug }}</span>
                  </div>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border"
                    [ngClass]="branch.isActive !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'"
                  >
                    {{ branch.isActive !== false ? '● ACTIVE' : '○ INACTIVE' }}
                  </span>
                </div>

                <div class="space-y-2 text-xs text-text-muted mb-4">
                  @if (branch.address) {
                    <div class="flex items-center gap-2">
                      <app-icon name="map-pin" customClass="w-3.5 h-3.5 text-text-muted"></app-icon>
                      <span>{{ branch.address }}</span>
                    </div>
                  }
                  @if (branch.phone) {
                    <div class="flex items-center gap-2">
                      <app-icon name="phone" customClass="w-3.5 h-3.5 text-text-muted"></app-icon>
                      <span>{{ branch.phone }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="pt-4 border-t border-border flex items-center justify-between">
                <div class="text-xs">
                  <span class="text-text-muted">Branch ID: </span>
                  <span class="font-mono font-bold text-text-primary text-[10px]">{{ (branch._id || branch.id || '').slice(0, 10) }}...</span>
                </div>
                <button
                  type="button"
                  (click)="setCurrentBranch(branch)"
                  class="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-hover text-text-primary text-xs font-bold transition cursor-pointer border border-border"
                >
                  Select Branch
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Add Branch Modal -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div (click)="showAddModal.set(false)" class="absolute inset-0 bg-black/60 backdrop-blur-xs"></div>
          <div class="relative bg-surface rounded-2xl border border-border p-6 shadow-2xl max-w-md w-full space-y-4 animate-scale-in">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <h3 class="text-base font-extrabold text-text-primary">Add Restaurant Branch</h3>
              <button (click)="showAddModal.set(false)" class="text-text-muted hover:text-text-primary cursor-pointer">✕</button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs font-bold text-text-muted block mb-1">Branch Name</label>
                <input
                  type="text"
                  [(ngModel)]="newBranch.name"
                  (ngModelChange)="autoGenerateSlug()"
                  placeholder="e.g. Downtown Cairo Branch"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="text-xs font-bold text-text-muted block mb-1">Branch Slug</label>
                <input
                  type="text"
                  [(ngModel)]="newBranch.slug"
                  placeholder="e.g. downtown-cairo"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs font-mono text-text-primary font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="text-xs font-bold text-text-muted block mb-1">Address</label>
                <input
                  type="text"
                  [(ngModel)]="newBranch.address"
                  placeholder="e.g. 15 Talaat Harb St, Downtown"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label class="text-xs font-bold text-text-muted block mb-1">Phone Number</label>
                <input
                  type="text"
                  [(ngModel)]="newBranch.phone"
                  placeholder="e.g. +20 100 123 4567"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-xs text-text-primary font-semibold focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3 border-t border-border">
              <button
                type="button"
                (click)="showAddModal.set(false)"
                class="flex-1 py-2.5 rounded-xl bg-surface-container text-text-primary text-xs font-bold hover:bg-surface-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="saveBranch()"
                [disabled]="isSaving() || !newBranch.name || !newBranch.slug"
                class="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-extrabold shadow-md hover:bg-primary-hover transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                @if (isSaving()) {
                  <app-icon name="refresh-cw" customClass="w-3.5 h-3.5 animate-spin"></app-icon>
                  <span>Saving...</span>
                } @else {
                  <span>Create Branch</span>
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
  readonly showAddModal = signal<boolean>(false);

  newBranch = {
    name: '',
    slug: '',
    address: '',
    phone: '',
  };

  ngOnInit(): void {
    this.fetchBranches();
  }

  autoGenerateSlug(): void {
    if (this.newBranch.name) {
      this.newBranch.slug = this.newBranch.name
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

  saveBranch(): void {
    if (!this.newBranch.name || !this.newBranch.slug) return;
    this.isSaving.set(true);

    this.http
      .post<{ success: boolean; data: RestaurantBranch }>(API_ENDPOINTS.branches.list, {
        name: this.newBranch.name.trim(),
        slug: this.newBranch.slug.trim(),
        address: this.newBranch.address.trim(),
        phone: this.newBranch.phone.trim(),
        isActive: true,
      })
      .subscribe({
        next: (res) => {
          this.isSaving.set(false);
          this.showAddModal.set(false);
          this.newBranch = { name: '', slug: '', address: '', phone: '' };
          this.fetchBranches();
        },
        error: (err) => {
          this.isSaving.set(false);
          alert(err?.error?.message || 'Failed to create branch');
        },
      });
  }

  setCurrentBranch(branch: RestaurantBranch): void {
    const id = branch._id || branch.id;
    if (id) {
      localStorage.setItem('restaurant_os_branch_id', id);
      this.authService.currentBranch.set(branch.name);
    }
  }
}
