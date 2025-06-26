
import { z } from "zod"
import { OPENAI_VALIDATION, BITLY_VALIDATION, FORM_VALIDATION } from "./settingsConstants"

export const emailSchema = z.string()
  .min(FORM_VALIDATION.EMAIL_MIN_LENGTH, "Email obrigatório")
  .email("Email inválido")

export const passwordSchema = z.string()
  .min(FORM_VALIDATION.PASSWORD_MIN_LENGTH, "Senha deve ter pelo menos 6 caracteres")

export const apiKeySchema = z.string()
  .min(FORM_VALIDATION.API_KEY_MIN_LENGTH, "API key obrigatória")

export const openaiApiKeySchema = apiKeySchema
  .refine(
    (key) => key.startsWith(OPENAI_VALIDATION.KEY_PREFIX),
    "API key do OpenAI deve começar com 'sk-'"
  )

export const temperatureSchema = z.number()
  .min(OPENAI_VALIDATION.MIN_TEMPERATURE, "Temperature deve ser entre 0 e 1")
  .max(OPENAI_VALIDATION.MAX_TEMPERATURE, "Temperature deve ser entre 0 e 1")

export const maxTokensSchema = z.number()
  .min(OPENAI_VALIDATION.MIN_TOKENS, `Mínimo ${OPENAI_VALIDATION.MIN_TOKENS} tokens`)
  .max(OPENAI_VALIDATION.MAX_TOKENS, `Máximo ${OPENAI_VALIDATION.MAX_TOKENS} tokens`)

export const customDomainSchema = z.string()
  .optional()
  .refine(
    (domain) => !domain || BITLY_VALIDATION.CUSTOM_DOMAIN_PATTERN.test(domain),
    "Formato de domínio inválido"
  )

export const validateForm = <T>(schema: z.ZodSchema<T>, data: T) => {
  const result = schema.safeParse(data)
  return {
    success: result.success,
    errors: result.success ? {} : result.error.formErrors.fieldErrors,
    data: result.success ? result.data : null
  }
}
