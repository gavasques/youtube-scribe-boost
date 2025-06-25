
import { useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

interface ModelPreference {
  id: string
  enabled: boolean
}

interface ModelPreferences {
  [modelId: string]: boolean
}

export function useModelPreferences() {
  const [preferences, setPreferences] = useLocalStorage<ModelPreferences>('openai-model-preferences', {})
  const [hasChanges, setHasChanges] = useState(false)

  const isModelEnabled = useCallback((modelId: string): boolean => {
    return preferences[modelId] === true
  }, [preferences])

  const toggleModel = useCallback((modelId: string) => {
    setPreferences(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }))
    setHasChanges(true)
  }, [setPreferences])

  const enableAllModels = useCallback((modelIds: string[]) => {
    const newPreferences: ModelPreferences = {}
    modelIds.forEach(id => {
      newPreferences[id] = true
    })
    setPreferences(newPreferences)
    setHasChanges(true)
  }, [setPreferences])

  const disableAllModels = useCallback((modelIds: string[]) => {
    const newPreferences: ModelPreferences = {}
    modelIds.forEach(id => {
      newPreferences[id] = false
    })
    setPreferences(newPreferences)
    setHasChanges(true)
  }, [setPreferences])

  const getEnabledModels = useCallback((allModels: Array<{id: string}>) => {
    return allModels.filter(model => preferences[model.id] === true)
  }, [preferences])

  const getEnabledCount = useCallback((allModels: Array<{id: string}>) => {
    return allModels.filter(model => preferences[model.id] === true).length
  }, [preferences])

  const saveChanges = useCallback(() => {
    setHasChanges(false)
  }, [])

  const resetToDefaults = useCallback(() => {
    setPreferences({})
    setHasChanges(false)
  }, [setPreferences])

  return {
    isModelEnabled,
    toggleModel,
    enableAllModels,
    disableAllModels,
    getEnabledModels,
    getEnabledCount,
    saveChanges,
    resetToDefaults,
    hasChanges
  }
}
