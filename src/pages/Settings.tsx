
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ThemeSettings } from "@/components/Settings/ThemeSettings"
import { NotificationSettings } from "@/components/Settings/NotificationSettings"
import { PerformanceSettings } from "@/components/Settings/PerformanceSettings"
import { ApiSettings } from "@/components/Settings/ApiSettings"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Bell, Zap, Shield, HelpCircle, Key } from "lucide-react"
import { SecurityDashboard } from "@/components/security/SecurityDashboard"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { SecurityStatus } from "@/components/security/SecurityStatus"

export default function Settings() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-indigo-600 hover:text-purple-600">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-indigo-700 font-medium">Configurações</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="apis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-indigo-50 to-purple-50">
            <TabsTrigger value="apis" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">APIs</TabsTrigger>
            <TabsTrigger value="theme" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Tema</TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Notificações</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">Performance</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">Segurança</TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="apis">
            <ApiSettings />
          </TabsContent>

          <TabsContent value="theme">
            <ThemeSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-rose-800">
                  <Shield className="w-5 h-5" />
                  Configurações de Segurança
                </CardTitle>
                <CardDescription className="text-rose-600">
                  Gerencie configurações de segurança e monitoramento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityStatus />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <SecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}
