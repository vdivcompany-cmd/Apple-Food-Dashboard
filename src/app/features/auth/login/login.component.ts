import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <!-- Top-level Canvas (Exact Stitch Design) -->
    <main class="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-surface transition-colors duration-200">
      
      <!-- Inner Canvas Container (Stitch: bg-surface-container-low with rounded edges) -->
      <div class="flex flex-col w-full h-full min-h-[calc(100vh-48px)] bg-surface-container items-center justify-center p-4 sm:p-8 rounded-3xl relative overflow-hidden border border-border/40">
        
        <!-- Top Controls: Language & Theme Quick Toggles -->
        <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
          <!-- Language Toggle -->
          <button
            type="button"
            (click)="toggleLanguage()"
            class="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-surface hover:bg-surface-hover border border-border text-xs font-semibold text-text-primary transition shadow-sm cursor-pointer"
            [title]="isArabic() ? 'Switch to English' : 'التبديل إلى العربية'"
          >
            <app-icon name="globe" customClass="w-3.5 h-3.5 text-primary"></app-icon>
            <span>{{ isArabic() ? 'English' : 'عربي' }}</span>
          </button>

          <!-- Theme Toggle -->
          <button
            type="button"
            (click)="toggleTheme()"
            class="w-9 h-9 rounded-xl bg-surface hover:bg-surface-hover border border-border flex items-center justify-center text-text-primary transition shadow-sm cursor-pointer"
            [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            @if (isDark()) {
              <app-icon name="sun" customClass="w-4 h-4 text-amber-400"></app-icon>
            } @else {
              <app-icon name="moon" customClass="w-4 h-4 text-primary"></app-icon>
            }
          </button>
        </div>

        <!-- Stitch SVG Background Pattern with Pulsing Gradients -->
        <div class="absolute inset-0 pointer-events-none opacity-40">
          <svg class="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--app-surface-hover)" stop-opacity="0.8"></stop>
                <stop offset="100%" stop-color="var(--app-surface)" stop-opacity="0"></stop>
              </linearGradient>
              <pattern id="stitch-grid" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M 4 0 L 0 0 0 4" fill="none" stroke="var(--app-border)" stroke-width="0.5"></path>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#stitch-grid)" opacity="0.35"></rect>
            <circle cx="20" cy="80" r="40" fill="url(#grid-grad)" class="animate-pulse" style="animation-duration: 8s;"></circle>
            <circle cx="80" cy="20" r="30" fill="url(#grid-grad)" class="animate-pulse" style="animation-duration: 12s; animation-delay: 2s;"></circle>
          </svg>
        </div>

        <!-- Stitch Login Center Column -->
        <div class="w-full max-w-[440px] z-10 animate-[fadeInUp_0.6s_ease-out]">
          
          <!-- Logo & Brand Header -->
          <div class="flex flex-col items-center mb-8">
            <div class="w-20 h-20 mb-4 bg-surface rounded-2xl shadow-lg p-2 flex items-center justify-center transition-transform hover:scale-105 duration-300 border border-border/50">
              <img
                src="restaurant-os-logo.png"
                alt="RestaurantOS Logo"
                class="w-full h-full object-contain rounded-xl"
                (error)="onLogoError($event)"
              />
            </div>
            <h1 class="text-[32px] font-bold text-text-primary mb-2 tracking-tight leading-tight">
              Restaurant<span class="text-primary">OS</span>
            </h1>
            <p class="text-[14px] text-text-muted text-center max-w-[280px] leading-normal">
              {{ isArabic() ? 'التميز التشغيلي يبدأ من هنا.' : 'Operational excellence starts here.' }}
            </p>
          </div>

          <!-- Stitch Card Form -->
          <form
            (ngSubmit)="onLogin()"
            class="bg-surface p-8 rounded-2xl shadow-[0px_4px_20px_rgba(27,28,26,0.04)] dark:shadow-[0px_4px_20px_rgba(0,0,0,0.4)] border border-border flex flex-col gap-5 relative"
          >
            <!-- Ambient blurred orb in top right of card -->
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

            <!-- Server / Validation Error Alert -->
            @if (errorMessage()) {
              <div class="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold flex items-center gap-2.5 border border-danger/25 animate-[shake_0.4s_ease-in-out]">
                <app-icon name="alert-triangle" customClass="w-4 h-4 flex-shrink-0"></app-icon>
                <span class="flex-1">{{ errorMessage() }}</span>
              </div>
            }

            <!-- 1. Restaurant Slug (Tenant Identifier) Field -->
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between items-center pl-1">
                <label class="text-[12px] font-semibold text-text-primary uppercase tracking-wider" for="tenantSlug">
                  {{ isArabic() ? 'معرّف المطعم (Restaurant Slug)' : 'Restaurant Slug' }}
                </label>
                <span class="text-[11px] text-text-muted font-medium">e.g. apple-food</span>
              </div>
              <div class="relative group">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[20px]">
                  <app-icon name="store" customClass="w-4 h-4"></app-icon>
                </span>
                <input
                  id="tenantSlug"
                  type="text"
                  [(ngModel)]="tenantSlug"
                  name="tenantSlug"
                  required
                  placeholder="apple-food"
                  autocomplete="organization"
                  class="w-full h-12 bg-surface text-[14px] text-text-primary pl-11 pr-4 rounded-lg outline-none transition-all duration-200 border-2 border-transparent focus:border-primary/20 focus:bg-surface focus:shadow-[0_0_0_2px_rgba(255,107,0,0.1)] hover:bg-surface-hover placeholder:text-text-muted/50 font-mono text-xs"
                />
              </div>
            </div>

            <!-- 2. Work Email Field -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[12px] font-semibold text-text-primary uppercase tracking-wider pl-1" for="email">
                {{ isArabic() ? 'البريد الإلكتروني للموظف' : 'Staff Email' }}
              </label>
              <div class="relative group">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[20px]">
                  <app-icon name="mail" customClass="w-4 h-4"></app-icon>
                </span>
                <input
                  id="email"
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="owner@apple.eg"
                  autocomplete="username"
                  class="w-full h-12 bg-surface text-[14px] text-text-primary pl-11 pr-4 rounded-lg outline-none transition-all duration-200 border-2 border-transparent focus:border-primary/20 focus:bg-surface focus:shadow-[0_0_0_2px_rgba(255,107,0,0.1)] hover:bg-surface-hover placeholder:text-text-muted/50"
                />
              </div>
            </div>

            <!-- 3. Password Field -->
            <div class="flex flex-col gap-1.5">
              <div class="flex justify-between items-center pl-1">
                <label class="text-[12px] font-semibold text-text-primary uppercase tracking-wider" for="password">
                  {{ isArabic() ? 'كلمة المرور' : 'Password' }}
                </label>
                <button
                  type="button"
                  (click)="showForgotPassword = !showForgotPassword"
                  class="text-[12px] font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer"
                >
                  {{ isArabic() ? 'نسيت؟' : 'Forgot?' }}
                </button>
              </div>

              <div class="relative group">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors text-[20px]">
                  <app-icon name="lock" customClass="w-4 h-4"></app-icon>
                </span>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="w-full h-12 bg-surface text-[14px] text-text-primary pl-11 pr-11 rounded-lg outline-none transition-all duration-200 border-2 border-transparent focus:border-primary/20 focus:bg-surface focus:shadow-[0_0_0_2px_rgba(255,107,0,0.1)] hover:bg-surface-hover placeholder:text-text-muted/50"
                />
                <button
                  type="button"
                  (click)="togglePasswordVisibility()"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
                  [title]="showPassword() ? 'Hide password' : 'Show password'"
                >
                  <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" customClass="w-4 h-4"></app-icon>
                </button>
              </div>
            </div>

            @if (showForgotPassword) {
              <div class="p-3 rounded-xl bg-surface-container text-xs text-text-muted border border-border text-center leading-relaxed animate-[fadeIn_0.2s_ease-out]">
                {{ isArabic() ? 'يرجى التواصل مع مسؤول النظام أو مالك المطعم لإعادة تعيين بيانات الاعتماد الخاصة بك.' : 'Contact your Restaurant Administrator or Owner to reset your staff credentials.' }}
              </div>
            }

            <!-- Stitch Shimmer Submit Button -->
            <button
              type="submit"
              [disabled]="isLoading()"
              class="group relative w-full h-12 bg-primary text-white rounded-lg text-[16px] font-semibold overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              @if (isLoading()) {
                <span class="relative z-10 flex items-center justify-center gap-2">
                  <span class="animate-spin text-base">⏳</span>
                  <span>{{ isArabic() ? 'جاري التحقق...' : 'Authenticating...' }}</span>
                </span>
              } @else {
                <span class="relative z-10 flex items-center justify-center gap-2">
                  {{ isArabic() ? 'تسجيل الدخول' : 'Sign In' }}
                  <app-icon name="arrow-right" customClass="w-5 h-5 transition-transform group-hover:translate-x-1"></app-icon>
                </span>
                <!-- Shimmer Light Sweep -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              }
            </button>

            <!-- Auto-detected Permissions Note -->
            <div class="text-center">
              <p class="text-[12px] text-text-muted flex items-center justify-center gap-1.5">
                <app-icon name="shield-check" customClass="w-4 h-4 text-primary"></app-icon>
                <span>{{ isArabic() ? 'يتم اكتشاف الصلاحيات تلقائيًا بعد المصادقة.' : 'Role & permissions auto-detected after authentication.' }}</span>
              </p>
            </div>
          </form>

          <!-- Stitch Footer Links -->
          <div class="mt-8 flex justify-center gap-4 text-[12px] text-text-muted/80 font-medium">
            <a href="#" class="hover:text-text-primary transition-colors">{{ isArabic() ? 'المساعدة' : 'Help' }}</a>
            <span>•</span>
            <a href="#" class="hover:text-text-primary transition-colors">{{ isArabic() ? 'الخصوصية' : 'Privacy' }}</a>
            <span>•</span>
            <a href="#" class="hover:text-text-primary transition-colors">{{ isArabic() ? 'الشروط' : 'Terms' }}</a>
          </div>

        </div>

      </div>
    </main>
  `,
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export default class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly langService = inject(LanguageService);

  tenantSlug = 'apple-food';
  email = '';
  password = '';
  errorMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);
  showForgotPassword = false;

  readonly isLoading = this.authService.isLoading;
  readonly isDark = computed(() => this.themeService.theme() === 'dark');
  readonly isArabic = computed(() => this.langService.currentLanguage() === 'ar');

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleLanguage(): void {
    this.langService.toggleLanguage();
  }

  onLogoError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhKQJd2Ge9xscWEoGZ7iS7ETYy6R1pLhUVsuTsMxcS1SoV-kAcQIcpA6Xy74J8BNhiqin2fBuZHSKlNAJf2bVXIiP2LP5g4DwtkUggMo84iq61OypUoQwn35qUnZzJliQI5_5Wlifa9tkXRHrO1qeELWO9uvh6djNer5ia_nR5BRAtf1hUtNygHWwjRABH4Y9Xt50vHFRfAg5cFbNJjruCoWp833phXsvEkwYhikLLha1VtivuK7liAQ';
    }
  }

  onLogin(): void {
    if (!this.tenantSlug.trim()) {
      this.errorMessage.set(
        this.isArabic()
          ? 'يرجى إدخال معرّف المطعم (Restaurant Slug)'
          : 'Please enter your restaurant slug (e.g. apple-food)'
      );
      return;
    }

    if (!this.email.trim() || !this.password) {
      this.errorMessage.set(
        this.isArabic()
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter both work email and password'
      );
      return;
    }

    this.errorMessage.set(null);
    this.authService.login(this.email, this.password, this.tenantSlug).subscribe({
      next: () => {
        // Redirection handled automatically by authService based on role
      },
      error: (err) => {
        console.error('Backend login failed:', err);
        const serverMsg =
          err?.error?.message ||
          err?.message ||
          (this.isArabic()
            ? 'فشل تسجيل الدخول. يرجى التحقق من معرّف المطعم وبيانات الاعتماد.'
            : 'Login failed. Please verify your restaurant slug and credentials.');
        this.errorMessage.set(serverMsg);
      },
    });
  }
}
