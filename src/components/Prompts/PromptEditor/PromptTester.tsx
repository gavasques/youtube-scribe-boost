
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TestTube, Play } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { PromptFormData } from "@/types/prompt"
import { useToast } from "@/hooks/use-toast"
import { formatPromptTestResult } from "@/utils/promptFormatters"
import { PROMPT_FORM_CONFIG, PROMPT_MESSAGES } from "@/utils/promptConstants"

interface PromptTesterProps {
  form: UseFormReturn<PromptFormData>
}

export function PromptTester({ form }: PromptTesterProps) {
  const [testResult, setTestResult] = useState<string>("")
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)
  const { toast } = useToast()

  const handleTestPrompt = async (data: PromptFormData) => {
    if (!data.test_input?.trim()) {
      toast({
        title: "Erro",
        description: PROMPT_MESSAGES.VALIDATION.TEST_INPUT_REQUIRED,
        variant: "destructive",
      })
      return
    }

    setIsTestingPrompt(true)
    
    // Simular chamada para API
    setTimeout(() => {
      const result = formatPromptTestResult(data.prompt, data.test_input || '')
      setTestResult(result)
      setIsTestingPrompt(false)
      toast({
        title: "Teste executado",
        description: PROMPT_MESSAGES.SUCCESS.TEST_EXECUTED,
      })
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Teste do Prompt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="test_input"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{PROMPT_FORM_CONFIG.FIELDS.TEST_INPUT.label}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={PROMPT_FORM_CONFIG.FIELDS.TEST_INPUT.placeholder}
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => handleTestPrompt(form.getValues())}
          disabled={isTestingPrompt}
          className="gap-2"
        >
          {isTestingPrompt ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Testar Prompt
            </>
          )}
        </Button>

        {testResult && (
          <div className="mt-4">
            <Label>Resultado do Teste:</Label>
            <Textarea
              value={testResult}
              readOnly
              className="mt-2 bg-muted min-h-[150px] font-mono text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
