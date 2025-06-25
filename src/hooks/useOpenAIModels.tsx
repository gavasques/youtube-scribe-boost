
import { useState, useCallback } from 'react'
import { useApiKeys } from './useApiKeys'

interface OpenAIModel {
  id: string
  object: string
  created: number
  owned_by: string
}

interface OpenAIModelsResponse {
  object: string
  data: OpenAIModel[]
}

export function useOpenAIModels() {
  const [models, setModels] = useState<OpenAIModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const { getApiKey, decryptApiKey } = useApiKeys()

  const fetchModels = useCallback(async () => {
    const apiKeyData = getApiKey('openai')
    
    if (!apiKeyData) {
      setError('API key do OpenAI não encontrada')
      return
    }

    const apiKey = decryptApiKey(apiKeyData.encrypted_key)
    
    if (!apiKey) {
      setError('Erro ao descriptografar API key')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erro da API: ${response.status} ${response.statusText}`)
      }

      const data: OpenAIModelsResponse = await response.json()
      
      // Filtrar apenas modelos relevantes (GPT, O1, etc.)
      const relevantModels = data.data.filter(model => 
        model.id.includes('gpt') || 
        model.id.includes('o1') ||
        model.id.includes('text-') ||
        model.id.includes('davinci') ||
        model.id.includes('curie') ||
        model.id.includes('babbage') ||
        model.id.includes('ada')
      ).sort((a, b) => a.id.localeCompare(b.id))

      setModels(relevantModels)
      setLastFetched(new Date())
    } catch (err) {
      console.error('Erro ao buscar modelos OpenAI:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [getApiKey, decryptApiKey])

  const categorizeModels = useCallback((models: OpenAIModel[]) => {
    const categories = {
      'GPT-4': models.filter(m => m.id.includes('gpt-4')),
      'GPT-3.5': models.filter(m => m.id.includes('gpt-3.5')),
      'O1': models.filter(m => m.id.includes('o1')),
      'Outros': models.filter(m => 
        !m.id.includes('gpt-4') && 
        !m.id.includes('gpt-3.5') && 
        !m.id.includes('o1')
      )
    }
    
    // Remove categorias vazias
    Object.keys(categories).forEach(key => {
      if (categories[key as keyof typeof categories].length === 0) {
        delete categories[key as keyof typeof categories]
      }
    })
    
    return categories
  }, [])

  return {
    models,
    loading,
    error,
    lastFetched,
    fetchModels,
    categorizeModels
  }
}
