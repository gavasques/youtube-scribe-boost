import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { BlockType, BlockScope } from "@/types/block"

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
  categories: string[]
}

export function BlockForm({ open, onClose, onSave, block, categories }: BlockFormProps) {
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

  // Função para formatar data para input date
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Resetar formulário quando o bloco mudar
  useEffect(() => {
    if (block) {
      console.log('Carregando dados do bloco para edição:', block)
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
      // Resetar para valores padrão quando não há bloco (criação)
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
    console.log('Dados do formulário:', data)
    onSave(data)
    form.reset()
  }

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    const currentCategories = form.getValues("categories")
    if (checked) {
      form.setValue("categories", [...currentCategories, categoryName])
    } else {
      form.setValue("categories", currentCategories.filter(cat => cat !== categoryName))
    }
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
            {/* Título */}
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

            {/* Conteúdo */}
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

            {/* Tipo */}
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
                      <option value="GLOBAL">Global - Aplica a todos os vídeos</option>
                      <option value="CATEGORY_SPECIFIC">Categoria - Aplica apenas a categorias específicas</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Categorias (se tipo for CATEGORY_SPECIFIC) */}
            {watchedType === "CATEGORY_SPECIFIC" && (
              <FormItem>
                <FormLabel>Categorias *</FormLabel>
                <FormDescription>
                  Selecione as categorias onde este bloco será aplicado
                </FormDescription>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={form.watch("categories").includes(category)}
                        onCheckedChange={(checked) => 
                          handleCategoryChange(category, checked as boolean)
                        }
                      />
                      <Label htmlFor={category} className="text-sm">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </FormItem>
            )}

            {/* Escopo */}
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
                      <option value="PERMANENT">Permanente - Sempre ativo</option>
                      <option value="SCHEDULED">Agendado - Ativo apenas em período específico</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Agendamento (se escopo for SCHEDULED) */}
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

            {/* Aplicar a vídeos existentes */}
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
