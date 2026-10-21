"use client";
import { subscribePageReturn } from "@/lib/page-return";

import { AccessibleShell } from "@mairie360/lib-components/shell";

import { ElearningCatalog } from "@/components/elearning";
import { useEffect, useMemo, useRef, useState } from "react";
import { logout, navigateToLogin } from "@/lib/auth-session";
import type { ElearningCatalogResponse } from "@/lib/elearning-api";
import { courseIdFromSearch, urlWithoutCourse } from "@/lib/course-query";
import { CourseReviewPanel } from "./CourseReviewPanel";
import { pendingLearnerPort } from "./learnerFeatures";
import type { LearnerFeaturePort, ReviewDraft } from "./learnerFeatures";
import { createCatalogActions } from "./catalogActions";
import { CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE, pinnedBffCapabilities } from "./bffCapabilities";
import type { CatalogCapabilities } from "./bffCapabilities";
import { withCategoryReset, withStatusReset } from "./catalogFilters";
import { usePageUrlState } from '@/lib/use-page-url-state';
import { parseCatalogResponse, type InitialCatalog } from '@/lib/catalog-response';
import { catalogUrlSchema } from './catalogQuery';
import { CatalogFeedbackStack } from "./module/CatalogFeedbackStack";
import { CatalogLoading, CourseManagementNotice, LogoutErrorNotice, MissingCourseNotice } from "./module/ModuleNotices";
import {
  categoryOptionsFor,
  elearningShellHrefs,
  offeredFilter,
  statusOptionsFor,
  withChapterDurations,
  type CatalogCourse,
  type ContentCompletePayload,
} from "./module/module-model";
import { useResourceDownload } from "./module/use-resource-download";

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
  const resourceDownload = useResourceDownload(learnerPort);
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
    resourceDownload.abort();
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
  const categoryOptions = categoryOptionsFor(catalog, catalogCourses);
  const statusOptions = statusOptionsFor(catalog, catalogCourses);
  const category = offeredFilter(categoryOptions, pageUrl.state.category);
  const statusFilter = offeredFilter(statusOptions, pageUrl.state.status);
  const requestedCourseMissing =
    requestedCourseId !== null &&
    !!catalog &&
    !catalog.courses.some((course) => course.id === requestedCourseId);
  const footer = catalogResponse?.footer;
  const user = catalogResponse?.user;

  return (
    <AccessibleShell
      activeItem="training"
      user={user ?? { name: "" }}
      onLogout={() => void requestLogout()}
      hrefs={elearningShellHrefs()}
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
      {logoutError && <LogoutErrorNotice message={logoutError} onBackToLogin={() => navigateToLogin({ explicit: true })} />}
      {loading && !catalog && <CatalogLoading />}

      <CatalogFeedbackStack
        hasCatalog={Boolean(catalog)}
        loading={loading}
        error={error}
        mutationError={mutationError}
        mutationSuccess={mutationSuccess}
        onRetry={() => void actions.loadCatalog()}
        onDismissError={() => setMutationError(null)}
        onDismissSuccess={() => setMutationSuccess(null)}
      />

      {catalog && user?.isAdmin && !capabilities.courseManagement && <CourseManagementNotice />}

      {requestedCourseMissing && <MissingCourseNotice onShowCatalog={clearRequestedCourse} />}

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
          onCourseContentDownload={resourceDownload.download}
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
