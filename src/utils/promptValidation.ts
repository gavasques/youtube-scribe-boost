
import { z } from 'zod'
import { PROMPT_DEFAULTS } from './promptConstants'

export const promptFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().default(''),
  prompt: z.string().min(1, 'Prompt é obrigatório'),
  temperature: z.number()
    .min(PROMPT_DEFAULTS.MIN_TEMPERATURE)
    .max(PROMPT_DEFAULTS.MAX_TEMPERATURE)
    .default(PROMPT_DEFAULTS.DEFAULT_TEMPERATURE),
  max_tokens: z.number()
    .int()
    .min(PROMPT_DEFAULTS.MIN_TOKENS, 'Mínimo 1 token')
    .max(PROMPT_DEFAULTS.MAX_TOKENS, 'Máximo 8000 tokens')
    .default(PROMPT_DEFAULTS.DEFAULT_MAX_TOKENS),
  top_p: z.number()
    .min(PROMPT_DEFAULTS.MIN_TOP_P)
    .max(PROMPT_DEFAULTS.MAX_TOP_P)
    .default(PROMPT_DEFAULTS.DEFAULT_TOP_P),
  test_input: z.string().optional()
})

export type PromptFormValidation = z.infer<typeof promptFormSchema>

export function validatePromptForm(data: any) {
  return promptFormSchema.safeParse(data)
}
