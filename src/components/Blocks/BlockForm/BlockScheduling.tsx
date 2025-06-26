
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { BLOCK_SCOPE_LABELS } from "@/utils/blockConstants"
import { UseFormReturn } from "react-hook-form"

interface BlockSchedulingProps {
  form: UseFormReturn<any>
  watchedScope: string
}

export function BlockScheduling({ form, watchedScope }: BlockSchedulingProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="scope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Escopo do Bloco</FormLabel>
            <FormControl>
              <select
                className="w-full px-3 py-2 border rounded-md"
                {...field}
              >
                <option value="PERMANENT">{BLOCK_SCOPE_LABELS.PERMANENT}</option>
                <option value="SCHEDULED">{BLOCK_SCOPE_LABELS.SCHEDULED}</option>
              </select>
            </FormControl>
          </FormItem>
        )}
      />

      {watchedScope === "SCHEDULED" && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="scheduledStart"
            rules={{ required: "Data de início é obrigatória" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Início *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledEnd"
            rules={{ required: "Data de fim é obrigatória" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Fim *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </>
  )
}
