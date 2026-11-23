import { leaveForLogin, LOGIN_UNAVAILABLE_TITLE } from "./session-expiry";
import { BffRequestError } from "../../lib/bff-client";
import {
  downloadCourseCertificate,
  downloadYearCertificates,
  getAdminStats,
  getTrainingTime,
  sendReminders,
  type AdminStatsResponse,
  type DownloadedFile,
  type TrainingTimeResponse,
} from "../../lib/elearning-api";

// E-learning V2 reads and actions beside the catalogue (MAIR-1144, MAIR-1149, MAIR-1150): the training time and the
// attestations of the agent, the indicators and reminders of the administrator. DOM-free so that
// tests/elearning.bff-mocks.test.cjs runs them against the contract mock; ElearningModule only wires React setters.

export type InsightState = 'loading' | 'default' | 'unavailable';
export type LateAgent = AdminStatsResponse['lateAgents'][number];

export interface InsightView {
  setTrainingTime?: (value: TrainingTimeResponse | undefined, state: InsightState) => void;
  setAdminStats?: (value: AdminStatsResponse | undefined, state: InsightState) => void;
  /** One outcome, shown once as a toast. */
  report: (tone: 'success' | 'danger' | 'info', title: string, message?: string) => void;
}

/** Saves a file of the BFF on the agent's device (a temporary link in the browser). */
export type SaveFile = (file: DownloadedFile) => void;

const UNAVAILABLE = 'Le service de formation n’a pas répondu. Réessayez dans quelques instants.';

function failureMessage(error: unknown) {
  return error instanceof BffRequestError ? error.message : UNAVAILABLE;
}

/** « 1 relance envoyée », « 3 relances envoyées ». */
export const remindersSentLabel = (sent: number) => `${sent} relance${sent > 1 ? 's' : ''} envoyée${sent > 1 ? 's' : ''}`;

/** The late agents grouped by course, in the order of the list: one reminder request per course. */
export function remindersByCourse(agents: LateAgent[]) {
  const groups = new Map<string, string[]>();
  for (const agent of agents) {
    const users = groups.get(agent.courseId) ?? [];
    if (!users.includes(agent.userId)) users.push(agent.userId);
    groups.set(agent.courseId, users);
  }
  return [...groups].map(([courseId, userIds]) => ({ courseId, userIds }));
}

export function createInsightActions(
  view: InsightView,
  save: SaveFile,
  onUnauthorized: () => Promise<void> = leaveForLogin((message) => view.report('danger', LOGIN_UNAVAILABLE_TITLE, message)),
) {
  let trainingRevision = 0;
  let statsRevision = 0;
  let reminding: Promise<boolean> | null = null;
  const downloads = new Map<string, Promise<boolean>>();

  async function unauthorized(error: unknown) {
    if (error instanceof BffRequestError && error.status === 401) {
      await onUnauthorized();
      return true;
    }
    return false;
  }

  async function loadTrainingTime(year: number) {
    const revision = ++trainingRevision;
    view.setTrainingTime?.(undefined, 'loading');
    try {
      const response = await getTrainingTime(year, { cache: 'no-store' });
      if (revision === trainingRevision) view.setTrainingTime?.(response, 'default');
    } catch (error) {
      if (await unauthorized(error)) return;
      if (revision === trainingRevision) view.setTrainingTime?.(undefined, 'unavailable');
    }
  }

  async function loadAdminStats() {
    const revision = ++statsRevision;
    view.setAdminStats?.(undefined, 'loading');
    try {
      const response = await getAdminStats({ cache: 'no-store' });
      if (revision === statsRevision) view.setAdminStats?.(response, 'default');
    } catch (error) {
      if (await unauthorized(error)) return;
      if (revision === statsRevision) view.setAdminStats?.(undefined, 'unavailable');
    }
  }

  /** One download per key at a time: a second click shares the pending one. */
  function once(key: string, run: () => Promise<boolean>) {
    const pending = downloads.get(key);
    if (pending) return pending;
    const result = run().finally(() => downloads.delete(key));
    downloads.set(key, result);
    return result;
  }

  return {
    loadTrainingTime,
    loadAdminStats,
    /** « Télécharger mes attestations » (MAIR-1144): every attestation of `year` in one PDF. */
    downloadYearCertificates: (year: number) => once(`year:${year}`, async () => {
      try {
        save(await downloadYearCertificates(year));
        view.report('success', 'Attestations téléchargées', `Vos attestations ${year} sont enregistrées sur votre appareil.`);
        return true;
      } catch (error) {
        if (await unauthorized(error)) return false;
        if (error instanceof BffRequestError && error.status === 404) {
          view.report('info', 'Aucune attestation pour cette année', `Vous n’avez terminé aucune formation en ${year}.`);
        } else {
          view.report('danger', 'Téléchargement impossible', failureMessage(error));
        }
        return false;
      }
    }),
    /** « Télécharger l’attestation » of the end screen (MAIR-1149). */
    downloadCourseCertificate: (courseId: string) => once(`course:${courseId}`, async () => {
      try {
        save(await downloadCourseCertificate(courseId));
        view.report('success', 'Attestation téléchargée', 'Votre attestation est enregistrée sur votre appareil.');
        return true;
      } catch (error) {
        if (await unauthorized(error)) return false;
        const message = error instanceof BffRequestError && error.status === 409
          ? 'L’attestation sera disponible une fois la formation terminée.'
          : failureMessage(error);
        view.report('danger', 'Téléchargement impossible', message);
        return false;
      }
    }),
    /**
     * « Relancer les n agents » (MAIR-1150): one request per course concerned, then the indicators are read again.
     * A refused course stops nothing: the toast says how many reminders went out.
     */
    remindLateAgents: (agents: LateAgent[]) => {
      if (reminding) return reminding;
      reminding = (async () => {
        const groups = remindersByCourse(agents);
        if (!groups.length) return false;
        const results = await Promise.allSettled(groups.map(({ courseId, userIds }) => sendReminders(courseId, userIds)));
        const sent = results.reduce((total, result) => total + (result.status === 'fulfilled' ? result.value.sent : 0), 0);
        const failures = results.flatMap(result => (result.status === 'rejected' ? [result.reason as unknown] : []));
        const denied = failures.find(failure => failure instanceof BffRequestError && failure.status === 401);
        if (denied && await unauthorized(denied)) return false;
        if (failures.length === results.length) {
          view.report('danger', 'Relances non envoyées', failureMessage(failures[0]));
          return false;
        }
        if (failures.length) {
          view.report('danger', 'Relances incomplètes', `${remindersSentLabel(sent)} ; ${failures.length} formation${failures.length > 1 ? 's n’ont' : ' n’a'} pas pu être relancée${failures.length > 1 ? 's' : ''}.`);
        } else {
          view.report('success', 'Relances envoyées', `${remindersSentLabel(sent)} aux agents en retard.`);
        }
        await loadAdminStats();
        return failures.length === 0;
      })().finally(() => { reminding = null; });
      return reminding;
    },
  };
}

export type InsightActions = ReturnType<typeof createInsightActions>;
