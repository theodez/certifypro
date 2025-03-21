"use client"

import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
}

interface NavSection {
  label: string
  items: NavItem[]
}

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          {section.items.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100",
                pathname === item.url && "bg-gray-100 text-blue-600"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.title}</span>
            </Link>
          ))}
        </SidebarGroup>
      ))}
    </>
  )
}
