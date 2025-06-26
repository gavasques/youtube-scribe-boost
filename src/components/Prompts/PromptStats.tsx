
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Prompt } from "@/types/prompt"

interface PromptStatsProps {
  prompts: Prompt[]
}

export function PromptStats({ prompts }: PromptStatsProps) {
  const activeCount = prompts.filter(p => p.is_active).length
  const totalCount = prompts.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            {activeCount}
          </div>
          <div className="text-sm text-muted-foreground">
            Prompts Ativos
          </div>
          <Badge variant="outline" className="mt-1 border-emerald-300 text-emerald-700">
            Em Uso
          </Badge>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            {totalCount}
          </div>
          <div className="text-sm text-muted-foreground">
            Total de Prompts
          </div>
          <Badge variant="outline" className="mt-1 border-blue-300 text-blue-700">
            Criados
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
