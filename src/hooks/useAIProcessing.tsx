
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ProcessingSettings {
  model: string
  temperature: number
  maxTokens: number
}

interface ProcessingPrompts {
  summary?: string
  chapters?: string
  description?: string
  tags?: string
  category?: string
}

interface ProcessingResults {
  summary?: string
  description?: string
  tags?: string[]
  chapters?: any
  categoryAnalysis?: string
}

export function useAIProcessing() {
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  const processWithAI = async (
    videoId: string,
    transcription: string,
    prompts: ProcessingPrompts,
    settings: ProcessingSettings
  ): Promise<{ results?: ProcessingResults; errors?: string[] }> => {
    setProcessing(true)
    setProgress(0)

    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Não autenticado')
      }

      setProgress(20)

      const response = await supabase.functions.invoke('ai-processing', {
        body: {
          videoId,
          transcription,
          prompts,
          settings
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      })

      setProgress(80)

      if (response.error) {
        throw new Error(response.error.message)
      }

      setProgress(100)

      toast({
        title: 'Processamento concluído!',
        description: 'O conteúdo foi gerado com sucesso pela IA.',
      })

      return {
        results: response.data.results,
        errors: response.data.errors
      }

    } catch (error) {
      console.error('Erro no processamento de IA:', error)
      toast({
        title: 'Erro no processamento',
        description: 'Não foi possível processar com IA',
        variant: 'destructive'
      })
      throw error
    } finally {
      setProcessing(false)
      setProgress(0)
    }
  }

  const uploadTranscription = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content.length > 100000) { // 100KB limit
          reject(new Error('Arquivo muito grande. Máximo 100KB.'))
          return
        }
        resolve(content)
      }
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'))
      }
      
      reader.readAsText(file)
    })
  }

  return {
    processing,
    progress,
    processWithAI,
    uploadTranscription
  }
}
