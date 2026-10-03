import { logout } from "../../lib/auth-session";
import { BffRequestError } from "../../lib/bff-client";
import {
  completeCourseContent,
  createCourse,
  deleteCourse,
  getCatalog,
  rateCourse,
  startCourse,
  updateCourse,
  type ElearningCatalogResponse,
  type ElearningCourse,
} from "../../lib/elearning-api";

// Actions du catalogue, séparées de ElearningModule.tsx pour être testées sans DOM
// (tests/elearning.bff-mocks.test.cjs). Le composant ne fait que brancher ses setters React.

export type CatalogView = {
  setCatalogResponse: (
    update: (current: ElearningCatalogResponse | null) => ElearningCatalogResponse | null,
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  setMutationError: (message: string | null) => void;
};

/** Cours tel que produit par le formulaire de lib-components (`statusValue` y est une chaîne libre). */
export type CatalogCourseInput = Omit<ElearningCourse, "statusValue"> & { statusValue?: string };

const COURSE_STATUSES: ReadonlyArray<NonNullable<ElearningCourse["statusValue"]>> = [
  "not-started",
  "in-progress",
  "completed",
];

function isCourseStatus(value: string | undefined): value is ElearningCourse["statusValue"] {
  return COURSE_STATUSES.some((status) => status === value);
}

/** Aligne un cours du formulaire sur le contrat : un statut hors enum n'est pas envoyé (champ optionnel). */
export function toContractCourse({ statusValue, ...course }: CatalogCourseInput): ElearningCourse {
  return isCourseStatus(statusValue) ? { ...course, statusValue } : course;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof BffRequestError) return error.message;
  return "Une erreur inattendue est survenue.";
}

export function replaceCatalogCourse(
  current: ElearningCatalogResponse | null,
  course: ElearningCourse,
): ElearningCatalogResponse | null {
  if (!current) return current;

  return {
    ...current,
    catalog: {
      ...current.catalog,
      courses: current.catalog.courses.map((currentCourse) =>
        currentCourse.id === course.id ? course : currentCourse,
      ),
    },
  };
}

