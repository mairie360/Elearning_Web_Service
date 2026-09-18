"use client";

import { UserProfilePage } from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/lib/auth-session";
import type { ElearningProfileResponse } from "@/lib/elearning-api";
import { navigateToPage, profilePath, sidebarItems } from "./appData";
import { loadProfile } from "./profileActions";

export function ProfileModule() {
  const router = useRouter();
  const [profile, setProfile] = useState<ElearningProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void loadProfile({ setProfile, setLoading, setError }, controller.signal);
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
        onLogout: () => void logout(),
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
