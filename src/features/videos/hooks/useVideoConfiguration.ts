
import { useState, useCallback } from 'react'
import { VideoConfiguration } from '../types/normalized'
import { VideoConfigurationService } from '../services/VideoConfigurationService'
import { useToast } from '@/hooks/use-toast'

export function useVideoConfiguration() {
  const [configurations, setConfigurations] = useState<Record<string, VideoConfiguration>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const fetchConfiguration = useCallback(async (videoId: string) => {
    try {
      setLoading(prev => ({ ...prev, [videoId]: true }))
      const data = await VideoConfigurationService.getVideoConfiguration(videoId)
      if (data) {
        setConfigurations(prev => ({ ...prev, [videoId]: data }))
      }
      return data
    } catch (error) {
      console.error('Error fetching configuration:', error)
    } finally {
      setLoading(prev => ({ ...prev, [videoId]: false }))
    }
  }, [])

  const updateStatus = useCallback(async (videoId: string, configStatus?: string, updateStatus?: string) => {
    try {
      const updated = await VideoConfigurationService.updateStatus(videoId, configStatus, updateStatus)
      setConfigurations(prev => ({ ...prev, [videoId]: updated }))
      toast({
        title: 'Status atualizado',
        description: 'Status do vídeo foi atualizado com sucesso.',
      })
      return updated
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status.',
        variant: 'destructive',
      })
      throw error
    }
  }, [toast])

  return {
    configurations,
    loading,
    fetchConfiguration,
    updateStatus
  }
}
