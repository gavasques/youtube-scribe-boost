
import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from './input'
import { Textarea } from './textarea'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Switch } from './switch'
import { Button } from './button'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from './form'

export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'switch' | 'number' | 'email' | 'password'
  placeholder?: string
  description?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  rows?: number
  disabled?: boolean
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
  }
}

interface FormBuilderProps {
  form: UseFormReturn<any>
  fields: FormFieldConfig[]
  onSubmit: (data: any) => void
  submitLabel?: string
  isSubmitting?: boolean
  className?: string
}

export function FormBuilder({
  form,
  fields,
  onSubmit,
  submitLabel = 'Salvar',
  isSubmitting = false,
  className = ''
}: FormBuilderProps) {
  const renderField = (fieldConfig: FormFieldConfig) => {
    const { name, label, type, placeholder, options, rows, disabled } = fieldConfig

    return (
      <FormField
        key={name}
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              {type === 'text' && (
                <Input
                  {...field}
                  placeholder={placeholder}
                  disabled={disabled}
                />
              )}
              
              {type === 'textarea' && (
                <Textarea
                  {...field}
                  placeholder={placeholder}
                  rows={rows || 3}
                  disabled={disabled}
                />
              )}
              
              {type === 'select' && (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {type === 'switch' && (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              )}
              
              {type === 'number' && (
                <Input
                  {...field}
                  type="number"
                  placeholder={placeholder}
                  disabled={disabled}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
              
              {type === 'email' && (
                <Input
                  {...field}
                  type="email"
                  placeholder={placeholder}
                  disabled={disabled}
                />
              )}
              
              {type === 'password' && (
                <Input
                  {...field}
                  type="password"
                  placeholder={placeholder}
                  disabled={disabled}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      {fields.map(renderField)}
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
