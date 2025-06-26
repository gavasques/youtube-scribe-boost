
import { Link, useLocation } from "react-router-dom"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { LucideIcon } from "lucide-react"

interface SidebarMenuItemProps {
  title: string
  url: string
  icon: LucideIcon
  showBadge?: boolean
  badgeCount?: number
}

export function SidebarMenuItemComponent({ 
  title, 
  url, 
  icon: Icon, 
  showBadge = false, 
  badgeCount = 0 
}: SidebarMenuItemProps) {
  const location = useLocation()
  
  const isActive = (itemUrl: string) => {
    if (itemUrl === "/") {
      return location.pathname === "/" || location.pathname === "/dashboard"
    }
    return location.pathname === itemUrl
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isActive(url)}
        className={`transition-all duration-200 ${
          isActive(url) 
            ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-4 border-primary font-medium' 
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`}
      >
        <Link to={url} className="flex items-center gap-3">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
          {showBadge && badgeCount > 0 && (
            <Badge variant="destructive" className="ml-auto text-xs">
              {badgeCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
