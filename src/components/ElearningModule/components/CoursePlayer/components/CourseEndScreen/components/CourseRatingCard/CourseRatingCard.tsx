import React from 'react';
import { Body, Button, Card, ErrorText, Rating } from '@mairie360/lib-components/primitives';

import type { ElearningLearnerActionResult } from '../../../../../ElearningCatalog';

export interface CourseRatingCardProps {
  /** The note the agent already gave, confirmed by the service. */
  initialValue?: number;
  submitted?: boolean;
  onSubmit: (rating: number) => ElearningLearnerActionResult;
}

/**
 * MAIR-928 / MAIR-1149: « Notez cette formation » on the lib Rating. « Envoyer la note » stays disabled until a star is
 * chosen and spins while sending; a refusal keeps the choice so the agent can send it again.
 */
export const CourseRatingCard = ({ initialValue, submitted = false, onSubmit }: CourseRatingCardProps) => {
  const [value, setValue] = React.useState(initialValue ?? 0);
  const [confirmed, setConfirmed] = React.useState<number | undefined>(submitted ? initialValue : undefined);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  const send = async () => {
    if (!value || sending) return;
    setSending(true);
    setError('');
    try {
      const result = await onSubmit(value);
      if (result === false) setError('La note n’a pas été enregistrée. Votre choix est conservé ; réessayez.');
      else setConfirmed(value);
    } catch {
      setError('La note n’a pas été enregistrée. Votre choix est conservé ; réessayez.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card title="Notez cette formation" className="flex flex-col gap-3">
      {confirmed ? (
        <Body role="status">Merci pour votre avis · Votre note : {confirmed}/5</Body>
      ) : (
        <>
          <Rating label="Note de la formation" value={value} onChange={setValue} disabled={sending} />
          {error ? <ErrorText role="alert">{error}</ErrorText> : null}
          <div><Button label="Envoyer la note" disabled={!value} loading={sending} onClick={() => void send()} /></div>
        </>
      )}
    </Card>
  );
};
