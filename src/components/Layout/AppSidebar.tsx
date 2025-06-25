
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
    color: "text-blue-600",
    hoverColor: "hover:bg-blue-50 hover:text-blue-700",
  },
  {
    title: "Vídeos",
    url: "/videos",
    icon: Video,
    color: "text-red-500",
    hoverColor: "hover:bg-red-50 hover:text-red-600",
  },
  {
    title: "Blocos",
    url: "/blocks",
    icon: Blocks,
    color: "text-purple-600",
    hoverColor: "hover:bg-purple-50 hover:text-purple-700",
  },
  {
    title: "Categorias",
    url: "/categories",
    icon: FolderTree,
    color: "text-emerald-600",
    hoverColor: "hover:bg-emerald-50 hover:text-emerald-700",
  },
  {
    title: "Prompts IA",
    url: "/prompts",
    icon: Zap,
    color: "text-amber-600",
    hoverColor: "hover:bg-amber-50 hover:text-amber-700",
  },
  {
    title: "Aprovações",
    url: "/approvals",
    icon: CheckCircle,
    color: "text-rose-600",
    hoverColor: "hover:bg-rose-50 hover:text-rose-700",
    showBadge: true,
  },
  {
    title: "Agenda",
    url: "/schedule",
    icon: Clock,
    color: "text-cyan-600",
    hoverColor: "hover:bg-cyan-50 hover:text-cyan-700",
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    color: "text-indigo-600",
    hoverColor: "hover:bg-indigo-50 hover:text-indigo-700",
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
    <Sidebar className="border-r border-border bg-gradient-to-b from-slate-50 to-blue-50">
      <SidebarHeader className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              YT Manager
            </span>
            <span className="text-xs text-muted-foreground">Description AI</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-semibold">Aplicação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className={`${item.hoverColor} transition-all duration-200 ${
                      isActive(item.url) 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500 text-blue-700 font-medium' 
                        : item.color
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.showBadge && pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs bg-gradient-to-r from-red-500 to-rose-500 border-0">
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
        <div className="text-xs text-muted-foreground bg-gradient-to-r from-slate-500 to-blue-500 bg-clip-text text-transparent">
          v1.0.0 - Beta
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
