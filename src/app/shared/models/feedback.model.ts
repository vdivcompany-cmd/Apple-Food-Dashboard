export interface Feedback {
  _id?: string;
  id?: string;
  tenantId?: string;
  branchId?: string;
  orderId?: string;
  rating: number; // 1 to 5
  comment?: string;
  customerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedbackStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    star5: number;
    star4: number;
    star3: number;
    star2: number;
    star1: number;
  };
}
