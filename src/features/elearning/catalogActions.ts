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
  async function handleFailure(error: unknown, report: (message: string) => void) {
    if (error instanceof BffRequestError && error.status === 401) {
      await onUnauthorized();
      return;
    }

    report(getErrorMessage(error));
  }

  async function loadCatalog() {
    view.setLoading(true);
    view.setError(null);

    try {
      const response = await getCatalog({ cache: "no-store" });
      view.setCatalogResponse(() => response);
    } catch (error) {
      await handleFailure(error, view.setError);
    } finally {
      view.setLoading(false);
    }
  }

  async function mutateThenReload(mutation: () => Promise<unknown>) {
    view.setMutationError(null);

    try {
      await mutation();
      await loadCatalog();
    } catch (error) {
      await handleFailure(error, view.setMutationError);
    }
  }

  async function startCatalogCourse(courseId: string) {
    view.setMutationError(null);

    try {
      const { course } = await startCourse(courseId);
      view.setCatalogResponse((current) => replaceCatalogCourse(current, course));
    } catch (error) {
      await handleFailure(error, view.setMutationError);
    }
  }

  return {
    loadCatalog,
    startCourse: startCatalogCourse,
    completeContent: (
      courseId: string,
      chapterId: string,
      contentId: string,
      completed = true,
    ) =>
      mutateThenReload(() =>
        completeCourseContent(courseId, contentId, { chapterId, completed }),
      ),
    rateCourse: (courseId: string, rating: number) =>
      mutateThenReload(() => rateCourse(courseId, rating)),
    createCourse: (course: CatalogCourseInput) =>
      mutateThenReload(() => createCourse(toContractCourse(course))),
    updateCourse: (course: CatalogCourseInput) =>
      mutateThenReload(() => updateCourse(toContractCourse(course))),
    deleteCourse: (courseId: string) =>
      mutateThenReload(() => deleteCourse(courseId)),
  };
}

export type CatalogActions = ReturnType<typeof createCatalogActions>;
