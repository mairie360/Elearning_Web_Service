"use client";
import { subscribePageReturn } from "@/lib/page-return";

import { AccessibleShell } from "@mairie360/lib-components/shell";

import {
  ElearningCatalog,
} from "@/components/elearning";
import { Skeleton, Toast } from "@mairie360/lib-components/primitives";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { logout, navigateToLogin } from "@/lib/auth-session";
import type { ElearningCatalogResponse } from "@/lib/elearning-api";
import { courseIdFromSearch, urlWithoutCourse } from "@/lib/course-query";
import { parseFrontUrl } from "@/lib/front-url";
import { frontUrl } from "@/lib/front-urls";
import { settingsProfileUrl } from "@/lib/settings-profile";
import { CourseReviewPanel } from "./CourseReviewPanel";
import { pendingLearnerPort, prepareResourceDownload } from "./learnerFeatures";
import type { LearnerFeaturePort, ReviewDraft } from "./learnerFeatures";
import { createCatalogActions } from "./catalogActions";
import { CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE, COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE, pinnedBffCapabilities } from "./bffCapabilities";
import type { CatalogCapabilities } from "./bffCapabilities";
import { withCategoryReset, withStatusReset } from "./catalogFilters";
import { usePageUrlState } from '@/lib/use-page-url-state';
import { parseCatalogResponse, type InitialCatalog } from '@/lib/catalog-response';
import { catalogUrlSchema } from './catalogQuery';

type CatalogProps = ComponentProps<typeof ElearningCatalog>;
type CatalogCourse = CatalogProps["courses"][number];
type ContentCompletePayload = Parameters<
  NonNullable<CatalogProps["onCourseContentComplete"]>
>[1];

function withChapterDurations(courses: ElearningCatalogResponse["catalog"]["courses"]): CatalogCourse[] {
  return courses.map((course) =>
    course.details
      ? {
          ...course,
          details: {
            ...course.details,
            chapters: course.details.chapters.map((chapter) => ({ ...chapter, duration: chapter.duration ?? "" })),
          },
        }
      : course,
  ) as CatalogCourse[];
}

