import { navigateToLogin } from "../../lib/auth-session";
import { BffRequestError } from "../../lib/bff-client";
import {
  enrolLearners,
  getCourseLearners,
  getEnrolableAgents,
  removeLearner,
  type AgentIdentity,
  type CourseLearner,
} from "../../lib/elearning-api";

// MAIR-817: only an administrator enrols agents in a course. The « Agents inscrits » drawer of a course lists its
// learners, enrols agents picked among the others and unenrols a learner. DOM-free so that
// tests/elearning.bff-mocks.test.cjs runs it against the contract mock; the drawer only keeps React state.

export type { AgentIdentity, CourseLearner };

/** Learners read per page, and agents offered per page of the picker. */
export const LEARNERS_PAGE = 50;
export const AGENTS_PAGE = 20;

export interface Page<T> {
  items: T[];
  /** Offset of the next page, `null` after the last one. */
  nextOffset: number | null;
}

export interface LearnersPage extends Page<CourseLearner> {
  total: number;
}

export type EnrolmentReport = (tone: 'success' | 'danger' | 'info', title: string, message?: string) => void;

const UNAVAILABLE = 'Le service de formation n’a pas répondu. Réessayez dans quelques instants.';

function failureMessage(error: unknown) {
  return error instanceof BffRequestError ? error.message : UNAVAILABLE;
}

/** « 1 agent inscrit », « 3 agents inscrits ». */
export const agentsCountLabel = (count: number, participle: string) => `${count} agent${count > 1 ? 's' : ''} ${participle}${count > 1 ? 's' : ''}`;

/** « Marie Martin », or the name the BFF gives when the parts are empty. */
export const agentName = (agent: { firstName: string; lastName: string; name: string }) => `${agent.firstName} ${agent.lastName}`.trim() || agent.name;

/** The outcome of an enrolment in one sentence: who was enrolled, who was already, who could not be. */
export function enrolmentSummary(outcome: { enrolled: string[]; alreadyEnrolled: string[]; failed: string[] }) {
  return [
    outcome.enrolled.length ? agentsCountLabel(outcome.enrolled.length, 'inscrit') : '',
    outcome.alreadyEnrolled.length ? `${agentsCountLabel(outcome.alreadyEnrolled.length, 'déjà inscrit')}` : '',
    outcome.failed.length ? `${outcome.failed.length} inscription${outcome.failed.length > 1 ? 's' : ''} impossible${outcome.failed.length > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(' ; ');
}

/** Adds a page to what is shown, an agent appearing twice (the list moved meanwhile) kept once. */
export function appendPage<T extends { userId: string }>(shown: T[], page: T[]) {
  const seen = new Set(shown.map((item) => item.userId));
  return [...shown, ...page.filter((item) => !seen.has(item.userId))];
}

export function createEnrolmentActions(
  report: EnrolmentReport,
  onUnauthorized: () => Promise<void> = async () => { navigateToLogin(); },
) {
  const unauthorized = async (error: unknown) => {
    if (!(error instanceof BffRequestError) || error.status !== 401) return false;
    await onUnauthorized();
    return true;
  };
  const isAbort = (error: unknown) => error instanceof Error && error.name === 'AbortError';
  const pending = new Map<string, Promise<boolean>>();
  const once = (key: string, run: () => Promise<boolean>) => {
    const current = pending.get(key);
    if (current) return current;
    const next = run().finally(() => { pending.delete(key); });
    pending.set(key, next);
    return next;
  };

  return {
    /** One page of the learners of the course; `null` when it could not be read (the drawer says so, no toast). */
    loadLearners: async (courseId: string, offset = 0, init?: RequestInit): Promise<LearnersPage | null> => {
      try {
        const page = await getCourseLearners(courseId, { limit: LEARNERS_PAGE, offset }, init);
        return { items: page.learners, total: page.total, nextOffset: page.nextOffset };
      } catch (error) {
        if (isAbort(error)) throw error;
        await unauthorized(error);
        return null;
      }
    },
    /** The agents not enrolled in the course whose name or e-mail contains `search`; `null` when unreadable. */
    searchAgents: async (courseId: string, search: string, offset = 0, init?: RequestInit): Promise<Page<AgentIdentity> | null> => {
      try {
        const page = await getEnrolableAgents({ search, limit: AGENTS_PAGE, offset, excludeCourseId: courseId }, init);
        return { items: page.agents, nextOffset: page.nextOffset };
      } catch (error) {
        if (isAbort(error)) throw error;
        await unauthorized(error);
        return null;
      }
    },
    /** « Inscrire » the picked agents; `true` when every one of them is now a learner. */
    enrol: (courseId: string, userIds: string[]) => once(`enrol:${courseId}`, async () => {
      if (!userIds.length) return false;
      try {
        const outcome = await enrolLearners(courseId, userIds);
        const summary = enrolmentSummary(outcome);
        if (outcome.failed.length && !outcome.enrolled.length && !outcome.alreadyEnrolled.length) {
          report('danger', 'Inscription impossible', 'Aucun des agents choisis n’a pu être inscrit. Réessayez dans quelques instants.');
          return false;
        }
        if (outcome.failed.length) {
          report('danger', 'Inscription incomplète', `${summary}.`);
          return false;
        }
        report('success', 'Agents inscrits', `${summary}.`);
        return true;
      } catch (error) {
        if (await unauthorized(error)) return false;
        const message = error instanceof BffRequestError && error.status === 404 ? 'Cette formation n’existe plus.' : failureMessage(error);
        report('danger', 'Inscription impossible', message);
        return false;
      }
    }),
    /** « Désinscrire » a learner; a learner already gone counts as done (the list is read again anyway). */
    remove: (courseId: string, learner: { userId: string; firstName: string; lastName: string; name: string }) => once(`remove:${courseId}:${learner.userId}`, async () => {
      try {
        await removeLearner(courseId, learner.userId);
        report('success', 'Agent désinscrit', `${agentName(learner)} ne suit plus cette formation.`);
        return true;
      } catch (error) {
        if (await unauthorized(error)) return false;
        if (error instanceof BffRequestError && error.status === 404) {
          report('info', 'Déjà désinscrit', `${agentName(learner)} ne suivait plus cette formation.`);
          return true;
        }
        report('danger', 'Désinscription impossible', failureMessage(error));
        return false;
      }
    }),
  };
}

export type EnrolmentActions = ReturnType<typeof createEnrolmentActions>;
