import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../core/api/api.config';
import { Feedback, FeedbackStats } from '../../shared/models/feedback.model';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly http = inject(HttpClient);

  readonly feedbacks = signal<Feedback[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly stats = computed<FeedbackStats>(() => {
    const list = this.feedbacks();
    if (list.length === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 },
      };
    }

    let sum = 0;
    const distribution = { star5: 0, star4: 0, star3: 0, star2: 0, star1: 0 };

    for (const f of list) {
      const r = Math.max(1, Math.min(5, Math.round(f.rating || 5)));
      sum += f.rating || 5;
      if (r === 5) distribution.star5++;
      else if (r === 4) distribution.star4++;
      else if (r === 3) distribution.star3++;
      else if (r === 2) distribution.star2++;
      else distribution.star1++;
    }

    const avg = Number((sum / list.length).toFixed(1));
    return {
      averageRating: avg,
      totalReviews: list.length,
      distribution,
    };
  });

  fetchFeedback(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ success: boolean; data: any }>(API_ENDPOINTS.feedback.list).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const mapped: Feedback[] = data.map((f: any) => ({
          _id: f._id || f.id,
          id: f._id || f.id,
          tenantId: f.tenantId,
          branchId: f.branchId,
          orderId: f.orderId,
          rating: Number(f.rating) || 5,
          comment: f.comment || '',
          customerName: f.customerName || 'Anonymous Guest',
          createdAt: f.createdAt || new Date().toISOString(),
        }));
        this.feedbacks.set(mapped);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('FeedbackService.fetchFeedback error:', err);
        this.error.set(err?.error?.message || 'Failed to load guest feedback');
      },
    });
  }
}
