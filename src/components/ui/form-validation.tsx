
import React from 'react'
import { useForm, DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ValidatedFormProps<T extends z.ZodSchema> {
  schema: T
  onSubmit: (data: z.infer<T>) => void | Promise<void>
  defaultValues?: DefaultValues<z.infer<T>>
  children: (form: ReturnType<typeof useForm>) => React.ReactNode
  submitLabel?: string
  isLoading?: boolean
  className?: string
}

export function ValidatedForm<T extends z.ZodSchema>({
  schema,
  onSubmit,
  defaultValues,
  children,
  submitLabel = "Submit",
  isLoading = false,
  className
}: ValidatedFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues
  })

  const handleSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Submission failed'
      })
    }
  }

  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        {hasErrors && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Validation Errors</span>
            </div>
            <div className="mt-2 text-sm text-red-700">
              Please correct the errors below before submitting.
            </div>
          </div>
        )}

        {children(form)}

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <Badge variant="outline" className="text-green-700 border-green-300">
              Validated
            </Badge>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || hasErrors}
            className="min-w-24"
          >
            {isLoading ? 'Submitting...' : submitLabel}
          </Button>
        </div>

        {form.formState.errors.root && (
          <div className="mt-2 text-sm text-red-600">
            {form.formState.errors.root.message}
          </div>
        )}
      </form>
    </Form>
  )
}

export function FormSecurityIndicator({ isValid }: { isValid: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Shield className={`w-4 h-4 ${isValid ? 'text-green-600' : 'text-yellow-600'}`} />
      <span className={isValid ? 'text-green-700' : 'text-yellow-700'}>
        {isValid ? 'Input validated' : 'Validation in progress'}
      </span>
    </div>
  )
}
