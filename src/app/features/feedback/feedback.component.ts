import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from './feedback.service';
import { Feedback } from '../../shared/models/feedback.model';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  template: `
    <div class="space-y-6 select-none animate-[fadeIn_0.3s_ease-out]">
      
      <!-- ── HEADER ─────────────────────────────────────────── -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
            Guest Reviews & Feedback
          </h1>
          <p class="text-xs text-text-muted mt-0.5">
            Monitor customer satisfaction, ratings, and guest dining experiences
          </p>
        </div>

        <button
          type="button"
          (click)="feedbackService.fetchFeedback()"
          [disabled]="feedbackService.isLoading()"
          class="p-2.5 rounded-xl border border-border bg-surface-container hover:bg-surface-hover text-text-muted hover:text-text-primary transition cursor-pointer self-start sm:self-auto"
          title="Refresh reviews"
        >
          <app-icon name="refresh-cw" [customClass]="feedbackService.isLoading() ? 'w-4 h-4 animate-spin' : 'w-4 h-4'"></app-icon>
        </button>
      </div>

      <!-- ── RATING METRICS & BREAKDOWN CARD ────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-surface rounded-2xl border border-border p-6 shadow-card">
        
        <!-- Left: Big Score (4 cols) -->
        <div class="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-surface-container/40 rounded-2xl border border-border/80 text-center space-y-2">
          <span class="text-xs font-extrabold text-text-muted uppercase tracking-wider">Overall Guest Score</span>
          <h2 class="text-4xl sm:text-5xl font-black text-amber-500 font-mono tracking-tight">
            {{ feedbackService.stats().averageRating }}
          </h2>
          <div class="flex items-center gap-1 text-amber-400">
            @for (star of [1, 2, 3, 4, 5]; track star) {
              <app-icon
                name="star"
                [customClass]="star <= Math.round(feedbackService.stats().averageRating) ? 'w-4 h-4 fill-amber-400' : 'w-4 h-4 opacity-30'"
              ></app-icon>
            }
          </div>
          <span class="text-xs font-bold text-text-muted pt-1">
            Based on {{ feedbackService.stats().totalReviews }} verified guest reviews
          </span>
        </div>

        <!-- Right: 5-Tier Breakdown Bars (8 cols) -->
        <div class="lg:col-span-8 flex flex-col justify-center space-y-2.5 text-xs">
          
          <!-- 5 Stars -->
          <div class="flex items-center gap-3">
            <span class="w-12 font-bold text-text-muted text-[11px]">5 Stars</span>
            <div class="flex-1 bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                class="bg-amber-400 h-full rounded-full transition-all duration-500"
                [style.width.%]="getStarPercent(feedbackService.stats().distribution.star5)"
              ></div>
            </div>
            <span class="w-8 text-right font-mono font-bold text-text-primary text-[11px]">
              {{ feedbackService.stats().distribution.star5 }}
            </span>
          </div>

          <!-- 4 Stars -->
          <div class="flex items-center gap-3">
            <span class="w-12 font-bold text-text-muted text-[11px]">4 Stars</span>
            <div class="flex-1 bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                class="bg-amber-400/80 h-full rounded-full transition-all duration-500"
                [style.width.%]="getStarPercent(feedbackService.stats().distribution.star4)"
              ></div>
            </div>
            <span class="w-8 text-right font-mono font-bold text-text-primary text-[11px]">
              {{ feedbackService.stats().distribution.star4 }}
            </span>
          </div>

          <!-- 3 Stars -->
          <div class="flex items-center gap-3">
            <span class="w-12 font-bold text-text-muted text-[11px]">3 Stars</span>
            <div class="flex-1 bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                class="bg-amber-400/60 h-full rounded-full transition-all duration-500"
                [style.width.%]="getStarPercent(feedbackService.stats().distribution.star3)"
              ></div>
            </div>
            <span class="w-8 text-right font-mono font-bold text-text-primary text-[11px]">
              {{ feedbackService.stats().distribution.star3 }}
            </span>
          </div>

          <!-- 2 Stars -->
          <div class="flex items-center gap-3">
            <span class="w-12 font-bold text-text-muted text-[11px]">2 Stars</span>
            <div class="flex-1 bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                class="bg-amber-400/40 h-full rounded-full transition-all duration-500"
                [style.width.%]="getStarPercent(feedbackService.stats().distribution.star2)"
              ></div>
            </div>
            <span class="w-8 text-right font-mono font-bold text-text-primary text-[11px]">
              {{ feedbackService.stats().distribution.star2 }}
            </span>
          </div>

          <!-- 1 Star -->
          <div class="flex items-center gap-3">
            <span class="w-12 font-bold text-text-muted text-[11px]">1 Star</span>
            <div class="flex-1 bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                class="bg-red-400 h-full rounded-full transition-all duration-500"
                [style.width.%]="getStarPercent(feedbackService.stats().distribution.star1)"
              ></div>
            </div>
            <span class="w-8 text-right font-mono font-bold text-text-primary text-[11px]">
              {{ feedbackService.stats().distribution.star1 }}
            </span>
          </div>

        </div>

      </div>

      <!-- ── FILTERS & REVIEWS FEED ─────────────────────────── -->
      <div class="space-y-4">
        
        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="selectedRatingFilter.set(0)"
              [ngClass]="selectedRatingFilter() === 0 ? 'bg-primary text-white shadow-xs' : 'bg-surface border border-border text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              All Reviews
            </button>
            <button
              type="button"
              (click)="selectedRatingFilter.set(5)"
              [ngClass]="selectedRatingFilter() === 5 ? 'bg-amber-500 text-white shadow-xs' : 'bg-surface border border-border text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <span>5★ Excellent</span>
            </button>
            <button
              type="button"
              (click)="selectedRatingFilter.set(4)"
              [ngClass]="selectedRatingFilter() === 4 ? 'bg-amber-500 text-white shadow-xs' : 'bg-surface border border-border text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <span>4★ Good</span>
            </button>
            <button
              type="button"
              (click)="selectedRatingFilter.set(1)"
              [ngClass]="selectedRatingFilter() === 1 ? 'bg-red-500 text-white shadow-xs' : 'bg-surface border border-border text-text-muted hover:text-text-primary'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <span>≤ 3★ Needs Attention</span>
            </button>
          </div>

          <div class="relative min-w-[240px]">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search comments..."
              class="w-full pl-9 pr-3.5 py-1.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary transition"
            />
            <app-icon name="search" customClass="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2"></app-icon>
          </div>
        </div>

        <!-- Feed List -->
        @if (feedbackService.isLoading()) {
          <div class="p-16 flex flex-col items-center justify-center gap-2 bg-surface rounded-2xl border border-border">
            <app-icon name="refresh-cw" customClass="w-6 h-6 text-primary animate-spin"></app-icon>
            <span class="text-xs font-bold text-text-muted">Loading guest comments...</span>
          </div>
        } @else if (filteredFeedbacks().length === 0) {
          <div class="p-12 text-center bg-surface rounded-2xl border border-dashed border-border space-y-2">
            <app-icon name="star" customClass="w-8 h-8 text-text-muted mx-auto"></app-icon>
            <h4 class="text-xs font-extrabold text-text-primary">No Reviews Matching Filter</h4>
            <p class="text-[11px] text-text-muted">Try resetting your rating or search filter.</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (f of filteredFeedbacks(); track f._id || f.id) {
              <div class="bg-surface rounded-2xl border border-border p-5 shadow-card hover:border-primary/40 transition space-y-3">
                
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-surface-container border border-border flex items-center justify-center font-black text-xs text-text-primary shadow-xs">
                      {{ getInitials(f.customerName) }}
                    </div>
                    <div>
                      <h4 class="text-xs font-extrabold text-text-primary">{{ f.customerName || 'Anonymous Guest' }}</h4>
                      <span class="text-[10px] text-text-muted">{{ formatDate(f.createdAt) }}</span>
                    </div>
                  </div>

                  <!-- Star Rating Pill -->
                  <div class="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 font-black text-xs">
                    <app-icon name="star" customClass="w-3.5 h-3.5 fill-amber-400"></app-icon>
                    <span>{{ f.rating }}.0</span>
                  </div>
                </div>

                <!-- Comment Content -->
                @if (f.comment) {
                  <p class="text-xs text-text-secondary leading-relaxed bg-surface-container/50 p-3 rounded-xl border border-border/60 italic">
                    "{{ f.comment }}"
                  </p>
                } @else {
                  <p class="text-xs text-text-muted italic">
                    (Guest left star rating without written comment)
                  </p>
                }

              </div>
            }
          </div>
        }

      </div>

    </div>
  `,
})
export default class FeedbackComponent implements OnInit {
  readonly feedbackService = inject(FeedbackService);
  protected readonly Math = Math;

  readonly selectedRatingFilter = signal<number>(0);
  readonly searchQuery = signal<string>('');

  readonly filteredFeedbacks = computed(() => {
    const list = this.feedbackService.feedbacks();
    const rating = this.selectedRatingFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return list.filter((f) => {
      const matchRating =
        rating === 0
          ? true
          : rating === 5
          ? f.rating === 5
          : rating === 4
          ? f.rating === 4
          : f.rating <= 3;

      const matchQuery =
        !query ||
        (f.customerName && f.customerName.toLowerCase().includes(query)) ||
        (f.comment && f.comment.toLowerCase().includes(query));

      return matchRating && matchQuery;
    });
  });

  ngOnInit(): void {
    this.feedbackService.fetchFeedback();
  }

  getStarPercent(count: number): number {
    const total = this.feedbackService.stats().totalReviews;
    if (!total) return 0;
    return Math.round((count / total) * 100);
  }

  getInitials(name?: string): string {
    if (!name) return 'G';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
