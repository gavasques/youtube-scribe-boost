
import { Prompt } from '@/types/prompt'

export const formatPromptDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR')
}

export const formatPromptPreview = (prompt: string, maxLength = 100): string => {
  return prompt.length > maxLength 
    ? `${prompt.substring(0, maxLength)}...`
    : prompt
}

export const formatPromptParameters = (prompt: Prompt): string => {
  return `Temp ${prompt.temperature} • Tokens ${prompt.max_tokens} • Top-P ${prompt.top_p}`
}

export const getPromptStatusText = (isActive: boolean): string => {
  return isActive ? 'Ativo' : 'Inativo'
}

export const formatPromptTestResult = (prompt: string, testInput: string): string => {
  const processedPrompt = prompt.replace('{transcription}', testInput)
  return `Prompt processado:\n\n${processedPrompt}\n\n[Resultado simulado da IA baseado no prompt acima]`
}
