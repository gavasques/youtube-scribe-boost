
// Update App.tsx to use feature-based routing
import { Routes, Route } from "react-router-dom"
import { Layout } from "@/components/Layout/Layout"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// Feature-based imports
import { DashboardPage } from "@/features/dashboard"
import { BlocksPage } from "@/features/blocks"
import { CategoriesPage } from "@/features/categories"
import { PromptsPage } from "@/features/prompts"
import { VideosPage } from "@/features/videos"

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
