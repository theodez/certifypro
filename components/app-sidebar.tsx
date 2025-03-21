"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Calendar,
  Settings,
  HelpCircle,
  FileText,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigationSections = [
  {
    label: "Dashboard",
    items: [
      {
        title: "Vue d'ensemble",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Équipes",
        url: "/dashboard/teams",
        icon: Users,
      },
      {
        title: "Employés",
        url: "/dashboard/employees",
        icon: UserCircle,
      },
      {
        title: "Calendrier",
        url: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        title: "Devis",
        url: "/dashboard/quotes",
        icon: FileText,
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        title: "Réglages",
        url: "/dashboard/settings",
        icon: Settings,
      },
      {
        title: "Support",
        url: "/dashboard/support",
        icon: HelpCircle,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="text-xl font-bold">CertifyPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navigationSections} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
