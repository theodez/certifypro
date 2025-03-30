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
        <SidebarGroup key={section.label} className="w-full mt-2">
          <SidebarGroupLabel className="px-4">{section.label}</SidebarGroupLabel>
          {section.items.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex items-center w-full gap-2 px-4 py-2 rounded-md hover:bg-white/10 hover:backdrop-blur-md",
                pathname === item.url && "bg-white/10 backdrop-blur-md text-white font-medium"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5 flex-shrink-0" />}
              <span className="truncate text-white">{item.title}</span>
            </Link>
          ))}
        </SidebarGroup>
      ))}
    </>
  )
}
