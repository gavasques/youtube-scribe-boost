
import React, { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Search, AlertCircle, Clock } from "lucide-react"
import { useOpenAIModels } from "@/hooks/useOpenAIModels"
import { showErrorToast } from "@/components/ui/enhanced-toast"

interface OpenAIModelsModalProps {
  children: React.ReactNode
}

export function OpenAIModelsModal({ children }: OpenAIModelsModalProps) {
  const [open, setOpen] = React.useState(false)
  const { models, loading, error, lastFetched, fetchModels, categorizeModels } = useOpenAIModels()

  useEffect(() => {
    if (open && models.length === 0 && !loading && !error) {
      fetchModels()
    }
  }, [open, models.length, loading, error, fetchModels])

  const handleRefresh = async () => {
    await fetchModels()
    if (error) {
      showErrorToast({
        title: "Erro ao buscar modelos",
        description: error
      })
    }
  }

  const categorizedModels = categorizeModels(models)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Modelos OpenAI Disponíveis (Consulta)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Header com informações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {lastFetched && (
                <>
                  <Clock className="w-4 h-4" />
                  Última busca: {lastFetched.toLocaleTimeString()}
                </>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Conteúdo */}
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                <span>Buscando modelos...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Erro ao buscar modelos</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && models.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum modelo encontrado</p>
                <p className="text-sm">Verifique sua API key</p>
              </div>
            )}

            {!loading && !error && models.length > 0 && (
              <div className="space-y-6">
                {Object.entries(categorizedModels).map(([category, categoryModels]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      {category}
                      <Badge variant="secondary">{categoryModels.length}</Badge>
                    </h3>
                    
                    <div className="space-y-2">
                      {categoryModels.map((model) => (
                        <div
                          key={model.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/25"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{model.id}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>Proprietário: {model.owned_by}</span>
                              <span>Criado: {new Date(model.created * 1000).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {category !== Object.keys(categorizedModels)[Object.keys(categorizedModels).length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="text-xs text-muted-foreground text-center">
            {models.length > 0 && `${models.length} modelos encontrados - Use o campo de texto para inserir o modelo desejado`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
