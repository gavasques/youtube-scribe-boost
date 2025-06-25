
import { Calendar, Home, Video, Blocks, FolderTree, Settings, Zap, Clock, CheckCircle } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useApprovals } from "@/hooks/useApprovals"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Vídeos",
    url: "/videos",
    icon: Video,
  },
  {
    title: "Blocos",
    url: "/blocks",
    icon: Blocks,
  },
  {
    title: "Categorias",
    url: "/categories",
    icon: FolderTree,
  },
  {
    title: "Prompts IA",
    url: "/prompts",
    icon: Zap,
  },
  {
    title: "Aprovações",
    url: "/approvals",
    icon: CheckCircle,
    showBadge: true,
  },
  {
    title: "Agenda",
    url: "/schedule",
    icon: Clock,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { pendingCount } = useApprovals()

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/" || location.pathname === "/dashboard"
    }
    return location.pathname === url
  }

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">YT Manager</span>
            <span className="text-xs text-muted-foreground">Description AI</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.showBadge && pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {pendingCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="px-6 py-4">
        <div className="text-xs text-muted-foreground">
          v1.0.0 - Beta
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
