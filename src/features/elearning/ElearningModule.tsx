"use client";

import {
  ElearningCatalog,
  Footer,
  Header,
  Sidebar,
} from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { logoutAndReload } from "@/lib/auth-session";
import { BffRequestError, requestBff } from "@/lib/bff-client";
import { navigateToPage, profilePath, sidebarItems } from "./appData";

type CatalogProps = ComponentProps<typeof ElearningCatalog>;
type CatalogCourse = CatalogProps["courses"][number];
type ContentCompletePayload = Parameters<
  NonNullable<CatalogProps["onCourseContentComplete"]>
>[1];
type CatalogUser = NonNullable<ComponentProps<typeof Header>["user"]> & {
  isAdmin: boolean;
};

type CatalogResponse = {
  user: CatalogUser;
  notifications: {
    unreadCount: number;
  };
  catalog: {
    title: string;
    subtitle?: string;
    certificationCount: number;
    emptyLabel: string;
    statuses: NonNullable<CatalogProps["statuses"]>;
    categories?: CatalogProps["categories"];
    stats?: CatalogProps["stats"];
    adminStats?: CatalogProps["adminStats"];
    courses: CatalogProps["courses"];
  };
  footer?: {
    productName: string;
    version: string;
    links: NonNullable<ComponentProps<typeof Footer>["links"]>;
  };
};

type CourseActionResponse = {
  course: CatalogCourse;
};

function getErrorMessage(error: unknown) {
  if (error instanceof BffRequestError) return error.message;
  return "Une erreur inattendue est survenue.";
}

