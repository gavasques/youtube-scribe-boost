
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Youtube, Plus, Folder, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { QUICK_ACTIONS } from "@/utils/dashboardConstants"

export function QuickActions() {
  const navigate = useNavigate()

  const actionIcons = {
    connect_youtube: Youtube,
    create_block: Plus,
    add_category: Folder,
    configure_ai: Settings
  }

  const handleAction = (route: string) => {
    navigate(route)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>
          Comece configurando seu sistema para automatizar as descrições
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = actionIcons[action.id as keyof typeof actionIcons]
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => handleAction(action.route)}
              >
                <Icon className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
