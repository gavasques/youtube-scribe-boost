
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function ProgressChart() {
  const progressData = [
    {
      label: "Conexão YouTube",
      progress: 0,
      description: "Conecte sua conta para começar"
    },
    {
      label: "Blocos Configurados",
      progress: 70,
      description: "7 de 10 blocos recomendados"
    },
    {
      label: "Categorias Criadas",
      progress: 40,
      description: "4 de 10 categorias sugeridas"
    },
    {
      label: "Prompts IA",
      progress: 0,
      description: "Configure os prompts de processamento"
    },
    {
      label: "Vídeos Processados",
      progress: 0,
      description: "Nenhum vídeo processado ainda"
    }
  ]

  const overallProgress = progressData.reduce((acc, item) => acc + item.progress, 0) / progressData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Progresso de Personalização
          <span className="text-2xl font-bold text-primary">
            {Math.round(overallProgress)}%
          </span>
        </CardTitle>
        <CardDescription>
          Complete a configuração para aproveitar ao máximo o sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso Geral</span>
              <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Individual Progress Items */}
          <div className="grid gap-4 md:grid-cols-2">
            {progressData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
