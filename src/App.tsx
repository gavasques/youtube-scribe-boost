
import { Routes, Route } from "react-router-dom"
import { Layout } from "@/components/Layout/Layout"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// Direct imports instead of barrel exports to avoid circular dependencies
import DashboardPage from "@/features/dashboard/pages/DashboardPage"
import BlocksPage from "@/features/blocks/pages/BlocksPage"
import CategoriesPage from "@/features/categories/pages/CategoriesPage"
import PromptsPage from "@/features/prompts/pages/PromptsPage"
import VideosPage from "@/features/videos/pages/VideosPage"

import Index from "@/pages/Index"
import Auth from "@/pages/Auth"
import Approvals from "@/pages/Approvals"
import Schedule from "@/pages/Schedule"
import Settings from "@/pages/Settings"
import NotFound from "@/pages/NotFound"

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/blocks" element={<BlocksPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/prompts" element={<PromptsPage />} />
                <Route path="/videos" element={<VideosPage />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
