
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Calendar, Play, Pause } from "lucide-react"

export default function Schedule() {
  const tasks = [
    {
      id: "1",
      name: "Ativar Promoção Black Friday", 
      type: "activate_block",
      scheduledFor: "2024-11-20 00:00",
      status: "pending",
      description: "Ativar bloco promocional da Black Friday"
    },
    {
      id: "2",
      name: "Desativar Promoção Black Friday",
      type: "deactivate_block", 
      scheduledFor: "2024-11-30 23:59",
      status: "pending",
      description: "Desativar bloco promocional da Black Friday"
    },
    {
      id: "3",
      name: "Sincronização Semanal",
      type: "sync_videos",
      scheduledFor: "2024-06-30 02:00", 
      status: "completed",
      description: "Sincronização automática com YouTube"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600">Pendente</Badge>
      case "running":
        return <Badge variant="default" className="text-blue-600">Executando</Badge>
      case "completed":
        return <Badge variant="default" className="text-green-600">Concluída</Badge>
      default:
        return <Badge variant="destructive">Erro</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie tarefas agendadas e automações
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">{task.name}</h3>
                    {getStatusBadge(task.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.scheduledFor}
                    </span>
                    <span>Tipo: {task.type}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {task.status === "pending" && (
                    <>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Play className="w-4 h-4" />
                        Executar
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Pause className="w-4 h-4" />
                        Pausar
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
