
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { BLOCK_TYPE_LABELS } from "@/utils/blockConstants"
import { UseFormReturn } from "react-hook-form"

interface BlockTypeSelectorProps {
  form: UseFormReturn<any>
}

export function BlockTypeSelector({ form }: BlockTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Tipo do Bloco</FormLabel>
          <FormControl>
            <select
              className="w-full px-3 py-2 border rounded-md"
              {...field}
            >
              <option value="GLOBAL">{BLOCK_TYPE_LABELS.GLOBAL}</option>
              <option value="CATEGORY_SPECIFIC">{BLOCK_TYPE_LABELS.CATEGORY_SPECIFIC}</option>
            </select>
          </FormControl>
        </FormItem>
      )}
    />
  )
}
