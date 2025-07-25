import { DashboardConfig } from "@/types";

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Groups",
      href: "/dashboard/groups",
    },
    {
      title: "Friends",
      href: "/dashboard/friends",
    },
    {
      title: "Activity",
      href: "/dashboard/activity",
    },
  ],
  sidebarNav: [
    {
      title: "Overview",
      href: "/dashboard",
      icon: "post", // Replace with actual icon name
    },
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: "settings", // Replace with actual icon name
    },
  ],
};
