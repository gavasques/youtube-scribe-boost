
import { z } from 'zod'
import { CATEGORY_DEFAULTS, CATEGORY_MESSAGES } from './categoryConstants'

export const categoryValidationSchema = z.object({
  name: z.string()
    .min(CATEGORY_DEFAULTS.MIN_NAME_LENGTH, CATEGORY_MESSAGES.ERRORS.NAME_REQUIRED)
    .max(CATEGORY_DEFAULTS.MAX_NAME_LENGTH, CATEGORY_MESSAGES.ERRORS.NAME_TOO_LONG)
    .transform(val => val.trim()),
  description: z.string()
    .max(CATEGORY_DEFAULTS.MAX_DESCRIPTION_LENGTH, CATEGORY_MESSAGES.ERRORS.DESCRIPTION_TOO_LONG)
    .optional()
    .transform(val => val?.trim() || ''),
  is_active: z.boolean().optional().default(CATEGORY_DEFAULTS.DEFAULT_ACTIVE_STATUS)
})

export type CategoryValidationData = z.infer<typeof categoryValidationSchema>

export const validateCategoryForm = (data: unknown) => {
  return categoryValidationSchema.safeParse(data)
}
