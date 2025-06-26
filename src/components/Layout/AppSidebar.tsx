
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { SidebarLogo } from "./Sidebar/SidebarLogo"
import { SidebarNavigation } from "./Sidebar/SidebarNavigation"

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-6 py-4">
        <SidebarLogo />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarNavigation />
      </SidebarContent>
      
      <SidebarFooter className="px-6 py-4">
        <div className="text-xs text-sidebar-foreground/70">
          v1.0.0 - Beta
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
