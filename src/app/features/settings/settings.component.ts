import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from './settings.service';
import { AuthService } from '../../core/auth/auth.service';
import { UpdateProfileDto, UpdateSettingsDto, TenantLanguage } from '../../shared/models/tenant.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── HEADER ─────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Restaurant Settings
          </h1>
          <p class="text-xs text-text-muted mt-0.5">
            Manage your restaurant profile, brand identity, operating hours, and system preferences
          </p>
        </div>

        <!-- Tab Navigation -->
        <div class="flex items-center bg-surface-container p-1 rounded-xl border border-border text-xs font-bold">
          <button
            type="button"
            (click)="activeTab.set('profile')"
            [ngClass]="activeTab() === 'profile' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
            class="px-3.5 py-1.5 rounded-lg transition cursor-pointer"
          >
            Restaurant Profile
          </button>
          
          @if (isOwner()) {
            <button
              type="button"
              (click)="activeTab.set('preferences')"
              [ngClass]="activeTab() === 'preferences' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              System Preferences
            </button>

            <button
              type="button"
              (click)="activeTab.set('subscription')"
              [ngClass]="activeTab() === 'subscription' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
              class="px-3.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              Subscription
            </button>
          }
        </div>
      </div>

      <!-- Success & Error Alerts -->
      @if (settingsService.successMessage()) {
        <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div class="flex items-center gap-2">
            <app-icon name="check-circle" customClass="w-4 h-4"></app-icon>
            <span>{{ settingsService.successMessage() }}</span>
          </div>
          <button (click)="settingsService.successMessage.set(null)" class="text-xs hover:opacity-70">✕</button>
        </div>
      }

      @if (settingsService.error()) {
        <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div class="flex items-center gap-2">
            <app-icon name="alert-triangle" customClass="w-4 h-4"></app-icon>
            <span>{{ settingsService.error() }}</span>
          </div>
          <button (click)="settingsService.error.set(null)" class="text-xs hover:opacity-70">✕</button>
        </div>
      }

      <!-- ── TAB 1: RESTAURANT PROFILE ──────────────────────── -->
      @if (activeTab() === 'profile') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left 2 Cols: Form -->
          <div class="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 shadow-card space-y-5">
            <h3 class="text-sm font-extrabold text-text-primary border-b border-border pb-3">
              Brand & Contact Details
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-bold text-text-primary mb-1">Brand Name *</label>
                <input
                  type="text"
                  [ngModel]="formBrandName()"
                  (ngModelChange)="formBrandName.set($event)"
                  placeholder="e.g. Apple Food Restaurant"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Cuisine Type</label>
                <input
                  type="text"
                  [ngModel]="formCuisine()"
                  (ngModelChange)="formCuisine.set($event)"
                  placeholder="e.g. Egyptian, Middle Eastern, Casual Dining"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div class="text-xs">
              <label class="block font-bold text-text-primary mb-1">Restaurant Description</label>
              <textarea
                rows="3"
                [ngModel]="formDescription()"
                (ngModelChange)="formDescription.set($event)"
                placeholder="Brief summary of your restaurant concept and specialties..."
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-medium focus:outline-none focus:border-primary transition resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-bold text-text-primary mb-1">Hotline / Order Phone</label>
                <input
                  type="text"
                  [ngModel]="formHotline()"
                  (ngModelChange)="formHotline.set($event)"
                  placeholder="e.g. 19999 or 01000000000"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Tax / VAT Registration Number</label>
                <input
                  type="text"
                  [ngModel]="formTaxNumber()"
                  (ngModelChange)="formTaxNumber.set($event)"
                  placeholder="e.g. EG-849-204-192"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div class="text-xs">
              <label class="block font-bold text-text-primary mb-1">Physical Address</label>
              <input
                type="text"
                [ngModel]="formAddress()"
                (ngModelChange)="formAddress.set($event)"
                placeholder="e.g. 12 El Tahrir Square, Downtown, Cairo"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
              />
            </div>

            <div class="text-xs">
              <label class="block font-bold text-text-primary mb-1">Operating Hours</label>
              <input
                type="text"
                [ngModel]="formOpeningHours()"
                (ngModelChange)="formOpeningHours.set($event)"
                placeholder="e.g. Daily: 11:00 AM - 02:00 AM"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label class="block font-bold text-text-primary mb-1">Brand Logo Image URL</label>
                <input
                  type="url"
                  [ngModel]="formLogoUrl()"
                  (ngModelChange)="formLogoUrl.set($event)"
                  placeholder="https://example.com/logo.png"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Cover Banner Image URL</label>
                <input
                  type="url"
                  [ngModel]="formCoverUrl()"
                  (ngModelChange)="formCoverUrl.set($event)"
                  placeholder="https://example.com/cover.jpg"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div class="pt-4 border-t border-border flex justify-end">
              <button
                type="button"
                (click)="saveProfile()"
                [disabled]="settingsService.isSaving()"
                class="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                @if (settingsService.isSaving()) {
                  <app-icon name="refresh-cw" customClass="w-4 h-4 animate-spin"></app-icon>
                  <span>Saving Changes...</span>
                } @else {
                  <span>Save Restaurant Profile</span>
                }
              </button>
            </div>

          </div>

          <!-- Right 1 Col: Brand Preview & Store Status -->
          <div class="space-y-5">
            
            <!-- Store Open / Closed Switch -->
            <div class="bg-surface rounded-2xl border border-border p-5 shadow-card space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-extrabold text-text-primary">Restaurant Status</h4>
                  <span class="text-[11px] text-text-muted">
                    {{ formIsOpen() ? 'Currently accepting dining & online orders' : 'Kitchen is closed for orders' }}
                  </span>
                </div>

                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="formIsOpen()"
                    (change)="formIsOpen.set(!formIsOpen())"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div
                class="p-3 rounded-xl text-[11px] font-bold flex items-center gap-2 border"
                [ngClass]="formIsOpen() ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'"
              >
                <span class="w-2 h-2 rounded-full" [ngClass]="formIsOpen() ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"></span>
                <span>{{ formIsOpen() ? 'LIVE & OPEN FOR ORDERS' : 'STORE IS CURRENTLY CLOSED' }}</span>
              </div>
            </div>

            <!-- Live Card Preview -->
            <div class="bg-surface rounded-2xl border border-border p-5 shadow-card space-y-4">
              <h4 class="text-xs font-extrabold text-text-primary border-b border-border pb-2">
                Brand Appearance Preview
              </h4>

              <div class="rounded-xl overflow-hidden border border-border bg-surface-container/40">
                <div class="h-24 bg-gradient-to-r from-primary/30 to-amber-500/30 relative">
                  @if (formCoverUrl()) {
                    <img [src]="formCoverUrl()" class="w-full h-full object-cover" />
                  }
                  <div class="absolute -bottom-4 left-4 w-12 h-12 rounded-xl bg-surface border-2 border-surface shadow-md overflow-hidden flex items-center justify-center font-black text-primary">
                    @if (formLogoUrl()) {
                      <img [src]="formLogoUrl()" class="w-full h-full object-cover" />
                    } @else {
                      {{ (formBrandName() || 'R')[0] }}
                    }
                  </div>
                </div>

                <div class="pt-6 p-4 space-y-1">
                  <h4 class="text-xs font-black text-text-primary">{{ formBrandName() || 'Your Restaurant Name' }}</h4>
                  <span class="text-[10px] text-primary font-bold uppercase tracking-wider">{{ formCuisine() || 'Cuisine' }}</span>
                  <p class="text-[10px] text-text-muted line-clamp-2 mt-1">
                    {{ formDescription() || 'No description added yet.' }}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      }

      <!-- ── TAB 2: SYSTEM PREFERENCES (OWNER ONLY) ─────────── -->
      @if (activeTab() === 'preferences' && isOwner()) {
        <div class="max-w-2xl bg-surface rounded-2xl border border-border p-6 shadow-card space-y-6">
          <h3 class="text-sm font-extrabold text-text-primary border-b border-border pb-3">
            System & Localization Preferences
          </h3>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-text-primary mb-1">Operating Currency</label>
              <select
                [ngModel]="formCurrency()"
                (ngModelChange)="formCurrency.set($event)"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-bold focus:outline-none focus:border-primary transition cursor-pointer"
              >
                <option value="EGP">EGP - Egyptian Pound (ج.م)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="SAR">SAR - Saudi Riyal (ر.س)</option>
                <option value="AED">AED - UAE Dirham (د.إ)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Operating Timezone</label>
              <select
                [ngModel]="formTimezone()"
                (ngModelChange)="formTimezone.set($event)"
                class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-semibold focus:outline-none focus:border-primary transition cursor-pointer"
              >
                <option value="Africa/Cairo">Africa/Cairo (GMT+2 / GMT+3)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-text-primary mb-1">Default System Language</label>
              <div class="grid grid-cols-2 gap-2 bg-surface-container p-1 rounded-xl border border-border">
                <button
                  type="button"
                  (click)="formLanguage.set('ar')"
                  [ngClass]="formLanguage() === 'ar' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
                  class="py-2 rounded-lg font-bold transition cursor-pointer"
                >
                  العربية (Arabic)
                </button>
                <button
                  type="button"
                  (click)="formLanguage.set('en')"
                  [ngClass]="formLanguage() === 'en' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text-primary'"
                  class="py-2 rounded-lg font-bold transition cursor-pointer"
                >
                  English (EN)
                </button>
              </div>
            </div>

            <!-- AI Chatbot Settings -->
            <div class="pt-4 border-t border-border space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-extrabold text-text-primary">AI Telegram Assistant Bot</h4>
                  <span class="text-[11px] text-text-muted">Automated ordering & reservation bot for guests</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="formChatbotActive()"
                    (change)="formChatbotActive.set(!formChatbotActive())"
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label class="block font-bold text-text-primary mb-1">Chatbot Closed-Hours Auto-Reply Message</label>
                <input
                  type="text"
                  [ngModel]="formOfflineMsg()"
                  (ngModelChange)="formOfflineMsg.set($event)"
                  placeholder="We are currently closed for orders. Please check back during opening hours!"
                  class="w-full px-3.5 py-2.5 bg-surface-container border border-border rounded-xl text-text-primary font-medium focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

          </div>

          <div class="pt-4 border-t border-border flex justify-end">
            <button
              type="button"
              (click)="savePreferences()"
              [disabled]="settingsService.isSaving()"
              class="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              @if (settingsService.isSaving()) {
                <app-icon name="refresh-cw" customClass="w-4 h-4 animate-spin"></app-icon>
                <span>Saving Preferences...</span>
              } @else {
                <span>Save Preferences</span>
              }
            </button>
          </div>

        </div>
      }

      <!-- ── TAB 3: SUBSCRIPTION INFO (OWNER ONLY) ──────────── -->
      @if (activeTab() === 'subscription' && isOwner()) {
        <div class="max-w-2xl bg-surface rounded-2xl border border-border p-6 shadow-card space-y-6">
          <div class="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 class="text-sm font-extrabold text-text-primary">Subscription License</h3>
              <p class="text-xs text-text-muted">Current SaaS subscription plan and active modules</p>
            </div>
            <span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-black uppercase">
              {{ settingsService.profile()?.status || 'Active' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="p-4 bg-surface-container rounded-xl border border-border">
              <span class="text-text-muted font-bold block mb-1">Current Tier</span>
              <h4 class="text-base font-black text-primary uppercase">
                {{ settingsService.profile()?.subscriptionPlan || 'PRO ENTERPRISE' }}
              </h4>
            </div>

            <div class="p-4 bg-surface-container rounded-xl border border-border">
              <span class="text-text-muted font-bold block mb-1">Renewal Date</span>
              <h4 class="text-sm font-black text-text-primary">
                {{ formatDate(settingsService.profile()?.subscriptionExpiresAt) }}
              </h4>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-text-primary">Included Features:</h4>
            <div class="grid grid-cols-2 gap-2 text-text-muted font-semibold">
              <div class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Unlimited Orders & POS</span>
              </div>
              <div class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Multi-Branch Management</span>
              </div>
              <div class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>Kitchen Display System (KDS)</span>
              </div>
              <div class="flex items-center gap-2">
                <app-icon name="check" customClass="w-4 h-4 text-emerald-500"></app-icon>
                <span>AI Telegram Ordering Bot</span>
              </div>
            </div>
          </div>

        </div>
      }

    </div>
  `,
})
export default class SettingsComponent implements OnInit {
  readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);

  readonly activeTab = signal<'profile' | 'preferences' | 'subscription'>('profile');

  // Form Profile Signals
  readonly formBrandName = signal<string>('');
  readonly formCuisine = signal<string>('');
  readonly formDescription = signal<string>('');
  readonly formHotline = signal<string>('');
  readonly formTaxNumber = signal<string>('');
  readonly formAddress = signal<string>('');
  readonly formOpeningHours = signal<string>('');
  readonly formLogoUrl = signal<string>('');
  readonly formCoverUrl = signal<string>('');
  readonly formIsOpen = signal<boolean>(true);

  // Form Preferences Signals
  readonly formCurrency = signal<string>('EGP');
  readonly formTimezone = signal<string>('Africa/Cairo');
  readonly formLanguage = signal<TenantLanguage>('ar');
  readonly formChatbotActive = signal<boolean>(true);
  readonly formOfflineMsg = signal<string>('');

  readonly isOwner = computed(() => {
    const role = this.authService.userRole();
    return role === 'owner' || role === 'super_admin';
  });

  ngOnInit(): void {
    this.settingsService.fetchProfile();
    // Preload form when profile loads
    const check = setInterval(() => {
      const p = this.settingsService.profile();
      if (p) {
        this.formBrandName.set(p.brandName || p.name || '');
        this.formCuisine.set(p.cuisineType || 'Egyptian');
        this.formDescription.set(p.description || '');
        this.formHotline.set(p.hotlineNumber || p.contact?.phone || '');
        this.formTaxNumber.set(p.taxNumber || '');
        this.formAddress.set(p.address || '');
        this.formOpeningHours.set(p.openingHours || 'Daily: 11:00 AM - 02:00 AM');
        this.formLogoUrl.set(p.logoUrl || '');
        this.formCoverUrl.set(p.coverImageUrl || '');
        this.formIsOpen.set(p.isOpen !== false);

        if (p.settings) {
          this.formCurrency.set(p.settings.currency || 'EGP');
          this.formTimezone.set(p.settings.timezone || 'Africa/Cairo');
          this.formLanguage.set(p.settings.language || 'ar');
        }
        if (p.chatbotSettings) {
          this.formChatbotActive.set(p.isChatbotActive !== false);
          this.formOfflineMsg.set(p.chatbotSettings.offlineMessage || '');
        }
        clearInterval(check);
      }
    }, 100);

    setTimeout(() => clearInterval(check), 3000);
  }

  async saveProfile(): Promise<void> {
    const dto: UpdateProfileDto = {
      brandName: this.formBrandName().trim(),
      cuisineType: this.formCuisine().trim(),
      description: this.formDescription().trim(),
      hotlineNumber: this.formHotline().trim(),
      taxNumber: this.formTaxNumber().trim(),
      address: this.formAddress().trim(),
      openingHours: this.formOpeningHours().trim(),
      logoUrl: this.formLogoUrl().trim(),
      coverImageUrl: this.formCoverUrl().trim(),
      isOpen: this.formIsOpen(),
      isChatbotActive: this.formChatbotActive(),
      chatbotSettings: {
        offlineMessage: this.formOfflineMsg().trim(),
      },
    };

    await this.settingsService.updateProfile(dto);
  }

  async savePreferences(): Promise<void> {
    const dto: UpdateSettingsDto = {
      currency: this.formCurrency(),
      timezone: this.formTimezone(),
      language: this.formLanguage(),
    };

    await this.settingsService.updateSettings(dto);
  }

  formatDate(d?: string): string {
    if (!d) return 'Never (Lifetime)';
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }
}
