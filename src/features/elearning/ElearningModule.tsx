"use client";

import {
  ElearningCatalog,
  Footer,
  Header,
  Sidebar,
} from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { logoutAndReload } from "@/lib/auth-session";
import type { ElearningCatalogResponse } from "@/lib/elearning-api";
import { navigateToPage, profilePath, sidebarItems } from "./appData";
import { createCatalogActions } from "./catalogActions";

type CatalogProps = ComponentProps<typeof ElearningCatalog>;
type CatalogCourse = CatalogProps["courses"][number];
type ContentCompletePayload = Parameters<
  NonNullable<CatalogProps["onCourseContentComplete"]>
>[1];

export function ElearningModule() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [catalogResponse, setCatalogResponse] =
    useState<ElearningCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const actions = useMemo(
    () =>
      createCatalogActions({
        setCatalogResponse,
        setLoading,
        setError,
        setMutationError,
      }),
    [],
  );

  useEffect(() => {
    void actions.loadCatalog();
  }, [actions]);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
    setSidebarOpen(false);
  };

  const handleContentComplete = (
    course: CatalogCourse,
    payload: ContentCompletePayload,
  ) => {
    void actions.completeContent(
      course.id,
      payload.chapter.id,
      payload.content.id,
      payload.content.completed ?? true,
    );
  };

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
                onClick={() => void actions.loadCatalog()}
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
              onCourseAction={(course) => void actions.startCourse(course.id)}
              onCourseContentComplete={handleContentComplete}
              onCourseRatingSubmit={(course, rating) =>
                void actions.rateCourse(course.id, rating)
              }
              onCreateCourse={(course) => void actions.createCourse(course)}
              onUpdateCourse={(course) => void actions.updateCourse(course)}
              onDeleteCourse={(course) => void actions.deleteCourse(course.id)}
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
