
import { useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Video } from '@/types/video'
import { Block, BlockType } from '@/types/block'

interface CompilerOptions {
  includeBitlyShortening?: boolean
  maxLength?: number
}

interface CompilationResult {
  compiledDescription: string
  appliedBlocks: Block[]
  variables: Record<string, string>
  warnings: string[]
  characterCount: number
}

export function useDescriptionCompiler() {
  const { toast } = useToast()
  const [compiling, setCompiling] = useState(false)
  const [applying, setApplying] = useState(false)

  // Substituir variáveis dinâmicas no conteúdo
  const replaceVariables = useCallback((content: string, video: Video): string => {
    const variables = {
      '{{VIDEO_TITLE}}': video.title,
      '{{CHANNEL_NAME}}': 'Seu Canal', // TODO: buscar do perfil do usuário
      '{{PUBLISH_DATE}}': video.published_at ? new Date(video.published_at).toLocaleDateString('pt-BR') : 'Data não disponível',
      '{{VIDEO_URL}}': video.youtube_url,
      '{{CURRENT_DATE}}': new Date().toLocaleDateString('pt-BR'),
      '{{CURRENT_YEAR}}': new Date().getFullYear().toString()
    }

    let result = content
    Object.entries(variables).forEach(([variable, value]) => {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    })

    return result
  }, [])

  // Buscar blocos aplicáveis ao vídeo
  const getApplicableBlocks = useCallback(async (video: Video): Promise<Block[]> => {
    try {
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) throw error

      const now = new Date()
      
      return (blocks || []).filter(block => {
        // Filtrar blocos globais sempre aplicáveis
        if (block.type === 'GLOBAL') {
          // Verificar agendamento para blocos temporários
          if (block.scope === 'SCHEDULED') {
            const startDate = block.scheduled_start ? new Date(block.scheduled_start) : null
            const endDate = block.scheduled_end ? new Date(block.scheduled_end) : null
            
            if (startDate && now < startDate) return false
            if (endDate && now > endDate) return false
          }
          return true
        }
        
        // Filtrar blocos de categoria específica
        if (block.type === 'CATEGORY_SPECIFIC' && video.category_id) {
          // TODO: Implementar lógica de blocos por categoria quando a tabela de relacionamento estiver pronta
          return false
        }
        
        return false
      }).map(block => ({
        ...block,
        type: block.type as BlockType,
        scope: block.scope as 'PERMANENT' | 'SCHEDULED'
      }))
    } catch (error) {
      console.error('Erro ao buscar blocos aplicáveis:', error)
      return []
    }
  }, [])

  // Compilar descrição completa
  const compileDescription = useCallback(async (
    video: Video, 
    options: CompilerOptions = {}
  ): Promise<CompilationResult> => {
    setCompiling(true)
    const warnings: string[] = []

    try {
      // Buscar blocos aplicáveis
      const applicableBlocks = await getApplicableBlocks(video)
      
      // Montar seções da descrição
      const sections: string[] = []
      
      // 1. Descrição gerada por IA (se disponível)
      if (video.ai_description) {
        sections.push(video.ai_description)
        sections.push('') // linha em branco
      }
      
      // 2. Blocos ordenados por prioridade
      applicableBlocks.forEach(block => {
        const processedContent = replaceVariables(block.content, video)
        sections.push(processedContent)
        sections.push('') // linha em branco entre blocos
      })
      
      // 3. Capítulos (se disponíveis)
      if (video.ai_chapters && Array.isArray(video.ai_chapters) && video.ai_chapters.length > 0) {
        sections.push('⏰ CAPÍTULOS:')
        video.ai_chapters.forEach((chapter: any) => {
          sections.push(`${chapter.timestamp} - ${chapter.title}`)
        })
        sections.push('') // linha em branco
      }
      
      // Compilar descrição final
      let compiledDescription = sections.join('\n').trim()
      
      // Validar tamanho (YouTube tem limite de 5000 caracteres)
      const maxLength = options.maxLength || 5000
      if (compiledDescription.length > maxLength) {
        warnings.push(`Descrição muito longa (${compiledDescription.length} caracteres). Limite do YouTube: ${maxLength} caracteres.`)
        compiledDescription = compiledDescription.substring(0, maxLength - 3) + '...'
      }
      
      return {
        compiledDescription,
        appliedBlocks: applicableBlocks,
        variables: {
          '{{VIDEO_TITLE}}': video.title,
          '{{CHANNEL_NAME}}': 'Seu Canal',
          '{{PUBLISH_DATE}}': video.published_at ? new Date(video.published_at).toLocaleDateString('pt-BR') : 'Data não disponível',
          '{{VIDEO_URL}}': video.youtube_url,
          '{{CURRENT_DATE}}': new Date().toLocaleDateString('pt-BR'),
          '{{CURRENT_YEAR}}': new Date().getFullYear().toString()
        },
        warnings,
        characterCount: compiledDescription.length
      }
      
    } catch (error) {
      console.error('Erro na compilação:', error)
      throw error
    } finally {
      setCompiling(false)
    }
  }, [getApplicableBlocks, replaceVariables])

  // Aplicar descrição compilada no YouTube
  const applyToYouTube = useCallback(async (video: Video, compiledDescription: string) => {
    setApplying(true)
    
    try {
      const { data: authData } = await supabase.auth.getSession()
      if (!authData.session) {
        throw new Error('Usuário não autenticado')
      }

      // Fazer backup da descrição atual
      const { error: backupError } = await supabase
        .from('videos')
        .update({
          original_description: video.current_description || video.original_description,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id)

      if (backupError) {
        console.error('Erro ao fazer backup:', backupError)
      }

      // Aplicar no YouTube via Edge Function
      const response = await supabase.functions.invoke('apply-description', {
        body: {
          videoId: video.youtube_id,
          description: compiledDescription
        },
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      // Atualizar vídeo no banco
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          current_description: compiledDescription,
          compiled_description: compiledDescription,
          configuration_status: 'CONFIGURED',
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id)

      if (updateError) throw updateError

      toast({
        title: 'Descrição aplicada com sucesso!',
        description: 'A descrição foi atualizada no YouTube.',
      })

      return { success: true }

    } catch (error) {
      console.error('Erro ao aplicar no YouTube:', error)
      toast({
        title: 'Erro ao aplicar descrição',
        description: error.message || 'Não foi possível atualizar a descrição no YouTube.',
        variant: 'destructive'
      })
      throw error
    } finally {
      setApplying(false)
    }
  }, [toast])

  return {
    compiling,
    applying,
    compileDescription,
    applyToYouTube
  }
}
