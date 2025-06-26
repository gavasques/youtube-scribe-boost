
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { UseFormReturn } from "react-hook-form"
import { PromptFormData } from "@/types/prompt"
import { PROMPT_DEFAULTS } from "@/utils/promptConstants"

interface PromptParametersProps {
  form: UseFormReturn<PromptFormData>
}

export function PromptParameters({ form }: PromptParametersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Parâmetros do Modelo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={PROMPT_DEFAULTS.MIN_TEMPERATURE}
                    max={PROMPT_DEFAULTS.MAX_TEMPERATURE}
                    step={PROMPT_DEFAULTS.TEMPERATURE_STEP}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_tokens"
            rules={{ 
              required: "Max tokens é obrigatório",
              min: { value: PROMPT_DEFAULTS.MIN_TOKENS, message: "Mínimo 1 token" },
              max: { value: PROMPT_DEFAULTS.MAX_TOKENS, message: "Máximo 8000 tokens" }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={PROMPT_DEFAULTS.MIN_TOKENS}
                    max={PROMPT_DEFAULTS.MAX_TOKENS}
                    placeholder="1000"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="top_p"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Top P: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={PROMPT_DEFAULTS.MIN_TOP_P}
                    max={PROMPT_DEFAULTS.MAX_TOP_P}
                    step={PROMPT_DEFAULTS.TOP_P_STEP}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
