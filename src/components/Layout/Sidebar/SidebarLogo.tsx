
import { Video } from "lucide-react"

export function SidebarLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
        <Video className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-sm text-sidebar-foreground">
          YT Manager
        </span>
        <span className="text-xs text-sidebar-foreground/70">Description AI</span>
      </div>
    </div>
  )
}
