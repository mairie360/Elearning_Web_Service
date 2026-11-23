import { getContentFile } from '../../lib/elearning-api';

// Frontend ports; the published BFF DTOs and operations stay untouched.
export interface WrittenReview { id: string; author: string; rating: number; comment: string; updatedAt: string }
export interface ReviewDraft { rating: number; comment: string }
/** A stored file of a course (video, PDF, document, audio), as the course screen addresses it. */
export interface ResourceTarget { courseId: string; chapterId: string; contentId: string }
export interface LearnerFeaturePort {
  listReviews?: (courseId: string, signal: AbortSignal) => Promise<WrittenReview[]>;
  saveReview?: (courseId: string, draft: ReviewDraft) => Promise<WrittenReview>;
  /** MAIR-817: where to open a stored file (a signed URL valid a few minutes, asked for at every opening). */
  downloadResource?: (target: ResourceTarget, signal: AbortSignal) => Promise<{ url: string }>;
  canCompleteResource?: (courseId: string, contentId: string) => boolean;
}
export const pendingLearnerPort: LearnerFeaturePort = {};

/** What the pinned BFF serves: the signed URL of a stored file (`GET …/contents/{contentId}/file`). */
export const elearningLearnerPort: LearnerFeaturePort = {
  downloadResource: ({ courseId, chapterId, contentId }, signal) => getContentFile(courseId, chapterId, contentId, { signal }),
};

export function validateReview(draft: ReviewDraft) {
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) return 'Choisissez une note de 1 à 5.';
  if (!draft.comment.trim() || draft.comment.length > 5000) return 'Écrivez un avis de 1 à 5 000 caractères.';
  return '';
}

/** Only an absolute `https:` address (the signed URL of the storage) is opened. */
function secureUrl(value: unknown) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f\s]/.test(value)) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export async function prepareResourceDownload(port: LearnerFeaturePort, target: ResourceTarget, signal: AbortSignal) {
  if (!port.downloadResource) throw new Error('L’ouverture sécurisée de ce support n’est pas disponible. Votre progression reste inchangée.');
  const received = await port.downloadResource(target, signal);
  if (signal.aborted) throw new Error('L’ouverture du support a été annulée.');
  const url = secureUrl(received?.url);
  if (!url) throw new Error('L’adresse reçue pour ce support n’est pas sûre. Réessayez.');
  return { url };
}
