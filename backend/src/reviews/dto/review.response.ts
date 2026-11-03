export class ReviewDto {
  id: string;
  rating: number;
  authorName: string;
  company: string | null;
  comment: string;
  createdAt: Date;
}

export class ReviewListDto {
  items: ReviewDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  ratingAvg: number | null;
  ratingCount: number;
  /** Number of reviews per star, index 0 = 1 star … index 4 = 5 stars. */
  distribution: number[];
}
