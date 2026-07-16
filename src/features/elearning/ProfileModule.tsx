"use client";

import { UserProfilePage } from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import {
  currentUser,
  footerLinks,
  navigateToPage,
  profilePath,
  sidebarItems,
} from "./appData";

export function ProfileModule() {
  const router = useRouter();
  const session = useAuthSession(currentUser);

  const handlePageChange = (page: string) => {
    navigateToPage(page, router.push);
  };

  return (
    <UserProfilePage
      activeItem="profile"
      isAdmin={session.isAdmin}
      user={session.user}
      headerProps={{
        onPageChange: handlePageChange,
        onLogout: () => void logoutAndReload(),
        profileHref: profilePath,
      }}
      sidebarProps={{
        items: sidebarItems,
      }}
      footerProps={{
        productName: "Mairie360",
        version: "2.1.0",
        links: footerLinks,
      }}
      profileProps={{
        title: "Profil",
        subtitle: "Informations de votre compte Mairie360",
      }}
    />
  );
}