export function ElearningModule({
  learnerPort = pendingLearnerPort,
  capabilities = pinnedBffCapabilities,
  initialState,
  initialSearch,
}: { learnerPort?: LearnerFeaturePort; capabilities?: CatalogCapabilities; initialState?: InitialCatalog; initialSearch?: string } = {}) {
  const [initial] = useState(() => {
    if (!initialState?.data) return initialState;
    try { return { ...initialState, data: parseCatalogResponse(initialState.data) }; }
    catch { return { data: null, error: 'Les données des formations reçues sont incohérentes. Réessayez.', status: 502 }; }
  });
  const pageUrl = usePageUrlState(catalogUrlSchema, initialSearch ?? (initial === undefined ? undefined : ''));
  const [historyRevision, setHistoryRevision] = useState(0);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const downloadRef = useRef<AbortController | null>(null);
  useEffect(() => () => downloadRef.current?.abort(), []);
  const [catalogResponse, setCatalogResponse] =
    useState<ElearningCatalogResponse | null>(() => initial?.data ?? null);
  const [loading, setLoading] = useState(initial === undefined);
  const [error, setError] = useState<string | null>(() => initial?.error ?? null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const [requestedCourseId, setRequestedCourseId] = useState<string | null>(() => courseIdFromSearch(initialSearch ?? ''));

  const [logoutError, setLogoutError] = useState("");
  const logoutPending = useRef(false);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try { await logout(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier."); }
    finally { logoutPending.current = false; }
  };

  const actions = useMemo(
    () =>
      createCatalogActions({
        setCatalogResponse,
        setLoading,
        setError,
        setMutationError,
        setMutationSuccess,
      }),
    [],
  );

  useEffect(() => {
    if (initial === undefined) void actions.loadCatalog();
  }, [actions, initial]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const page = document;
    const refresh = () => { if (!page.hidden && !loading) void actions.loadCatalog(); };
    const unsubscribe = subscribePageReturn(refresh);
    return () => unsubscribe();
  }, [actions, loading]);

  useEffect(() => {
    const browserWindow = window;
    const syncRequestedCourse = () =>
      setRequestedCourseId(courseIdFromSearch(browserWindow.location.search));
    const receiveHistory = () => { syncRequestedCourse(); setHistoryRevision(revision => revision + 1); };

    syncRequestedCourse();
    browserWindow.addEventListener("popstate", receiveHistory);
    return () => browserWindow.removeEventListener("popstate", receiveHistory);
  }, []);

  const clearRequestedCourse = () => {
    const nextUrl = urlWithoutCourse(window.location.href);
    if (nextUrl) window.history.replaceState(window.history.state, "", nextUrl);
    downloadRef.current?.abort();
    setRequestedCourseId(null);
  };

  const handleContentComplete = (
    course: CatalogCourse,
    payload: ContentCompletePayload,
  ) => {
    const completed = payload.content.completed ?? true;
    // The E-learning API cannot mark a chapter as not completed (the BFF answers 501): refuse here, without a call.
    if (!completed && !capabilities.contentUncompletion) {
      setMutationError(CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE);
      return false;
    }
    return actions.completeContent(course.id, payload.chapter.id, payload.content.id, completed);
  };

  const catalog = catalogResponse?.catalog;
  // The dev BFF contract no longer requires `chapters[].duration` (the E-learning API has none), while the published
  // library still types it as a string: present an empty duration rather than failing the type check or the reader.
  const catalogCourses = useMemo(() => (catalog ? withChapterDurations(catalog.courses) : []), [catalog]);
  const categoryOptions = withCategoryReset(catalog?.categories) ?? [
    { value: 'all', label: 'Toutes les catégories' },
    ...Array.from(new Set(catalogCourses.map(course => course.category).filter((value): value is string => Boolean(value)))).map(value => ({ value, label: value })),
  ];
  const statusOptions = withStatusReset(catalog?.statuses) ?? [
    { value: 'all', label: 'Tous les statuts' },
    ...Array.from(new Set(catalogCourses.map(course => course.statusValue).filter((value): value is string => Boolean(value)))).map(value => ({ value, label: value })),
  ];
  const category = categoryOptions.some(option => option.value === pageUrl.state.category && !option.disabled) ? pageUrl.state.category : 'all';
  const statusFilter = statusOptions.some(option => option.value === pageUrl.state.status && !option.disabled) ? pageUrl.state.status : 'all';
  const requestedCourseMissing =
    requestedCourseId !== null &&
    !!catalog &&
    !catalog.courses.some((course) => course.id === requestedCourseId);
  const footer = catalogResponse?.footer;
  const user = catalogResponse?.user;
  const configuredUrl = (key: Parameters<typeof frontUrl>[0]) =>
    parseFrontUrl(frontUrl(key))?.href;
  const settingsUrl = settingsProfileUrl(frontUrl("SETTINGS_FRONT_URL"));
  const hrefs = {
    dashboard: configuredUrl("DASHBOARD_FRONT_URL"),
    projects: configuredUrl("PROJECT_FRONT_URL"),
    messages: configuredUrl("MESSAGE_FRONT_URL"),
    training: configuredUrl("ELEARNING_FRONT_URL") ?? "/",
    calendar: configuredUrl("CALENDAR_FRONT_URL"),
    admin: configuredUrl("ADMINISTRATION_FRONT_URL"),
    profile: settingsUrl,
    settings: settingsUrl,
  };

  return (
    <AccessibleShell
      activeItem="training"
      isAdmin={user?.isAdmin ?? false}
      user={user ?? { name: "" }}
      onLogout={() => void requestLogout()}
      hrefs={hrefs}
      footerProps={
        footer ? {
          productName: footer.productName,
          version: footer.version,
          links: footer.links,
          className: "shrink-0",
        } : undefined
      }
      className="elearning-shell"
    >
      <h1 className="sr-only">Formation</h1>
      {logoutError && <section role="alert" className="mx-auto my-4 w-full max-w-[1130px] space-y-2 rounded border border-red-200 bg-white p-4 text-red-700">
        <p>{logoutError}</p>
        <button type="button" className="rounded border px-4 py-2 text-sm font-medium" onClick={() => navigateToLogin({ explicit: true })}>Retour à la connexion</button>
      </section>}
      {loading && !catalog && (
        <div
          className="mx-auto my-10 max-w-[1130px] rounded-lg border border-[#d8d2ca] bg-white p-8 text-center text-sm text-[#5f6470]"
          role="status"
        >
          Chargement des formations…
          <Skeleton className="mt-4 !h-64" />
        </div>
      )}

      {(error || mutationError || mutationSuccess) && (
        <div
          data-elearning-feedback-stack
          className={catalog
            ? "fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-h-[calc(100dvh-2rem)] max-w-[640px] flex-col gap-3 overflow-y-auto"
            : "mx-auto my-10 max-w-[1130px] space-y-3"}
        >
          {mutationSuccess && <Toast data-elearning-catalog-feedback message={mutationSuccess} variant="success"
            aria-label="Confirmation de la formation" closeLabel="Fermer la confirmation" onClose={() => setMutationSuccess(null)} />}
          {mutationError && <Toast data-elearning-catalog-feedback message={mutationError} variant="error"
            closeLabel="Masquer l’erreur de la formation" onClose={() => setMutationError(null)} />}
          {error && (
            <div
              data-elearning-catalog-feedback
              className="rounded-lg border border-[#efb9bd] bg-white px-4 py-3 text-center shadow-lg"
              role="alert"
            >
              <p className="text-sm font-semibold text-[#a4232c]">{error}</p>
              {catalog && (
                <p className="mt-2 text-sm text-[#5f6470]">
                  Les dernières données confirmées restent affichées. Réessayez pour actualiser les formations.
                </p>
              )}
              {loading && catalog && (
                <p className="mt-2 text-sm text-[#5f6470]" role="status">Actualisation des formations…</p>
              )}
              <button
                className="mt-4 rounded-md bg-[#1256a6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={loading}
                aria-busy={loading}
                onClick={() => void actions.loadCatalog()}
                type="button"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      )}

      {catalog && user?.isAdmin && !capabilities.courseManagement && (
        <p
          data-elearning-capability-notice
          className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#d8d2ca] bg-white px-4 py-3 text-sm text-[#5f6470]"
          role="note"
        >
          {COURSE_MANAGEMENT_UNAVAILABLE_MESSAGE}
        </p>
      )}

      {requestedCourseMissing && (
        <div
          className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#efb9bd] bg-white px-4 py-3 text-sm text-[#a4232c]"
          role="alert"
        >
          Cette formation n’est plus disponible. Vous pouvez consulter les autres formations.
          <button
            className="ml-3 font-semibold underline"
            onClick={clearRequestedCourse}
            type="button"
          >
            Voir le catalogue
          </button>
        </div>
      )}

      {catalog && pageUrl.ready && (
        <ElearningCatalog
          key={`${requestedCourseId === null ? 'catalog' : `course:${requestedCourseId}`}:${historyRevision}`}
          defaultSearch={pageUrl.state.q}
          defaultCategory={category}
          defaultStatus={statusFilter}
          onChangeCapture={event => {
            // The shared catalogue owns its input state. Keep typing focused; only
            // history navigation remounts it, while review drafts stay in this parent.
            if (event.target instanceof HTMLInputElement && event.target.type === 'search') pageUrl.update({ q: event.target.value }, 'replace');
          }}
          onClickCapture={event => {
            const option = (event.target as HTMLElement).closest<HTMLButtonElement>('button[role="option"]');
            if (!option || option.disabled) return;
            const field = option.parentElement?.previousElementSibling?.getAttribute('aria-label');
            const choices = field === 'Toutes les catégories' ? categoryOptions : field === 'Tous les statuts' ? statusOptions : null;
            const matching = choices?.filter(choice => choice.label === option.textContent?.trim() && !choice.disabled);
            if (matching?.length === 1) pageUrl.update({ [field === 'Toutes les catégories' ? 'category' : 'status']: matching[0].value });
          }}
          initialCourseId={requestedCourseId}
          onCourseClose={clearRequestedCourse}
          title={catalog.title}
          subtitle={catalog.subtitle}
          certificationCount={catalog.certificationCount}
          courses={catalogCourses}
          stats={catalog.stats}
          data-stat-count={catalog.stats?.length}
          adminStats={catalog.adminStats}
          categories={withCategoryReset(catalog.categories)}
          statuses={withStatusReset(catalog.statuses)}
          emptyLabel={catalog.emptyLabel}
          currentUserRole={
            user?.isAdmin ? "administrator" : "user"
          }
          onCourseAction={(course) => actions.startCourse(course.id)}
          onCourseContentComplete={handleContentComplete}
          onCourseRatingSubmit={capabilities.courseRating ? (course, rating) =>
            actions.rateCourse(course.id, rating) : undefined
          }
          renderCourseReview={course => <CourseReviewPanel key={course.id} courseId={course.id}
            completed={course.details?.completed === true || course.details?.progress === 100}
            draft={reviewDrafts[course.id] ?? { rating: 5, comment: '' }}
            onDraftChange={draft => setReviewDrafts(current => ({ ...current, [course.id]: draft }))}
            port={learnerPort} />}
          onCourseContentDownload={learnerPort.downloadResource ? async (course,content) => {
            downloadRef.current?.abort(); const controller = new AbortController(); downloadRef.current = controller;
            try {
              const file = await prepareResourceDownload(learnerPort,course.id,content.id,controller.signal);
              if (controller.signal.aborted) return false;
              const url = URL.createObjectURL(file.blob); const link = document.createElement('a');
              link.href = url; link.download = file.fileName; document.body.append(link); link.click(); link.remove();
              window.setTimeout(() => URL.revokeObjectURL(url),1000);
              return true;
            } finally { if (downloadRef.current === controller) downloadRef.current = null; }
          } : undefined}
          canCompleteCourseContent={learnerPort.canCompleteResource ? (course,content) => learnerPort.canCompleteResource!(course.id,content.id) : undefined}
          allowRatingEdits
          onCreateCourse={capabilities.courseManagement ? (course) => actions.createCourse(course) : undefined}
          onUpdateCourse={capabilities.courseManagement ? (course) => actions.updateCourse(course) : undefined}
          onDeleteCourse={capabilities.courseManagement ? (course) => void actions.deleteCourse(course.id) : undefined}
          className="elearning-catalog-shell min-h-full !px-6 !py-8"
        />
      )}
    </AccessibleShell>
  );
}
