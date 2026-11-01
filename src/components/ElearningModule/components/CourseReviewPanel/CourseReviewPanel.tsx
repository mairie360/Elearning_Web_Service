"use client";

import { DataState, Skeleton, Toast } from "@mairie360/lib-components/primitives";

import { useEffect, useRef, useState } from 'react';
import { pendingLearnerPort, validateReview } from '@/features/elearning/learnerFeatures';
import type { LearnerFeaturePort, ReviewDraft, WrittenReview } from '@/features/elearning/learnerFeatures';

export function CourseReviewPanel({ courseId, completed, draft, onDraftChange, port = pendingLearnerPort }: {
  courseId: string; completed: boolean; draft: ReviewDraft; onDraftChange: (value: ReviewDraft) => void; port?: LearnerFeaturePort;
}) {
  const [reviews, setReviews] = useState<WrittenReview[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const alive = useRef(true);
  const confirmedWrites = useRef(0);
  const [readState, setReadState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  useEffect(() => {
    alive.current = true; const controller = new AbortController();
    const readRevision = confirmedWrites.current; setReadState(port.listReviews ? 'loading' : 'unavailable');
    if (port.listReviews) void port.listReviews(courseId, controller.signal).then(next => {
      if (controller.signal.aborted || readRevision !== confirmedWrites.current) return;
      if (!Array.isArray(next) || next.some(review => !review?.id || !review.author || validateReview(review))) throw new Error('Les avis reçus sont incohérents.');
      setReviews(next); setReadState('ready');
    }).catch(reason => { if (!controller.signal.aborted && readRevision === confirmedWrites.current) { setReadState('unavailable'); setError(reason instanceof Error ? reason.message : 'Les avis n’ont pas pu être chargés.'); } });
    return () => { alive.current = false; controller.abort(); };
  }, [courseId, port]);

  return <section className="mt-5 rounded border border-[#d8d2ca] bg-white p-4" aria-label="Avis écrits sur la formation">
    <h3 className="font-semibold">Avis des participants</h3>
    {readState === 'loading' ? <Skeleton label="Chargement des avis…" className="mt-3 !h-24" /> : readState === 'unavailable' ? <p className="mt-2 text-sm">Les avis écrits ne sont pas encore disponibles.</p> : reviews.length ? <ul className="mt-3 space-y-3">{reviews.map(review => <li key={review.id} className="border-b pb-3 [overflow-wrap:anywhere]"><strong>{review.author} · {review.rating}/5</strong><p className="whitespace-pre-wrap">{review.comment}</p></li>)}</ul> : <DataState state="empty" size="s" title="Aucun avis à afficher." description={null} className="mt-3" />}
    <form className="mt-4 space-y-3" onSubmit={async event => {
      event.preventDefault(); if (pending.current || !completed) return; setError(''); setStatus('');
      const invalid = validateReview(draft); if (invalid) { setError(invalid); return; }
      if (!port.saveReview) { setError('La publication des avis écrits n’est pas encore disponible. Votre brouillon est conservé ; aucun avis n’a été publié.'); return; }
      pending.current = true; setBusy(true);
      try {
        const confirmed = await port.saveReview(courseId, draft);
        if (!alive.current) return;
        if (!confirmed?.id || !confirmed.author || !confirmed.updatedAt || validateReview(confirmed) || confirmed.rating !== draft.rating || confirmed.comment.trim() !== draft.comment.trim()) throw new Error('L’avis publié n’a pas été confirmé. Votre brouillon est conservé.');
        confirmedWrites.current += 1; setReadState('ready');
        setReviews(current => [...current.filter(review => review.id !== confirmed.id),confirmed]);
        onDraftChange({ rating: confirmed.rating, comment: confirmed.comment }); setStatus('Votre avis a été enregistré.');
      } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : 'L’avis n’a pas pu être publié. Votre brouillon est conservé.'); }
      finally { pending.current = false; if (alive.current) setBusy(false); }
    }}>
      <h4 className="font-semibold">Votre avis</h4>{!completed ? <p className="text-sm">Terminez la formation pour publier votre avis.</p> : null}
      <label className="block">Note<select className="mt-1 block w-full rounded border p-2" value={draft.rating} disabled={busy || !completed} onChange={event => onDraftChange({ ...draft,rating: Number(event.target.value) })}>{[1,2,3,4,5].map(value => <option value={value} key={value}>{value}/5</option>)}</select></label>
      <label className="block">Avis écrit<textarea className="mt-1 block w-full rounded border p-2" rows={4} maxLength={5000} value={draft.comment} disabled={busy || !completed} onChange={event => onDraftChange({ ...draft,comment: event.target.value })} /></label>
      <p className="text-xs">Brouillon conservé pendant cette visite, séparément de la note numérique.</p><button type="submit" className="rounded border px-3 py-2 disabled:opacity-50" disabled={busy || !completed}>{busy ? 'Publication…' : 'Publier mon avis'}</button>
    </form>{error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}{status ? <Toast message={status} variant="success" className="mt-3" onClose={() => setStatus('')} /> : null}
  </section>;
}
