"use client";

import { Body, Button, Card, DataState, ErrorText, Help, Rating, SectionTitle, Skeleton, TextArea, Toast } from "@mairie360/lib-components/primitives";

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

  // MAIR-928: the written reviews in a lib Card, the note on the lib Rating, no colour of its own.
  return <Card aria-label="Avis écrits sur la formation" className="flex flex-col gap-3">
    <SectionTitle as="h3">Avis des participants</SectionTitle>
    {readState === 'loading' ? <Skeleton label="Chargement des avis…" className="!h-24" /> : readState === 'unavailable' ? <Body>Les avis écrits ne sont pas encore disponibles.</Body> : reviews.length ? <ul className="flex flex-col gap-3">{reviews.map(review => <li key={review.id} className="border-b border-[var(--mairie-border)] pb-3 [overflow-wrap:anywhere]"><strong>{review.author} · {review.rating}/5</strong><p className="whitespace-pre-wrap">{review.comment}</p></li>)}</ul> : <DataState state="empty" size="s" title="Aucun avis à afficher." description={null} />}
    <form className="flex flex-col gap-3" onSubmit={async event => {
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
      <SectionTitle as="h4">Votre avis</SectionTitle>{!completed ? <Body>Terminez la formation pour publier votre avis.</Body> : null}
      <Rating label="Note" value={draft.rating} disabled={busy || !completed} onChange={value => onDraftChange({ ...draft, rating: value })} />
      <TextArea label="Avis écrit" rows={4} maxLength={5000} value={draft.comment} disabled={busy || !completed} onChange={event => onDraftChange({ ...draft, comment: event.target.value })} />
      <Help>Brouillon conservé pendant cette visite, séparément de la note numérique.</Help>
      <div><Button type="submit" label={busy ? 'Publication…' : 'Publier mon avis'} loading={busy} disabled={busy || !completed} /></div>
    </form>{error ? <ErrorText role="alert">{error}</ErrorText> : null}{status ? <Toast message={status} variant="success" onClose={() => setStatus('')} /> : null}
  </Card>;
}
