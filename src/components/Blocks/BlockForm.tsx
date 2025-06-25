
import { useState } from "react"
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
import { Block } from "./BlocksTable"

interface BlockFormData {
  title: string
  description: string
  content: string
  type: 'GLOBAL' | 'CATEGORY'
  scope: 'PERMANENT' | 'SCHEDULED'
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
  block?: Block | null
  categories: string[]
}

export function BlockForm({ open, onClose, onSave, block, categories }: BlockFormProps) {
  const form = useForm<BlockFormData>({
    defaultValues: {
      title: block?.title || "",
      description: block?.description || "",
      content: block?.content || "",
      type: block?.type || "GLOBAL",
      scope: block?.scope || "PERMANENT",
      priority: block?.priority || 0,
      scheduledStart: block?.scheduledStart || "",
      scheduledEnd: block?.scheduledEnd || "",
      categories: block?.categories || [],
      applyToExisting: false,
    },
  })

  const watchedType = form.watch("type")
  const watchedScope = form.watch("scope")

  const handleSubmit = (data: BlockFormData) => {
    onSave(data)
    form.reset()
    onClose()
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

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Breve descrição do bloco..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Descrição opcional para identificar o bloco
                  </FormDescription>
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
                      <option value="CATEGORY">Categoria - Aplica apenas a categorias específicas</option>
                    </select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Categorias (se tipo for CATEGORY) */}
            {watchedType === "CATEGORY" && (
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

            {/* Prioridade */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Ordem de aplicação (0 = menor prioridade)
                  </FormDescription>
                </FormItem>
              )}
            />

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
