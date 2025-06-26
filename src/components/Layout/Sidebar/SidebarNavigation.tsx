
import { Calendar, Home, Video, Blocks, FolderTree, Settings, Zap, Clock, CheckCircle } from "lucide-react"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar"
import { SidebarMenuItemComponent } from "./SidebarMenuItem"
import { useApprovals } from "@/hooks/useApprovals"

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

export function SidebarNavigation() {
  const { pendingCount } = useApprovals()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/70 font-semibold">
        Aplicação
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItemComponent
              key={item.title}
              title={item.title}
              url={item.url}
              icon={item.icon}
              showBadge={item.showBadge}
              badgeCount={item.title === "Aprovações" ? pendingCount : 0}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
