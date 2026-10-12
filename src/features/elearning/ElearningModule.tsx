"use client";

import {
  AppShell,
  ElearningCatalog,
} from "@mairie360/lib-components";
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
import { withCategoryReset, withStatusReset } from "./catalogFilters";

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

export function ElearningModule({ learnerPort = pendingLearnerPort }: { learnerPort?: LearnerFeaturePort } = {}) {
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const downloadRef = useRef<AbortController | null>(null);
  useEffect(() => () => downloadRef.current?.abort(), []);
  const [catalogResponse, setCatalogResponse] =
    useState<ElearningCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const [requestedCourseId, setRequestedCourseId] = useState<string | null>(null);

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
    void actions.loadCatalog();
  }, [actions]);

  useEffect(() => {
    const browserWindow = window;
    const syncRequestedCourse = () =>
      setRequestedCourseId(courseIdFromSearch(browserWindow.location.search));

    syncRequestedCourse();
    browserWindow.addEventListener("popstate", syncRequestedCourse);
    return () => browserWindow.removeEventListener("popstate", syncRequestedCourse);
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
    return actions.completeContent(
      course.id,
      payload.chapter.id,
      payload.content.id,
      payload.content.completed ?? true,
    );
  };

  const catalog = catalogResponse?.catalog;
  // The dev BFF contract no longer requires `chapters[].duration` (the E-learning API has none), while the published
  // library still types it as a string: present an empty duration rather than failing the type check or the reader.
  const catalogCourses = useMemo(() => (catalog ? withChapterDurations(catalog.courses) : []), [catalog]);
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
    <AppShell
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
        </div>
      )}

      {(error || mutationError || mutationSuccess) && (
        <div
          data-elearning-feedback-stack
          className={catalog
            ? "fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-h-[calc(100dvh-2rem)] max-w-[640px] flex-col gap-3 overflow-y-auto"
            : "mx-auto my-10 max-w-[1130px] space-y-3"}
        >
          {mutationSuccess && (
            <div
              data-elearning-catalog-feedback
              className="flex items-start justify-between gap-3 rounded-md border border-[#b9dfc8] bg-[#eefaf3] px-4 py-3 text-sm font-semibold text-[#167544] shadow-lg"
              role="status"
              aria-label="Confirmation de la formation"
            >
              <p className="min-w-0 break-words [overflow-wrap:anywhere]">{mutationSuccess}</p>
              <button
                type="button"
                aria-label="Fermer la confirmation"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-[#b9dfc8] bg-white px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167544]"
                onClick={() => setMutationSuccess(null)}
              >
                Fermer
              </button>
            </div>
          )}
          {mutationError && (
            <div
              data-elearning-catalog-feedback
              className="rounded-md border border-[#efb9bd] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#a4232c] shadow-lg"
              role="alert"
            >
              {mutationError}
            </div>
          )}
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

      {catalog && (
        <ElearningCatalog
          key={requestedCourseId === null ? "catalog" : `course:${requestedCourseId}`}
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
          onCourseRatingSubmit={(course, rating) =>
            actions.rateCourse(course.id, rating)
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
          onCreateCourse={(course) => actions.createCourse(course)}
          onUpdateCourse={(course) => actions.updateCourse(course)}
          onDeleteCourse={(course) => void actions.deleteCourse(course.id)}
          className="elearning-catalog-shell min-h-full !px-6 !py-8"
        />
      )}
    </AppShell>
  );
}
