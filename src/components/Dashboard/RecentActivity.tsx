
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RecentActivity() {
  const activities = [
    {
      action: "Sistema inicializado",
      description: "Bem-vindo ao YT Description Manager",
      time: "agora",
      type: "info" as const
    },
    {
      action: "Bloco criado",
      description: "Bloco 'Introdução Padrão' foi criado",
      time: "há 5 minutos",
      type: "success" as const
    },
    {
      action: "Categoria adicionada",
      description: "Categoria 'Tutoriais' foi adicionada",
      time: "há 10 minutos",
      type: "success" as const
    },
    {
      action: "Configuração salva",
      description: "Preferências do sistema foram atualizadas",
      time: "há 15 minutos",
      type: "info" as const
    },
    {
      action: "Conta criada",
      description: "Sua conta foi criada com sucesso",
      time: "há 20 minutos",
      type: "success" as const
    }
  ]

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Aviso</Badge>
      default:
        return <Badge variant="secondary">Info</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          Últimas ações e eventos do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
              <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.type)}`} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.action}</p>
                  {getStatusBadge(activity.type)}
                </div>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma atividade recente</p>
            <p className="text-sm">As ações do sistema aparecerão aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
