
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout/Layout'
import Index from '@/pages/Index'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Videos from '@/pages/Videos'
import Blocks from '@/pages/Blocks'
import Categories from '@/pages/Categories'
import Prompts from '@/pages/Prompts'
import Approvals from '@/pages/Approvals'
import Schedule from '@/pages/Schedule'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'
import YouTubeCallback from '@/components/YouTubeCallback'

// Configure React Query with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/callback" element={<YouTubeCallback />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Index />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/videos" element={
                  <ProtectedRoute>
                    <Layout>
                      <Videos />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/blocks" element={
                  <ProtectedRoute>
                    <Layout>
                      <Blocks />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <Layout>
                      <Categories />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/prompts" element={
                  <ProtectedRoute>
                    <Layout>
                      <Prompts />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/approvals" element={
                  <ProtectedRoute>
                    <Layout>
                      <Approvals />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/schedule" element={
                  <ProtectedRoute>
                    <Layout>
                      <Schedule />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
