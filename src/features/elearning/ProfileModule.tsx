"use client";

import { UserProfilePage } from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { logoutAndReload } from "@/lib/auth-session";
import { BffRequestError, requestBff } from "@/lib/bff-client";
import { navigateToPage, profilePath, sidebarItems } from "./appData";

type ProfileUser = NonNullable<ComponentProps<typeof UserProfilePage>["user"]> & {
  isAdmin: boolean;
};

type ProfileResponse = {
  user: ProfileUser;
  footer?: NonNullable<ComponentProps<typeof UserProfilePage>["footerProps"]>;
};

export function ProfileModule() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const response = await requestBff<ProfileResponse>("/elearning/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        setProfile(response);
        setError(null);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        if (requestError instanceof BffRequestError && requestError.status === 401) {
          await logoutAndReload();
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Le profil est indisponible.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, []);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
  };

  return (
    <UserProfilePage
      activeItem="profile"
      isAdmin={profile?.user.isAdmin ?? false}
      user={profile?.user ?? { name: "" }}
      headerProps={{
        onPageChange: handlePageChange,
        onLogout: () => void logoutAndReload(),
        profileHref: profilePath,
      }}
      sidebarProps={{
        items: sidebarItems,
      }}
      footerProps={profile?.footer}
      profileProps={{
        title: "Profil",
        subtitle: "Informations réelles du compte connecté",
        editable: false,
        loading,
        error,
      }}
    />
  );
}
