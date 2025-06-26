
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('ProgressChart useEffect triggered, user:', user?.id)
    
    if (!user) {
      console.log('No user in ProgressChart, setting loading to false')
      setLoading(false)
      return
    }

    const fetchProgress = async () => {
      try {
        console.log('Fetching progress data for user:', user.id)
        
        // Verificar conexão YouTube
        console.log('Checking YouTube tokens...')
        const { data: youtubeTokens, error: tokensError } = await supabase
          .from('youtube_tokens')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (tokensError) {
          console.error('Error fetching YouTube tokens:', tokensError)
        }
        console.log('YouTube tokens result:', youtubeTokens)

        // Contar blocos ativos
        console.log('Counting active blocks...')
        const { count: blocksCount, error: blocksError } = await supabase
          .from('blocks')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (blocksError) {
          console.error('Error counting blocks:', blocksError)
        }
        console.log('Blocks count:', blocksCount)

        // Contar categorias
        console.log('Counting categories...')
        const { count: categoriesCount, error: categoriesError } = await supabase
          .from('categories')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (categoriesError) {
          console.error('Error counting categories:', categoriesError)
        }
        console.log('Categories count:', categoriesCount)

        // Contar prompts ativos
        console.log('Counting prompts...')
        const { count: promptsCount, error: promptsError } = await supabase
          .from('prompts')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (promptsError) {
          console.error('Error counting prompts:', promptsError)
        }
        console.log('Prompts count:', promptsCount)

        // Contar vídeos processados (com AI)
        console.log('Counting processed videos...')
        const { count: processedVideos, error: videosError } = await supabase
          .from('videos')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .not('ai_description', 'is', null)

        if (videosError) {
          console.error('Error counting processed videos:', videosError)
        }
        console.log('Processed videos count:', processedVideos)

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

        console.log('Final progress data:', newProgressData)
        setProgressData(newProgressData)
        setError(null)
      } catch (error) {
        console.error('Erro ao carregar progresso:', error)
        setError(error.message || 'Erro desconhecido')
      } finally {
        console.log('ProgressChart setting loading to false')
        setLoading(false)
      }
    }

    fetchProgress()
  }, [user])

  if (loading) {
    console.log('ProgressChart rendering loading state')
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progresso de Configuração</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.log('ProgressChart rendering error state:', error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progresso de Configuração</CardTitle>
          <CardDescription>Erro ao carregar dados: {error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const overallProgress = progressData.reduce((acc, item) => acc + item.progress, 0) / progressData.length

  console.log('ProgressChart rendering main content, overall progress:', overallProgress)

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
