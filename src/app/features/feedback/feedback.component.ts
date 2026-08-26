import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';
﻿import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
          <app-icon name="star" customClass="w-6 h-6 text-amber-500"></app-icon>
          <span>Customer Reviews & Feedback</span>
        </h1>
        <p class="text-xs text-text-muted mt-0.5">Guest ratings, food quality scores, and waiter service reviews</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (review of reviews(); track review.id) {
          <div class="p-5 rounded-lg bg-surface border border-border shadow-card flex flex-col justify-between hover:border-[#FF6B00]/40 transition">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="font-bold text-sm text-text-primary">{{ review.author }}</span>
                <span class="text-amber-500 font-bold text-xs">{{ review.rating }}</span>
              </div>
              <p class="text-xs text-text-secondary italic">"{{ review.comment }}"</p>
            </div>
            <div class="mt-4 text-[11px] text-text-muted font-medium">
              {{ review.dish }} • {{ review.date }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export default class FeedbackComponent {
  readonly reviews = signal([
    { id: '1', author: 'Eng. Ahmed R.', rating: '★★★★★ 5.0', comment: 'The Double Bacon Smash burger was incredible! Quick service.', dish: 'Double Bacon Smash', date: 'Yesterday' },
    { id: '2', author: 'Salma T.', rating: '★★★★☆ 4.0', comment: 'Loved the atmosphere, truffle fries were super fresh.', dish: 'Truffle Parmesan Fries', date: '2 days ago' },
  ]);
}

