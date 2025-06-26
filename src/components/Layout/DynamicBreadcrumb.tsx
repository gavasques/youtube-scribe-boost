
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"
import { Home } from "lucide-react"

interface BreadcrumbConfig {
  path: string
  title: string
  icon?: React.ComponentType<{ className?: string }>
}

const breadcrumbConfigs: BreadcrumbConfig[] = [
  { path: "/", title: "Dashboard", icon: Home },
  { path: "/videos", title: "Vídeos" },
  { path: "/blocks", title: "Blocos" },
  { path: "/categories", title: "Categorias" },
  { path: "/prompts", title: "Prompts IA" },
  { path: "/approvals", title: "Aprovações" },
  { path: "/schedule", title: "Agenda" },
  { path: "/settings", title: "Configurações" },
]

export function DynamicBreadcrumb() {
  const location = useLocation()
  
  const getCurrentConfig = () => {
    return breadcrumbConfigs.find(config => config.path === location.pathname)
  }

  const currentConfig = getCurrentConfig()

  if (!currentConfig || location.pathname === "/") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2 text-purple-700 font-medium">
              <Home className="w-4 h-4" />
              Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            href="/" 
            className="flex items-center gap-2 text-blue-600 hover:text-purple-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="flex items-center gap-2 text-purple-700 font-medium">
            {currentConfig.icon && <currentConfig.icon className="w-4 h-4" />}
            {currentConfig.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
