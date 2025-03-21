"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr]">
          <AppSidebar className="hidden border-r md:block" />
          <main className="flex flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
