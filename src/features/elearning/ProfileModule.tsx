"use client";

import { UserProfilePage } from "@mairie360/lib-components";
import { useRouter } from "next/navigation";
import {
  currentUser,
  footerLinks,
  getRouteForPage,
  profilePath,
  sidebarItems,
} from "./appData";

export function ProfileModule() {
  const router = useRouter();

  const handlePageChange = (page: string) => {
    const route = getRouteForPage(page);

    if (route) {
      router.push(route);
    }
  };

  return (
    <UserProfilePage
      activeItem="profile"
      isAdmin
      user={currentUser}
      headerProps={{
        onPageChange: handlePageChange,
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
