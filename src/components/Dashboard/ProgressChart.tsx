
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

interface ProgressData {
  label: string
  progress: number
  description: string
}

export function ProgressChart() {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState<ProgressData[]>([
    {
      label: "Conexão YouTube",
      progress: 0,
      description: "Conecte sua conta para começar"
    },
    {
      label: "Blocos Configurados",
      progress: 0,
      description: "Configure seus blocos de conteúdo"
    },
    {
      label: "Categorias Criadas",
      progress: 0,
      description: "Organize seus vídeos por categorias"
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
  ])

  useEffect(() => {
    if (!user) return

    const fetchProgress = async () => {
      try {
        // Verificar conexão YouTube
        const { data: youtubeTokens } = await supabase
          .from('youtube_tokens')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        // Contar blocos ativos
        const { count: blocksCount } = await supabase
          .from('blocks')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        // Contar categorias
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        // Contar prompts ativos
        const { count: promptsCount } = await supabase
          .from('prompts')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        // Contar vídeos processados (com AI)
        const { count: processedVideos } = await supabase
          .from('videos')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .not('ai_description', 'is', null)

        const newProgressData: ProgressData[] = [
          {
            label: "Conexão YouTube",
            progress: youtubeTokens ? 100 : 0,
            description: youtubeTokens ? "Conectado com sucesso" : "Conecte sua conta para começar"
          },
          {
            label: "Blocos Configurados",
            progress: Math.min((blocksCount || 0) * 10, 100),
            description: `${blocksCount || 0} blocos criados`
          },
          {
            label: "Categorias Criadas",
            progress: Math.min((categoriesCount || 0) * 20, 100),
            description: `${categoriesCount || 0} categorias criadas`
          },
          {
            label: "Prompts IA",
            progress: Math.min((promptsCount || 0) * 25, 100),
            description: `${promptsCount || 0} prompts configurados`
          },
          {
            label: "Vídeos Processados",
            progress: Math.min((processedVideos || 0) * 5, 100),
            description: `${processedVideos || 0} vídeos processados`
          }
        ]

        setProgressData(newProgressData)
      } catch (error) {
        console.error('Erro ao carregar progresso:', error)
      }
    }

    fetchProgress()
  }, [user])

  const overallProgress = progressData.reduce((acc, item) => acc + item.progress, 0) / progressData.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Progresso de Configuração
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
