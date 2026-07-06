import type { ComponentProps } from "react";
import type {
  Footer,
  Header,
  Sidebar,
  UserProfilePage,
} from "@mairie360/lib-components";
import {
  Briefcase,
  Calendar,
  Files,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  UserRound,
} from "lucide-react";

export const profilePath = "/profile";

export const currentUser = {
  name: "Admin Systeme",
  email: "admin@mairie360.fr",
  phone: "+262 692 00 00 00",
  service: "Administration",
  position: "Administrateur systeme",
  role: "admin",
  address: "1 rue de la Mairie",
  city: "Saint-Denis",
  lastConnection: "3 juillet 2026 a 09:15",
} satisfies NonNullable<ComponentProps<typeof UserProfilePage>["user"]>;

export const footerLinks = [
  { label: "Support technique", href: "/support" },
  { label: "Documentation", href: "/documentation" },
  { label: "Conditions d'utilisation", href: "/conditions" },
] satisfies NonNullable<ComponentProps<typeof Footer>["links"]>;

type SidebarItem = NonNullable<ComponentProps<typeof Sidebar>["items"]>[number];

export const sidebarItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "projects", label: "Projets", icon: Briefcase },
  { id: "messages", label: "Messagerie", icon: MessageSquare },
  { id: "emails", label: "E-mails", icon: Mail },
  { id: "files", label: "Fichiers", icon: Files },
  { id: "training", label: "Formation", icon: GraduationCap },
  { id: "calendar", label: "Calendrier", icon: Calendar },
  {
    id: "admin",
    label: "Administration",
    icon: Shield,
    adminOnly: true,
    badge: "Admin",
  },
  { id: "profile", label: "Profil", icon: UserRound },
  { id: "settings", label: "Parametres", icon: Settings },
] satisfies SidebarItem[];

const pageRoutes: Record<string, string> = {
  profile: profilePath,
  training: "/",
};

export function getRouteForPage(page: string) {
  return pageRoutes[page];
}

export const headerProfileProps = {
  user: currentUser,
  isAdmin: true,
  profileHref: profilePath,
} satisfies Pick<
  ComponentProps<typeof Header>,
  "user" | "isAdmin" | "profileHref"
>;
