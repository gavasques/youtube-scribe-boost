
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLocation, useNavigate } from "react-router-dom"
import { User, LogOut, Home } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { DynamicBreadcrumb } from "./DynamicBreadcrumb"

export function AppHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleGoHome = () => {
    navigate("/")
  }

  return (
    <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        
        {/* Home Button - Only show if not already on home */}
        {location.pathname !== "/" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoHome}
            className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        )}
        
        <DynamicBreadcrumb />
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200">
              <User className="w-4 h-4" />
              {user?.email}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-red-600 hover:bg-red-50 focus:bg-red-50">
              <LogOut className="w-4 h-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
