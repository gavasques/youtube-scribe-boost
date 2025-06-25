
import { z } from "zod"

// YouTube URL validation
const youtubeUrlSchema = z.string().refine((url) => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/
  ]
  return patterns.some(pattern => pattern.test(url))
}, "URL do YouTube inválida")

// Video validation schema
export const videoSchema = z.object({
  title: z.string()
    .min(1, "Título é obrigatório")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  youtube_url: youtubeUrlSchema,
  youtube_id: z.string()
    .min(11, "ID do YouTube deve ter 11 caracteres")
    .max(11, "ID do YouTube deve ter 11 caracteres")
    .regex(/^[\w-]+$/, "ID do YouTube contém caracteres inválidos"),
  video_type: z.enum(["REGULAR", "SHORT"]),
  category_id: z.string().uuid().optional(),
  transcription: z.string()
    .max(100000, "Transcrição deve ter no máximo 100KB")
    .optional(),
  update_status: z.enum(["ACTIVE_FOR_UPDATE", "PAUSED", "EXCLUDED"]).optional(),
})

// Block validation schema
export const blockSchema = z.object({
  title: z.string()
    .min(1, "Título é obrigatório")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  description: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  content: z.string()
    .min(1, "Conteúdo é obrigatório")
    .max(5000, "Conteúdo deve ter no máximo 5000 caracteres"),
  type: z.enum(["CTA", "LINKS", "INFO", "PROMOTIONAL", "SEASONAL", "CUSTOM"]),
  scope: z.enum(["PERMANENT", "SEASONAL", "TEMPORARY"]).optional(),
  priority: z.number()
    .min(0, "Prioridade deve ser no mínimo 0")
    .max(100, "Prioridade deve ser no máximo 100")
    .optional(),
  is_active: z.boolean().optional(),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
})

// Category validation schema
export const categorySchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .trim(),
  description: z.string()
    .max(200, "Descrição deve ter no máximo 200 caracteres")
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal")
    .optional(),
  icon: z.string()
    .max(50, "Ícone deve ter no máximo 50 caracteres")
    .optional(),
  is_active: z.boolean().optional(),
  parent_id: z.string().uuid().optional(),
})

// Prompt validation schema
export const promptSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim(),
  description: z.string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  type: z.enum(["SUMMARY", "DESCRIPTION", "TAGS", "CHAPTERS", "CATEGORY"]),
  system_prompt: z.string()
    .min(1, "Prompt do sistema é obrigatório")
    .max(2000, "Prompt do sistema deve ter no máximo 2000 caracteres"),
  user_prompt: z.string()
    .min(1, "Prompt do usuário é obrigatório")
    .max(2000, "Prompt do usuário deve ter no máximo 2000 caracteres"),
  temperature: z.number()
    .min(0, "Temperatura deve ser no mínimo 0")
    .max(2, "Temperatura deve ser no máximo 2")
    .optional(),
  max_tokens: z.number()
    .min(1, "Máximo de tokens deve ser no mínimo 1")
    .max(4000, "Máximo de tokens deve ser no máximo 4000")
    .optional(),
  top_p: z.number()
    .min(0, "Top P deve ser no mínimo 0")
    .max(1, "Top P deve ser no máximo 1")
    .optional(),
  is_active: z.boolean().optional(),
  version: z.string()
    .max(10, "Versão deve ter no máximo 10 caracteres")
    .optional(),
})

// Approval validation schema
export const approvalSchema = z.object({
  type: z.enum(["BLOCK_CHANGE", "MASS_UPDATE", "SYNC_OPERATION", "CATEGORY_CHANGE", "TAG_UPDATE", "SEASONAL_TEMPLATE"]),
  title: z.string()
    .min(1, "Título é obrigatório")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),
  description: z.string()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  data: z.record(z.any()),
  affected_videos_count: z.number()
    .min(0, "Número de vídeos afetados deve ser positivo")
    .optional(),
})

// Utility functions for sanitization
export const sanitizeHtml = (text: string): string => {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

export const sanitizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol')
    }
    return urlObj.toString()
  } catch {
    throw new Error('Invalid URL')
  }
}

export const validateAndSanitizeInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`)
  }
  return result.data
}
