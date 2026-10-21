import type { ElearningCourseRatingDistribution, ElearningCourseRatingSummary, ElearningCourseRatingValue } from './types';

const ratingValues = [1, 2, 3, 4, 5] as const;

export const getElearningRatingCount = (ratingDistribution?: ElearningCourseRatingDistribution) =>
  ratingValues.reduce((total, ratingValue) => total + Math.max(0, ratingDistribution?.[ratingValue] ?? 0), 0);

export const getElearningRatingAverage = (ratingDistribution?: ElearningCourseRatingDistribution) => {
  const ratingCount = getElearningRatingCount(ratingDistribution);
  if (ratingCount === 0) return undefined;

  const weightedTotal = ratingValues.reduce(
    (total, ratingValue) => total + ratingValue * Math.max(0, ratingDistribution?.[ratingValue] ?? 0),
    0
  );

  return Math.round((weightedTotal / ratingCount) * 10) / 10;
};

/** "4" or "4.5"; text ratings are kept as they are. */
export const formatElearningRating = (rating: number | string) => {
  if (typeof rating === 'string') return rating;

  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
};

/** "(3 notes)" once there are votes, else the label supplied by the caller. */
export const getRatingLabel = (ratingCount: number, fallbackLabel?: string) => {
  if (ratingCount === 0) return fallbackLabel;

  return `(${ratingCount} note${ratingCount > 1 ? 's' : ''})`;
};

export const incrementElearningRatingDistribution = (
  ratingDistribution: ElearningCourseRatingDistribution | undefined,
  rating: number
): ElearningCourseRatingSummary => {
  const safeRating = Math.min(5, Math.max(1, Math.round(rating))) as ElearningCourseRatingValue;
  const nextRatingDistribution = ratingValues.reduce<Required<ElearningCourseRatingDistribution>>(
    (distribution, ratingValue) => ({
      ...distribution,
      [ratingValue]: Math.max(0, ratingDistribution?.[ratingValue] ?? 0),
    }),
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

  nextRatingDistribution[safeRating] += 1;

  return {
    rating: getElearningRatingAverage(nextRatingDistribution) ?? safeRating,
    ratingCount: getElearningRatingCount(nextRatingDistribution),
    ratingDistribution: nextRatingDistribution,
  };
};