export function createCatalogActions(
  view: CatalogView,
  onUnauthorized: () => Promise<void> = logout,
) {
  let catalogRevision = 0;
  let pendingLearner: { key: string; result: Promise<boolean> } | null = null;
  const pendingDeletions = new Map<string, Promise<boolean>>();

  // Share an identical in-flight result, including its catalogue refresh. React
  // has not necessarily disabled a button before another click is dispatched.
  function runLearnerAction(key: string, run: () => Promise<boolean>) {
    if (pendingLearner) {
      return pendingLearner.key === key ? pendingLearner.result : Promise.resolve(false);
    }
    const result = Promise.resolve().then(run).finally(() => { pendingLearner = null; });
    pendingLearner = { key, result };
    return result;
  }

  function updateConfirmedCatalogCourses(update: (courses: ElearningCourse[]) => ElearningCourse[]) {
    catalogRevision += 1;
    view.setLoading(false);
    view.setCatalogResponse((current) => current ? {
      ...current,
      catalog: {
        ...current.catalog,
        courses: update(current.catalog.courses),
      },
    } : current);
  }

  function updateConfirmedCourse(courseId: string, update: (course: ElearningCourse) => ElearningCourse) {
    updateConfirmedCatalogCourses((courses) =>
      courses.map((course) => course.id === courseId ? update(course) : course),
    );
  }

  async function handleFailure(error: unknown, report: (message: string) => void) {
    if (error instanceof BffRequestError && error.status === 401) {
      await onUnauthorized();
      return;
    }

    report(getErrorMessage(error));
  }

  async function loadCatalog() {
    const revision = ++catalogRevision;
    view.setLoading(true);

    try {
      const response = await getCatalog({ cache: "no-store" });
      if (revision === catalogRevision) {
        view.setCatalogResponse(() => response);
        view.setError(null);
      }
    } catch (error) {
      // Session rejection must still leave the page, even for a superseded request.
      if (revision === catalogRevision || (error instanceof BffRequestError && error.status === 401)) {
        await handleFailure(error, view.setError);
      }
    } finally {
      if (revision === catalogRevision) view.setLoading(false);
    }
  }

  async function mutateThenReload(mutation: () => Promise<unknown>) {
    view.setMutationError(null);

    try {
      await mutation();
      await loadCatalog();
      // loadCatalog reports refresh failures separately. The mutation has already
      // been confirmed, so a retained form must not resend it on a refresh retry.
      return true;
    } catch (error) {
      await handleFailure(error, view.setMutationError);
      return false;
    }
  }

  async function startCatalogCourse(courseId: string) {
    view.setMutationError(null);

    try {
      const { course } = await startCourse(courseId);
      // A catalogue request started before this confirmed mutation is now stale.
      catalogRevision += 1;
      view.setLoading(false);
      view.setCatalogResponse((current) => replaceCatalogCourse(current, course));
      // Start returns only the confirmed course, not the official statistics.
      // Retain it even if this GET fails; retry must never repeat the start POST.
      await loadCatalog();
      return true;
    } catch (error) {
      await handleFailure(error, view.setMutationError);
      return false;
    }
  }

  return {
    loadCatalog,
    startCourse: (courseId: string) =>
      runLearnerAction(`start:${courseId}`, () => startCatalogCourse(courseId)),
    completeContent: (
      courseId: string,
      chapterId: string,
      contentId: string,
      completed = true,
    ) =>
      runLearnerAction(`complete:${JSON.stringify([courseId, chapterId, contentId, completed])}`, () =>
        mutateThenReload(async () => {
          const response = await completeCourseContent(courseId, contentId, { chapterId, completed });
          updateConfirmedCourse(courseId, (course) => ({
            ...course,
            progress: response.progress,
            ...(course.details ? { details: {
              ...course.details,
              progress: response.progress,
              completed: response.completed,
              chapters: response.chapters,
            } } : {}),
          }));
        }),
      ),
    rateCourse: (courseId: string, rating: number) =>
      runLearnerAction(`rating:${JSON.stringify([courseId, rating])}`, () =>
        mutateThenReload(async () => {
          const response = await rateCourse(courseId, rating);
          updateConfirmedCourse(courseId, (course) => ({
            ...course,
            rating: response.rating,
            ratingDistribution: response.ratingDistribution,
            ...(course.details ? { details: {
              ...course.details,
              rating: response.rating,
              ratingDistribution: response.ratingDistribution,
              completionRating: {
                ...course.details.completionRating,
                submitted: response.submitted,
                initialValue: rating,
              },
            } } : {}),
          }));
        }),
      ),
    createCourse: (course: CatalogCourseInput) =>
      mutateThenReload(async () => {
        const response = await createCourse(toContractCourse(course));
        // Keep server-confirmed data, never the submitted draft or invented counters.
        updateConfirmedCatalogCourses((courses) =>
          courses.some((current) => current.id === response.course.id)
            ? courses.map((current) => current.id === response.course.id ? response.course : current)
            : [...courses, response.course],
        );
      }),
    updateCourse: (course: CatalogCourseInput) =>
      mutateThenReload(async () => {
        const response = await updateCourse(toContractCourse(course));
        updateConfirmedCourse(response.course.id, () => response.course);
      }),
    deleteCourse: (courseId: string) => {
      const pending = pendingDeletions.get(courseId);
      if (pending) return pending;
      // Keep this flight through its refresh: repeated clicks must not replay a
      // destructive request while its confirmation is still being consumed.
      const result = Promise.resolve().then(() => mutateThenReload(async () => {
        const response = await deleteCourse(courseId);
        if (!response.deleted || response.courseId !== courseId) {
          throw new Error("Course deletion was not confirmed.");
        }
        updateConfirmedCatalogCourses((courses) => courses.filter((course) => course.id !== courseId));
      })).finally(() => { pendingDeletions.delete(courseId); });
      pendingDeletions.set(courseId, result);
      return result;
    },
  };
}

export type CatalogActions = ReturnType<typeof createCatalogActions>;
