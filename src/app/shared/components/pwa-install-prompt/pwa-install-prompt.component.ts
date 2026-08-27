import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '../app-icon/app-icon.component';
import { LanguageService } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    @if (canInstall() && !isDismissed()) {
      <div
        class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-surface border border-primary/30 shadow-elevated animate-[fadeIn_0.3s_ease-out] flex items-center justify-between gap-3 backdrop-blur-md"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <app-icon name="download" customClass="w-5 h-5"></app-icon>
          </div>
          <div class="min-w-0">
            <div class="text-xs font-black text-text-primary tracking-tight truncate">
              {{ isArabic() ? 'تثبيت تطبيق RestaurantOS' : 'Install RestaurantOS App' }}
            </div>
            <div class="text-[11px] text-text-muted truncate">
              {{ isArabic() ? 'تثبيت على جهازك للعمل بدون إنترنت وسرعة أكبر' : 'Fast standalone access & offline support' }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            (click)="installApp()"
            class="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
          >
            {{ isArabic() ? 'تثبيت' : 'Install' }}
          </button>
          <button
            type="button"
            (click)="dismissPrompt()"
            class="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container flex items-center justify-center transition cursor-pointer"
            title="Dismiss"
          >
            <app-icon name="x" customClass="w-3.5 h-3.5"></app-icon>
          </button>
        </div>
      </div>
    }
  `
})
export class PwaInstallPromptComponent implements OnInit {
  private readonly langService = inject(LanguageService);
  
  readonly isArabic = computed(() => this.langService.currentLanguage() === 'ar');
  readonly canInstall = signal<boolean>(false);
  readonly isDismissed = signal<boolean>(false);
  
  private deferredPrompt: any = null;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('restaurant_os_pwa_dismissed');
      if (dismissed === 'true') {
        this.isDismissed.set(true);
      }

      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.canInstall.set(true);
      });

      window.addEventListener('appinstalled', () => {
        this.canInstall.set(false);
        this.deferredPrompt = null;
      });
    }
  }

  async installApp(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.canInstall.set(false);
      }
      this.deferredPrompt = null;
    }
  }

  dismissPrompt(): void {
    this.isDismissed.set(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('restaurant_os_pwa_dismissed', 'true');
    }
  }
}
