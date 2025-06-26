
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ApiSettings } from "@/components/Settings/ApiSettings"
import { AccountSettings } from "@/components/Settings/Account/AccountSettings"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Settings() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
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

        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-indigo-50 to-purple-50">
            <TabsTrigger value="account" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">Conta</TabsTrigger>
            <TabsTrigger value="apis" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">APIs</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="apis">
            <ApiSettings />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  )
}
