
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
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendente</Badge>
      case "running":
        return <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">Executando</Badge>
      case "completed":
        return <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">Concluída</Badge>
      default:
        return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-rose-500 border-0">Erro</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Agenda
          </h1>
          <p className="text-muted-foreground">
            Gerencie tarefas agendadas e automações
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-0">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-semibold text-cyan-800">{task.name}</h3>
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
                      <Button variant="outline" size="sm" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                        <Play className="w-4 h-4" />
                        Executar
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                        <Pause className="w-4 h-4" />
                        Pausar
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
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
