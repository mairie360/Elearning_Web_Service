// Frontend ports; the published BFF DTOs and operations stay untouched.
export interface WrittenReview { id: string; author: string; rating: number; comment: string; updatedAt: string }
export interface ReviewDraft { rating: number; comment: string }
export interface LearnerFeaturePort {
  listReviews?: (courseId: string, signal: AbortSignal) => Promise<WrittenReview[]>;
  saveReview?: (courseId: string, draft: ReviewDraft) => Promise<WrittenReview>;
  downloadResource?: (courseId: string, contentId: string, signal: AbortSignal) => Promise<{ blob: Blob; fileName: string }>;
  canCompleteResource?: (courseId: string, contentId: string) => boolean;
}
export const pendingLearnerPort: LearnerFeaturePort = {};

export function validateReview(draft: ReviewDraft) {
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5) return 'Choisissez une note de 1 à 5.';
  if (!draft.comment.trim() || draft.comment.length > 5000) return 'Écrivez un avis de 1 à 5 000 caractères.';
  return '';
}

export async function prepareResourceDownload(port: LearnerFeaturePort, courseId: string, contentId: string, signal: AbortSignal) {
  if (!port.downloadResource) throw new Error('Le téléchargement sécurisé de ce support n’est pas encore disponible. Votre progression reste inchangée.');
  const received = await port.downloadResource(courseId, contentId, signal);
  if (signal.aborted) throw new Error('Le téléchargement a été annulé.');
  if (!received || !(received.blob instanceof Blob) || !received.blob.size || !received.fileName?.trim()) throw new Error('Le support reçu est vide ou incomplet. Réessayez.');
  return received;
}