export function ElearningModule() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalogResponse, setCatalogResponse] =
    useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await requestBff<CatalogResponse>(
        "/elearning/catalog",
        { cache: "no-store" },
      );
      setCatalogResponse(response);
    } catch (requestError) {
      if (requestError instanceof BffRequestError && requestError.status === 401) {
        await logoutAndReload();
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
    setSidebarOpen(false);
  };

  const runCourseMutation = useCallback(
    async (path: string, body?: unknown) => {
      setMutationError(null);

      try {
        await requestBff(path, {
          method: "POST",
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        await loadCatalog();
      } catch (requestError) {
        if (
          requestError instanceof BffRequestError &&
          requestError.status === 401
        ) {
          await logoutAndReload();
          return;
        }

        setMutationError(getErrorMessage(requestError));
      }
    },
    [loadCatalog],
  );

  const runAdminCourseMutation = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) => {
      setMutationError(null);

      try {
        await requestBff(path, {
          method,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        await loadCatalog();
      } catch (requestError) {
        if (
          requestError instanceof BffRequestError &&
          requestError.status === 401
        ) {
          await logoutAndReload();
          return;
        }

        setMutationError(getErrorMessage(requestError));
      }
    },
    [loadCatalog],
  );

  const handleCourseAction = useCallback(
    async (course: CatalogCourse) => {
      setMutationError(null);

      try {
        const response = await requestBff<CourseActionResponse>(
          `/elearning/courses/${encodeURIComponent(course.id)}/start`,
          { method: "POST", body: JSON.stringify({}) },
        );

        setCatalogResponse((current) =>
          current
            ? {
                ...current,
                catalog: {
                  ...current.catalog,
                  courses: current.catalog.courses.map((currentCourse) =>
                    currentCourse.id === response.course.id
                      ? response.course
                      : currentCourse,
                  ),
                },
              }
            : current,
        );
      } catch (requestError) {
        if (
          requestError instanceof BffRequestError &&
          requestError.status === 401
        ) {
          await logoutAndReload();
          return;
        }

        setMutationError(getErrorMessage(requestError));
      }
    },
    [],
  );

  const handleContentComplete = useCallback(
    (course: CatalogCourse, payload: ContentCompletePayload) => {
      void runCourseMutation(
        `/elearning/courses/${encodeURIComponent(course.id)}/contents/${encodeURIComponent(payload.content.id)}/complete`,
        {
          chapterId: payload.chapter.id,
          completed: payload.content.completed ?? true,
        },
      );
    },
    [runCourseMutation],
  );

  const handleRatingSubmit = useCallback(
    (course: CatalogCourse, rating: number) => {
      void runCourseMutation(
        `/elearning/courses/${encodeURIComponent(course.id)}/rating`,
        { rating },
      );
    },
    [runCourseMutation],
  );

  const catalog = catalogResponse?.catalog;
  const footer = catalogResponse?.footer;
  const user = catalogResponse?.user;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f2ef] text-[#2f3747]">
      <Sidebar
        activeItem="training"
        isAdmin={user?.isAdmin ?? false}
        items={sidebarItems}
        onItemSelect={(item) => handlePageChange(item.id)}
        className="hidden shrink-0 lg:flex"
      />

      {sidebarOpen && (
        <div
          aria-label="Navigation mobile"
          aria-modal="true"
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
        >
          <button
            aria-label="Fermer la navigation"
            className="absolute inset-0 h-full w-full bg-black/35"
            onClick={() => setSidebarOpen(false)}
            type="button"
          />
          <div className="relative h-full w-[260px] max-w-[82vw] shadow-2xl">
            <Sidebar
              activeItem="training"
              isAdmin={user?.isAdmin ?? false}
              items={sidebarItems}
              onItemSelect={(item) => handlePageChange(item.id)}
              className="h-full"
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user ?? { name: "" }}
          isAdmin={user?.isAdmin ?? false}
          profileHref={profilePath}
          setSidebarOpen={setSidebarOpen}
          onPageChange={handlePageChange}
          onLogout={() => void logoutAndReload()}
        />

        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f4f2ef]">
          {mutationError && (
            <div
              className="mx-auto mt-6 max-w-[1130px] rounded-md border border-[#efb9bd] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#a4232c]"
              role="alert"
            >
              {mutationError}
            </div>
          )}

          {loading && !catalog && (
            <div
              className="mx-auto my-10 max-w-[1130px] rounded-lg border border-[#d8d2ca] bg-white p-8 text-center text-sm text-[#5f6470]"
              role="status"
            >
              Chargement des formations…
            </div>
          )}

          {error && !catalog && (
            <div
              className="mx-auto my-10 max-w-[1130px] rounded-lg border border-[#efb9bd] bg-white p-8 text-center"
              role="alert"
            >
              <p className="text-sm font-semibold text-[#a4232c]">{error}</p>
              <button
                className="mt-4 rounded-md bg-[#1256a6] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void loadCatalog()}
                type="button"
              >
                Réessayer
              </button>
            </div>
          )}

          {catalog && (
            <ElearningCatalog
              title={catalog.title}
              subtitle={catalog.subtitle}
              certificationCount={catalog.certificationCount}
              courses={catalog.courses}
              stats={catalog.stats}
              adminStats={catalog.adminStats}
              categories={catalog.categories}
              statuses={catalog.statuses}
              emptyLabel={catalog.emptyLabel}
              currentUserRole={
                user?.isAdmin ? "administrator" : "user"
              }
              onCourseAction={(course) => void handleCourseAction(course)}
              onCourseContentComplete={handleContentComplete}
              onCourseRatingSubmit={(course, rating) =>
                handleRatingSubmit(course, rating)
              }
              onCreateCourse={(course) =>
                void runAdminCourseMutation(
                  "POST",
                  "/elearning/admin/courses",
                  course,
                )
              }
              onUpdateCourse={(course) =>
                void runAdminCourseMutation(
                  "PATCH",
                  `/elearning/admin/courses/${encodeURIComponent(course.id)}`,
                  course,
                )
              }
              onDeleteCourse={(course) =>
                void runAdminCourseMutation(
                  "DELETE",
                  `/elearning/admin/courses/${encodeURIComponent(course.id)}`,
                )
              }
              className="elearning-catalog-shell min-h-full !px-6 !py-10 md:!px-10 lg:!px-14 xl:!px-14"
            />
          )}
        </main>

        {footer && (
          <Footer
            productName={footer.productName}
            version={footer.version}
            links={footer.links}
            className="shrink-0"
          />
        )}
      </div>
    </div>
  );
}
