
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDashboardProgress } from "@/hooks/useDashboardProgress"
import { formatProgressLabel } from "@/utils/dashboardFormatters"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function ProgressChart() {
  const { data: progressData, loading, error } = useDashboardProgress()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progresso de Configuração</CardTitle>
          <CardDescription>Configuração do sistema</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progresso de Configuração</CardTitle>
          <CardDescription>Erro ao carregar dados</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const overallProgress = Math.round(
    progressData.reduce((acc, item) => acc + item.progress, 0) / progressData.length
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Progresso de Configuração
          <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
        </CardTitle>
        <CardDescription>
          {formatProgressLabel(overallProgress)} • Configure todos os itens para começar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {progressData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">{item.progress}%</span>
              </div>
              <Progress 
                value={item.progress} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
