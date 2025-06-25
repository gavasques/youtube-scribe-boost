
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AppSidebar } from "@/components/Layout/AppSidebar"
import { AppHeader } from "@/components/Layout/AppHeader"
import Index from "@/pages/Index"
import Auth from "@/pages/Auth"
import Dashboard from "@/pages/Dashboard"
import Videos from "@/pages/Videos"
import Categories from "@/pages/Categories"
import Blocks from "@/pages/Blocks"
import Prompts from "@/pages/Prompts"
import Schedule from "@/pages/Schedule"
import Settings from "@/pages/Settings"
import NotFound from "@/pages/NotFound"
import YouTubeCallback from "@/components/YouTubeCallback"
import "./App.css"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/youtube/callback" element={<YouTubeCallback />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <AppHeader />
                      <main className="flex-1 p-6">
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/videos" element={<Videos />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/blocks" element={<Blocks />} />
                          <Route path="/prompts" element={<Prompts />} />
                          <Route path="/schedule" element={<Schedule />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  )
}

export default App
