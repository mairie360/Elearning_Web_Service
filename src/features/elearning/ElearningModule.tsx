"use client";

import {
  AppShell,
  ElearningCatalog,
} from "@mairie360/lib-components";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { logout } from "@/lib/auth-session";
import type { ElearningCatalogResponse } from "@/lib/elearning-api";
import { parseFrontUrl } from "@/lib/front-url";
import { frontUrl } from "@/lib/front-urls";
import { settingsProfileUrl } from "@/lib/settings-profile";
import { createCatalogActions } from "./catalogActions";

type CatalogProps = ComponentProps<typeof ElearningCatalog>;
type CatalogCourse = CatalogProps["courses"][number];
type ContentCompletePayload = Parameters<
  NonNullable<CatalogProps["onCourseContentComplete"]>
>[1];

export function ElearningModule() {
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
      onLogout={() => void logout()}
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
    </AppShell>
  );
}
