
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"
import { PromptFormData } from "@/types/prompt"
import { PROMPT_FORM_CONFIG } from "@/utils/promptConstants"

interface PromptBasicFieldsProps {
  form: UseFormReturn<PromptFormData>
}

export function PromptBasicFields({ form }: PromptBasicFieldsProps) {
  const { FIELDS } = PROMPT_FORM_CONFIG

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Nome é obrigatório" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{FIELDS.NAME.label}</FormLabel>
              <FormControl>
                <Input placeholder={FIELDS.NAME.placeholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{FIELDS.DESCRIPTION.label}</FormLabel>
              <FormControl>
                <Input placeholder={FIELDS.DESCRIPTION.placeholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="prompt"
        rules={{ required: "Prompt é obrigatório" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{FIELDS.PROMPT.label}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={FIELDS.PROMPT.placeholder}
                className="min-h-[200px] font-mono text-sm"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}
