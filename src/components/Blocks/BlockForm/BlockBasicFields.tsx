
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from "react-hook-form"

interface BlockBasicFieldsProps {
  form: UseFormReturn<any>
}

export function BlockBasicFields({ form }: BlockBasicFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        rules={{ required: "Título é obrigatório" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título do Bloco *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: CTA Principal" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="content"
        rules={{ required: "Conteúdo é obrigatório" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Conteúdo do Bloco *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Digite o conteúdo que será inserido nas descrições..."
                className="min-h-[120px]"
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
