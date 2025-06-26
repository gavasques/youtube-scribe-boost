
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { BlockType, BlockScope } from "@/types/block"
import { Category } from "@/types/category"
import { formatDateForInput } from "@/utils/blockFormatters"
import { BlockBasicFields } from "./BlockForm/BlockBasicFields"
import { BlockTypeSelector } from "./BlockForm/BlockTypeSelector"
import { CategorySelector } from "./BlockForm/CategorySelector"
import { BlockScheduling } from "./BlockForm/BlockScheduling"

interface BlockFormData {
  title: string
  content: string
  type: BlockType
  scope: BlockScope
  priority: number
  scheduledStart?: string
  scheduledEnd?: string
  categories: string[]
  applyToExisting: boolean
}

interface BlockFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: BlockFormData) => void
  block?: {
    id: string
    title: string
    description?: string
    content: string
    type: BlockType
    scope: BlockScope
    priority: number
    isActive: boolean
    scheduledStart?: string
    scheduledEnd?: string
    categories: string[]
    videosAffected: number
    createdAt: string
  } | null
  categories: Category[]
  categoriesLoading?: boolean
}

export function BlockForm({ 
  open, 
  onClose, 
  onSave, 
  block, 
  categories, 
  categoriesLoading = false 
}: BlockFormProps) {
  const form = useForm<BlockFormData>({
    defaultValues: {
      title: "",
      content: "",
      type: "GLOBAL",
      scope: "PERMANENT",
      priority: 0,
      scheduledStart: "",
      scheduledEnd: "",
      categories: [],
      applyToExisting: false,
    },
  })

  const watchedType = form.watch("type")
  const watchedScope = form.watch("scope")
  const selectedCategories = form.watch("categories")

  useEffect(() => {
    if (block) {
      form.reset({
        title: block.title,
        content: block.content,
        type: block.type,
        scope: block.scope,
        priority: block.priority,
        scheduledStart: formatDateForInput(block.scheduledStart),
        scheduledEnd: formatDateForInput(block.scheduledEnd),
        categories: block.categories || [],
        applyToExisting: false,
      })
    } else {
      form.reset({
        title: "",
        content: "",
        type: "GLOBAL",
        scope: "PERMANENT",
        priority: 0,
        scheduledStart: "",
        scheduledEnd: "",
        categories: [],
        applyToExisting: false,
      })
    }
  }, [block, form])

  const handleSubmit = (data: BlockFormData) => {
    onSave(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {block ? "Editar Bloco" : "Criar Novo Bloco"}
          </DialogTitle>
          <DialogDescription>
            Configure um bloco de conteúdo para suas descrições de vídeo
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <BlockBasicFields form={form} />
            
            <BlockTypeSelector form={form} />

            {watchedType === "CATEGORY_SPECIFIC" && (
              <CategorySelector
                form={form}
                categories={categories}
                categoriesLoading={categoriesLoading}
                selectedCategories={selectedCategories}
              />
            )}

            <BlockScheduling form={form} watchedScope={watchedScope} />

            {!block && (
              <FormField
                control={form.control}
                name="applyToExisting"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel>Aplicar a vídeos existentes</FormLabel>
                      <FormDescription>
                        Aplicar este bloco aos vídeos já importados
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {block ? "Salvar Alterações" : "Criar Bloco"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
