"use client";
import { subscribePageReturn } from '@mairie360/lib-components/shared';

import { AccessibleShell } from "@mairie360/lib-components/shell";
import { ToastProvider } from "@mairie360/lib-components/primitives";

import { ElearningCatalog } from './components/ElearningCatalog';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { logout, navigateToLogin } from '../../lib/auth-session';
import type { ElearningCatalogResponse } from '../../lib/elearning-api';
import { courseIdFromSearch, urlWithoutCourse } from '../../lib/course-query';
import { CourseReviewPanel } from './components/CourseReviewPanel';
import { CoursePlayer } from './components/CoursePlayer';
import { pendingLearnerPort } from '../../features/elearning/learnerFeatures';
import type { LearnerFeaturePort, ReviewDraft } from '../../features/elearning/learnerFeatures';
import { createCatalogActions } from '../../features/elearning/catalogActions';
import { CONTENT_UNCOMPLETION_UNAVAILABLE_MESSAGE, pinnedBffCapabilities } from '../../features/elearning/bffCapabilities';
import type { CatalogCapabilities } from '../../features/elearning/bffCapabilities';
import { withCategoryReset, withStatusReset } from '../../features/elearning/catalogFilters';
import { usePageUrlState } from '../../lib/use-page-url-state';
import { parseCatalogResponse, type InitialCatalog } from '../../lib/catalog-response';
import { catalogUrlSchema } from '../../features/elearning/catalogQuery';
import { CatalogLoading } from './components/CatalogLoading';
import { CatalogReadError } from './components/CatalogReadError';
import { CatalogToasts } from './components/CatalogToasts';
import { CourseManagementNotice } from './components/CourseManagementNotice';
import { LogoutErrorNotice } from './components/LogoutErrorNotice';
import { MissingCourseNotice } from './components/MissingCourseNotice';
import {
  categoryOptionsFor,
  elearningShellHrefs,
  offeredFilter,
  pageSubtitle,
  REQUIREMENT_FILTERS,
  STATUS_FILTERS,
  type CatalogFeedback,
  withChapterDurations,
  type CatalogCourse,
  type ContentCompletePayload,
} from './module-model';
import { useResourceDownload } from './use-resource-download';

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
  const [feedback, setFeedback] = useState<CatalogFeedback[]>([]);
  const feedbackId = useRef(0);
  const report = useCallback((tone: CatalogFeedback['tone'], title: string, message?: string) =>
    setFeedback(current => [...current, { id: ++feedbackId.current, tone, title, message }]), []);
  const setMutationError = useCallback((message: string | null, title?: string) => {
    if (message) report('danger', title ?? 'Action impossible', message);
  }, [report]);
  const setMutationSuccess = useCallback((message: string | null, title?: string) => {
    if (message) report('success', title ?? message, title ? message : undefined);
  }, [report]);
  const feedbackShown = useCallback((id: number) => setFeedback(current => current.filter(item => item.id !== id)), []);
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
    [setMutationError, setMutationSuccess],
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
  const category = offeredFilter(categoryOptions, pageUrl.state.category);
  const statusFilter = offeredFilter(STATUS_FILTERS, pageUrl.state.status);
  const requirementFilter = offeredFilter(REQUIREMENT_FILTERS, pageUrl.state.requirement);
  const requestedCourseMissing =
    requestedCourseId !== null &&
    !!catalog &&
    !catalog.courses.some((course) => course.id === requestedCourseId);
  const user = catalogResponse?.user;
  // MAIR-1148: `?play=<id>` shows the course screen in place of the application shell; the browser back button leaves it.
  const playingCourse = pageUrl.state.play ? catalogCourses.find((course) => course.id === pageUrl.state.play) : undefined;
  // Leaving the course screen any way (back button included) cancels its pending download.
  const playingId = playingCourse?.id;
  const abortDownload = resourceDownload.abort;
  useEffect(() => () => abortDownload(), [playingId, abortDownload]);
  const playCourse = (course: CatalogCourse) => pageUrl.update({ play: course.id });
  const leaveCourse = () => {
    resourceDownload.abort();
    pageUrl.update({ play: '' });
    report('info', 'Progression enregistrée', 'Vous pouvez reprendre la formation où vous l’avez laissée.');
  };
  const review = (course: CatalogCourse) => <CourseReviewPanel key={course.id} courseId={course.id}
    completed={course.details?.completed === true || course.details?.progress === 100}
    draft={reviewDrafts[course.id] ?? { rating: 5, comment: '' }}
    onDraftChange={draft => setReviewDrafts(current => ({ ...current, [course.id]: draft }))}
    port={learnerPort} />;

  return (
    <ToastProvider regionLabel="Notifications de la formation" closeLabel="Fermer la notification" placement="top-end">
    <CatalogToasts feedback={feedback} onShown={feedbackShown} />
    {playingCourse ? (
      <CoursePlayer
        key={playingCourse.id}
        course={playingCourse}
        onExit={leaveCourse}
        onContentComplete={handleContentComplete}
        onContentDownload={resourceDownload.download}
        canCompleteContent={learnerPort.canCompleteResource ? (course, content) => learnerPort.canCompleteResource!(course.id, content.id) : undefined}
        onRatingSubmit={capabilities.courseRating ? (course, rating) => actions.rateCourse(course.id, rating) : undefined}
        review={review(playingCourse)}
      />
    ) : (
    <AccessibleShell
      activeItem="training"
      user={user ?? { name: "" }}
      onLogout={() => void requestLogout()}
      hrefs={elearningShellHrefs()}
    >
      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {logoutError && <LogoutErrorNotice message={logoutError} onBackToLogin={() => navigateToLogin({ explicit: true })} />}
      {loading && !catalog && <CatalogLoading subtitle={pageSubtitle(user?.isAdmin)} />}

      <CatalogReadError
        hasCatalog={Boolean(catalog)}
        loading={loading}
        error={error}
        onRetry={() => void actions.loadCatalog()}
      />

      {catalog && user?.isAdmin && !capabilities.courseManagement && <CourseManagementNotice />}

      {requestedCourseMissing && <MissingCourseNotice onShowCatalog={clearRequestedCourse} />}

      {catalog && pageUrl.ready && (
        <ElearningCatalog
          key={`${requestedCourseId === null ? 'catalog' : `course:${requestedCourseId}`}:${historyRevision}`}
          defaultSearch={pageUrl.state.q}
          defaultCategory={category}
          defaultStatus={statusFilter}
          defaultRequirement={requirementFilter}
          onSearchChange={value => pageUrl.update({ q: value }, 'replace')}
          onCategoryChange={value => pageUrl.update({ category: value })}
          onStatusChange={value => pageUrl.update({ status: value })}
          onRequirementChange={value => pageUrl.update({ requirement: value })}
          initialCourseId={requestedCourseId}
          onCourseClose={clearRequestedCourse}
          subtitle={pageSubtitle(user?.isAdmin)}
          courses={catalogCourses}
          adminStats={catalog.adminStats}
          adminStatsState={loading ? 'loading' : error ? 'unavailable' : 'default'}
          onRefreshStats={() => void actions.loadCatalog()}
          categories={withCategoryReset(catalog.categories)}
          statuses={withStatusReset(catalog.statuses)}
          currentUserRole={
            user?.isAdmin ? "administrator" : "user"
          }
          onCourseAction={(course) => actions.startCourse(course.id)}
          onPlayCourse={playCourse}
          onCreateCourse={capabilities.courseManagement ? (course) => actions.createCourse(course) : undefined}
          onUpdateCourse={capabilities.courseManagement ? (course) => actions.updateCourse(course) : undefined}
          onDeleteCourse={capabilities.courseManagement ? (course) => void actions.deleteCourse(course.id) : undefined}
        />
      )}
      </div>
    </AccessibleShell>
    )}
    </ToastProvider>
  );
}
