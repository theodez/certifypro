"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { usePathname } from "next/navigation"

// Import navigationSections from app-sidebar to get menu information
import { navigationSections } from "@/components/app-sidebar"

function DashboardHeader() {
  const pathname = usePathname()

  const allMenuItems = navigationSections.flatMap(section => section.items)
  const activeMenuItem = allMenuItems.find(item =>
    pathname === item.url || (pathname.startsWith(item.url) && item.url !== "/dashboard")
  )

  const menuTitle = activeMenuItem?.title || "Dashboard"

  return (
    <header className="flex items-center h-14 px-4 bg-white">
      <SidebarTrigger className="mr-2" />
      <div className="flex items-center">
      <h1 className="text-xl font-semibold ">{menuTitle}</h1>
      </div>
    </header>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-full">
      {/* Sidebar */}
      <AppSidebar className="hidden border-r md:block" />

      {/* Main Content */}
      <div className="flex flex-col w-full">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}



export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider defaultOpen={true}>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </AuthGuard>
  )
}
