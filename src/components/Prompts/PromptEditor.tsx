
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Save } from "lucide-react"
import { Prompt, PromptFormData } from "@/types/prompt"
import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { PromptEditorHeader } from "./PromptEditor/PromptEditorHeader"
import { PromptBasicFields } from "./PromptEditor/PromptBasicFields"
import { PromptParameters } from "./PromptEditor/PromptParameters"
import { PromptTester } from "./PromptEditor/PromptTester"
import { PROMPT_DEFAULTS } from "@/utils/promptConstants"

interface PromptEditorProps {
  open: boolean
  onClose: () => void
  prompt?: Prompt | null
  onSave: (data: PromptFormData) => void
}

export function PromptEditor({ open, onClose, prompt, onSave }: PromptEditorProps) {
  const { toast } = useToast()

  const form = useForm<PromptFormData>({
    defaultValues: {
      name: "",
      description: "",
      prompt: "",
      temperature: PROMPT_DEFAULTS.DEFAULT_TEMPERATURE,
      max_tokens: PROMPT_DEFAULTS.DEFAULT_MAX_TOKENS,
      top_p: PROMPT_DEFAULTS.DEFAULT_TOP_P,
      test_input: "",
    },
  })

  const isEditing = !!prompt

  useEffect(() => {
    if (open) {
      if (prompt) {
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
        form.reset({
          name: "",
          description: "",
          prompt: "",
          temperature: PROMPT_DEFAULTS.DEFAULT_TEMPERATURE,
          max_tokens: PROMPT_DEFAULTS.DEFAULT_MAX_TOKENS,
          top_p: PROMPT_DEFAULTS.DEFAULT_TOP_P,
          test_input: "",
        })
      }
    }
  }, [prompt, open, form])

  const onSubmit = (data: PromptFormData) => {
    onSave(data)
    toast({
      title: "Prompt salvo",
      description: "O prompt foi salvo com sucesso.",
    })
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <PromptEditorHeader isEditing={isEditing} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <PromptBasicFields form={form} />
            <PromptParameters form={form} />
            <PromptTester form={form} />

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
