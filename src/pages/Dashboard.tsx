
import { MetricCard } from "@/components/Dashboard/MetricCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Blocks, Clock, Zap, TrendingUp, AlertCircle, CheckCircle, Upload } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu canal e atividades recentes
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Transcrição
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Vídeos"
          value={147}
          description="23 aguardando processamento"
          icon={Video}
          trend={{ value: "+12%", isPositive: true }}
        />
        <MetricCard
          title="Blocos Ativos"
          value={8}
          description="3 universais, 5 por categoria"
          icon={Blocks}
        />
        <MetricCard
          title="Processamento IA"
          value="85%"
          description="Vídeos com descrições otimizadas"
          icon={Zap}
          trend={{ value: "+8%", isPositive: true }}
        />
        <MetricCard
          title="Tarefas Agendadas"
          value={5}
          description="2 executarão hoje"
          icon={Clock}
        />
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Vídeos Configurados
            </CardTitle>
            <CardDescription>
              Vídeos com descrições completas e atualizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">124</div>
            <p className="text-sm text-muted-foreground">84% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Requer Atenção
            </CardTitle>
            <CardDescription>
              Vídeos que precisam de revisão manual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">12</div>
            <p className="text-sm text-muted-foreground">8% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Performance
            </CardTitle>
            <CardDescription>
              Melhoria média no CTR das descrições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+23%</div>
            <p className="text-sm text-muted-foreground">vs. mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas ações e processamentos realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "Vídeo processado com IA",
                description: "Como Criar Apps com IA em 2024",
                time: "há 2 minutos",
                status: "success"
              },
              {
                action: "Bloco agendado ativado",
                description: "Promoção Black Friday",
                time: "há 1 hora",
                status: "info"
              },
              {
                action: "Sincronização com YouTube",
                description: "47 vídeos atualizados",
                time: "há 3 horas", 
                status: "success"
              },
              {
                action: "Erro no processamento",
                description: "Tutorial React - transcrição inválida",
                time: "há 5 horas",
                status: "error"
              }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
