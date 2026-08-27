import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
import { LanguageService } from '../../core/i18n/language.service';
import { ThemeService } from '../../core/theme/theme.service';

interface ColorToken {
  name: string;
  nameAr: string;
  hex: string;
  classBg: string;
  classText: string;
  usage: string;
}

@Component({
  selector: 'app-style-guide',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-10 select-none animate-[fadeIn_0.3s_ease-out]">

      <!-- ── HERO / HEADER ────────────────────────────────────── -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-border shadow-xs">
        <div>
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <app-icon name="palette" customClass="w-5 h-5"></app-icon>
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                {{ isArabic() ? 'دليل التصميم والمكونات' : 'Design System & Style Guide' }}
                <span class="text-primary">RestaurantOS</span>
              </h1>
              <p class="text-xs text-text-muted mt-0.5">
                {{ isArabic()
                  ? 'الدليل الشامل للغة البصرية والألوان والخطوط والمكونات عالية الكفاءة'
                  : 'Comprehensive visual language, typography, color tokens, and core UI component showcase.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            v2.0 • Pro-Service
          </span>
          <button
            type="button"
            (click)="copyNotification('Design system specifications copied!')"
            class="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-hover border border-border text-xs font-bold text-text-primary transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <app-icon name="copy" customClass="w-3.5 h-3.5"></app-icon>
            <span>{{ isArabic() ? 'نسخ المواصفات' : 'Copy Tokens' }}</span>
          </button>
        </div>
      </div>

      <!-- ── 1. BRAND & THEME COLOR PALETTE ────────────────────── -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-border pb-2">
          <app-icon name="palette" customClass="w-4 h-4 text-primary"></app-icon>
          <h2 class="text-base font-extrabold text-text-primary tracking-tight">
            {{ isArabic() ? 'لوحة الألوان والهوية' : '1. Brand & Semantic Color Tokens' }}
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Primary Terracotta -->
          <div class="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col gap-3">
            <div class="h-24 rounded-xl bg-primary flex items-end p-3 shadow-inner">
              <span class="text-[11px] font-black text-white bg-black/30 px-2 py-0.5 rounded backdrop-blur-sm">
                Primary Brand
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-text-primary font-medium">Primary Terracotta</span>
                <button (click)="copyToClipboard('#FF6B00')" class="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition">#FF6B00</button>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted">Primary Dark</span>
                <button (click)="copyToClipboard('#A04100')" class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded hover:text-text-primary transition">#A04100</button>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted">Primary Fixed / Glow</span>
                <button (click)="copyToClipboard('#FFDBCC')" class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded hover:text-text-primary transition">#FFDBCC</button>
              </div>
            </div>
          </div>

          <!-- Surface & Background -->
          <div class="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col gap-3">
            <div class="h-24 rounded-xl bg-surface-container border border-border flex items-end p-3 shadow-inner">
              <span class="text-[11px] font-black text-text-primary bg-surface px-2 py-0.5 rounded border border-border backdrop-blur-sm">
                Surface & Canvas
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-text-primary font-medium">App Background (L0)</span>
                <span class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded">#131412 / #FBF9F5</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted">Surface Card (L1)</span>
                <span class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded">#1A1B18 / #FFFFFF</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted">Container High (L2)</span>
                <span class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded">#242622 / #E9E8E4</span>
              </div>
            </div>
          </div>

          <!-- Semantic States -->
          <div class="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col gap-3">
            <div class="h-24 rounded-xl bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 flex items-end p-3 shadow-inner">
              <span class="text-[11px] font-black text-white bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                Status Accents
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-emerald-500 font-bold">Success / Fresh</span>
                <span class="font-mono text-[11px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">#10B981</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-amber-500 font-bold">Warning / Cooking</span>
                <span class="font-mono text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">#F59E0B</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-red-500 font-bold">Critical / Urgent</span>
                <span class="font-mono text-[11px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded">#EF4444</span>
              </div>
            </div>
          </div>

          <!-- Typography & Borders -->
          <div class="bg-surface rounded-2xl border border-border p-4 shadow-xs flex flex-col gap-3">
            <div class="h-24 rounded-xl bg-surface-hover border border-border flex items-end p-3 shadow-inner">
              <span class="text-[11px] font-black text-text-primary bg-surface px-2 py-0.5 rounded border border-border backdrop-blur-sm">
                Text & Outlines
              </span>
            </div>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-text-primary font-medium">Text Primary</span>
                <span class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded">100% Opacity</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted">Text Secondary</span>
                <span class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded">75% Opacity</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted">Border Token</span>
                <span class="font-mono text-[11px] text-text-muted bg-surface-container px-2 py-0.5 rounded">var(--app-border)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 2. TYPOGRAPHY HIERARCHY ──────────────────────────── -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-border pb-2">
          <app-icon name="text-fields" customClass="w-4 h-4 text-primary"></app-icon>
          <h2 class="text-base font-extrabold text-text-primary tracking-tight">
            {{ isArabic() ? 'تدرج الخطوط والنصوص' : '2. Typography Hierarchy (Plus Jakarta Sans & Cairo)' }}
          </h2>
        </div>

        <div class="bg-surface rounded-2xl border border-border p-6 shadow-xs divide-y divide-border/60">
          <!-- Display Large -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 items-baseline">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider">Display Large (32px / 700)</div>
            <div class="md:col-span-3 text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              RestaurantOS Pro-Service Workspace
            </div>
          </div>

          <!-- Headline Medium -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 items-baseline">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider">Headline Medium (24px / 600)</div>
            <div class="md:col-span-3 text-xl sm:text-2xl font-extrabold text-text-primary">
              Live Kitchen Orders & Floor Management
            </div>
          </div>

          <!-- Title Large -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 items-baseline">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider">Title Large (18px / 600)</div>
            <div class="md:col-span-3 text-base sm:text-lg font-bold text-text-primary">
              Table 12 • 4 Guests • Appetizers Served
            </div>
          </div>

          <!-- Body Medium -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 items-baseline">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider">Body Medium (14px / 400)</div>
            <div class="md:col-span-3 text-sm text-text-primary/90 leading-relaxed">
              Standard body text used for high-density tables, description paragraphs, receipts, customer profiles, and interactive modals.
            </div>
          </div>

          <!-- Label Small -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 py-3 items-baseline">
            <div class="text-xs font-bold text-text-muted uppercase tracking-wider">Label Small (11px / 700)</div>
            <div class="md:col-span-3 text-[11px] font-black text-primary tracking-wider uppercase">
              METADATA • STATUS BADGES • TIMESTAMP LABELS
            </div>
          </div>
        </div>
      </section>

      <!-- ── 3. BUTTONS & FORM CONTROLS ───────────────────────── -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-border pb-2">
          <app-icon name="widgets" customClass="w-4 h-4 text-primary"></app-icon>
          <h2 class="text-base font-extrabold text-text-primary tracking-tight">
            {{ isArabic() ? 'الأزرار وعناصر الإدخال' : '3. Interactive Buttons & Form Elements' }}
          </h2>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Button Styles -->
          <div class="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h3 class="text-sm font-extrabold text-text-primary tracking-tight">Button Variants</h3>
            <div class="flex flex-wrap gap-3 items-center">
              <button class="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer">
                Primary Button
              </button>
              <button class="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-hover border border-border text-xs font-bold text-text-primary transition shadow-sm active:scale-95 cursor-pointer">
                Secondary Button
              </button>
              <button class="px-3.5 py-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/10 transition cursor-pointer">
                Ghost Button
              </button>
              <button class="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition cursor-pointer">
                Destructive
              </button>
            </div>
          </div>

          <!-- Form Controls -->
          <div class="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
            <h3 class="text-sm font-extrabold text-text-primary tracking-tight">Form Inputs</h3>
            <div class="space-y-3">
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-text-muted">Standard Input</label>
                <input
                  type="text"
                  placeholder="e.g. Classic Burger..."
                  class="w-full px-3.5 py-2 rounded-xl bg-surface-container border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-text-muted">Search with Icon</label>
                <div class="relative">
                  <app-icon name="search" customClass="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2"></app-icon>
                  <input
                    type="text"
                    placeholder="Search menu, tables, or orders..."
                    class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-container border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 4. COMPLEX RESTAURANT UI COMPONENTS ──────────────── -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 border-b border-border pb-2">
          <app-icon name="chef-hat" customClass="w-4 h-4 text-primary"></app-icon>
          <h2 class="text-base font-extrabold text-text-primary tracking-tight">
            {{ isArabic() ? 'المكونات المتقدمة (KPIs وشاشات المطبخ)' : '4. Complex Restaurant UI Components' }}
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- KPI Metric Card (Stitch Matched) -->
          <div class="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            <div class="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div class="relative z-10 space-y-2">
              <span class="text-[11px] font-extrabold text-text-muted uppercase tracking-wider">Today's Revenue</span>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-black text-text-primary tracking-tight">12,450 EGP</span>
                <span class="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <app-icon name="trending-up" customClass="w-3 h-3"></app-icon> +14.8%
                </span>
              </div>
            </div>
            <div class="relative z-10 pt-3 border-t border-border/60 text-[11px] text-text-muted">
              vs yesterday: <span class="font-bold text-text-primary">10,840 EGP</span>
            </div>
          </div>

          <!-- Status Badge Showcase -->
          <div class="bg-surface rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between space-y-3">
            <span class="text-[11px] font-extrabold text-text-muted uppercase tracking-wider">Status Pills</span>
            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                ● Preparing
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                ✓ Ready for Pickup
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
                ! Rush / Late Order
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-text-muted border border-border">
                Completed / Paid
              </span>
            </div>
          </div>

          <!-- Interactive KDS Ticket Card -->
          <div class="bg-surface rounded-2xl border-l-4 border-primary border-t border-r border-b border-border p-4 shadow-sm space-y-3 hover:-translate-y-0.5 transition duration-200">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-sm font-black text-text-primary tracking-tight">#A-042</span>
                <div class="text-[11px] text-text-muted">Table 12 • Dine In</div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                12m elapsed
              </span>
            </div>

            <div class="pt-2 border-t border-border space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-text-primary">2x Wagyu Truffle Burger</span>
              </div>
              <div class="ps-3 border-s-2 border-primary/40 space-y-0.5 text-[11px]">
                <span class="text-primary font-bold block">• No Pickles</span>
                <span class="text-text-muted block">• Medium Rare</span>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span class="font-bold text-text-primary">1x Parmesan Fries</span>
              </div>
            </div>

            <div class="pt-2 border-t border-border flex justify-end">
              <button class="px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                <app-icon name="check" customClass="w-3.5 h-3.5"></app-icon>
                <span>Mark Ready</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Copy feedback toast -->
      @if (copyMessage()) {
        <div class="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-surface border border-primary/30 shadow-elevated text-xs font-bold text-primary animate-[fadeIn_0.2s_ease-out] flex items-center gap-2 backdrop-blur-md">
          <app-icon name="check-circle" customClass="w-4 h-4 text-primary"></app-icon>
          <span>{{ copyMessage() }}</span>
        </div>
      }

    </div>
  `
})
export default class StyleGuideComponent {
  private readonly langService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);

  readonly isArabic = computed(() => this.langService.currentLanguage() === 'ar');
  readonly copyMessage = signal<string>('');

  copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.copyNotification('Copied ' + text + ' to clipboard!');
    }
  }

  copyNotification(msg: string): void {
    this.copyMessage.set(msg);
    setTimeout(() => {
      this.copyMessage.set('');
    }, 2500);
  }
}
