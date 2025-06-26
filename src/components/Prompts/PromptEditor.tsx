
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Brain, Play, Save, TestTube } from "lucide-react"
import { Prompt, PromptFormData } from "@/types/prompt"
import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface PromptEditorProps {
  open: boolean
  onClose: () => void
  prompt?: Prompt | null
  onSave: (data: PromptFormData) => void
}

export function PromptEditor({ open, onClose, prompt, onSave }: PromptEditorProps) {
  const [testResult, setTestResult] = useState<string>("")
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)
  const { toast } = useToast()

  const form = useForm<PromptFormData>({
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
      test_input: "",
    },
  })

  // Atualizar formulário quando prompt for selecionado para edição
  useEffect(() => {
    if (open) {
      if (prompt) {
        // Edição: carregar dados do prompt
        form.reset({
          name: prompt.name,
          description: prompt.description || "",
          prompt: prompt.prompt,
          temperature: prompt.temperature,
          max_tokens: prompt.max_tokens,
          top_p: prompt.top_p,
          test_input: "",
        })
      } else {
        // Criação: resetar para valores padrão
        form.reset({
          name: "",
          description: "",
          prompt: "",
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
          test_input: "",
        })
      }
      // Limpar resultado de teste quando abrir o modal
      setTestResult("")
    }
  }, [prompt, open, form])

  const handleTestPrompt = async (data: PromptFormData) => {
    if (!data.test_input?.trim()) {
      toast({
        title: "Erro",
        description: "Digite um texto de teste para executar o prompt.",
        variant: "destructive",
      })
      return
    }

    setIsTestingPrompt(true)
    
    // Simular chamada para API
    setTimeout(() => {
      const processedPrompt = data.prompt.replace('{transcription}', data.test_input || '')
      setTestResult(`Prompt processado:\n\n${processedPrompt}\n\n[Resultado simulado da IA baseado no prompt acima]`)
      setIsTestingPrompt(false)
      toast({
        title: "Teste executado",
        description: "O prompt foi testado com sucesso.",
      })
    }, 2000)
  }

  const onSubmit = (data: PromptFormData) => {
    onSave(data)
    onClose()
    toast({
      title: "Prompt salvo",
      description: "O prompt foi salvo com sucesso.",
    })
  }

  const handleClose = () => {
    // Resetar formulário e limpar teste ao fechar
    form.reset()
    setTestResult("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            {prompt ? "Editar Prompt" : "Novo Prompt"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "Nome é obrigatório" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Prompt</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do prompt" {...field} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Descreva brevemente o que este prompt faz"
                        {...field}
                      />
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
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Digite o prompt completo aqui. Use {transcription} para onde a transcrição será inserida..."
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parâmetros */}
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
                            min={0}
                            max={2}
                            step={0.1}
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
                      min: { value: 1, message: "Mínimo 1 token" },
                      max: { value: 8000, message: "Máximo 8000 tokens" }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            max={8000}
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
                            min={0}
                            max={1}
                            step={0.1}
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

            {/* Teste do Prompt */}
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
                      <FormLabel>Texto de Teste</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cole um texto para testar o prompt..."
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

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                Salvar Prompt
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
