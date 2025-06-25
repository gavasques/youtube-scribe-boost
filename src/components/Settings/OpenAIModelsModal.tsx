
import React, { useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Search, CheckCircle, AlertCircle, Clock, Settings } from "lucide-react"
import { useOpenAIModels } from "@/hooks/useOpenAIModels"
import { useModelPreferences } from "@/hooks/useModelPreferences"
import { ModelSelector } from "./ModelSelector"
import { showSuccessToast, showErrorToast } from "@/components/ui/enhanced-toast"

interface OpenAIModelsModalProps {
  children: React.ReactNode
  onModelSelect: (modelId: string) => void
  currentModel?: string
}

export function OpenAIModelsModal({ children, onModelSelect, currentModel }: OpenAIModelsModalProps) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("browse")
  const { models, loading, error, lastFetched, fetchModels, categorizeModels } = useOpenAIModels()
  const {
    isModelEnabled,
    toggleModel,
    enableAllModels,
    disableAllModels,
    getEnabledCount,
    saveChanges,
    resetToDefaults,
    hasChanges
  } = useModelPreferences()

  useEffect(() => {
    if (open && models.length === 0 && !loading && !error) {
      fetchModels()
    }
  }, [open, models.length, loading, error, fetchModels])

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId)
    setOpen(false)
    showSuccessToast({
      title: "Modelo selecionado",
      description: `Modelo ${modelId} foi selecionado com sucesso`
    })
  }

  const handleRefresh = async () => {
    await fetchModels()
    if (error) {
      showErrorToast({
        title: "Erro ao buscar modelos",
        description: error
      })
    }
  }

  const handleSavePreferences = () => {
    saveChanges()
    showSuccessToast({
      title: "Preferências salvas",
      description: "Suas preferências de modelos foram atualizadas"
    })
  }

  const categorizedModels = categorizeModels(models)
  const enabledCount = getEnabledCount(models)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Gerenciar Modelos OpenAI
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

          {/* Tabs para navegar entre buscar e configurar */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Buscar Modelos
              </TabsTrigger>
              <TabsTrigger value="manage" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Gerenciar ({enabledCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
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
                              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                                currentModel === model.id ? 'bg-blue-50 border-blue-200' : ''
                              } ${!isModelEnabled(model.id) ? 'opacity-50' : ''}`}
                              onClick={() => handleModelSelect(model.id)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{model.id}</span>
                                  {currentModel === model.id && (
                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                  )}
                                  {!isModelEnabled(model.id) && (
                                    <Badge variant="outline" className="text-xs">Desabilitado</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span>Proprietário: {model.owned_by}</span>
                                  <span>Criado: {new Date(model.created * 1000).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <div className="rounded-md border p-4">
                {models.length > 0 ? (
                  <ModelSelector
                    models={models}
                    categorizedModels={categorizedModels}
                    isModelEnabled={isModelEnabled}
                    onToggleModel={toggleModel}
                    onEnableAll={enableAllModels}
                    onDisableAll={disableAllModels}
                    onResetToDefaults={resetToDefaults}
                    enabledCount={enabledCount}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Busque os modelos primeiro para gerenciá-los</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="text-xs text-muted-foreground text-center">
            {models.length > 0 && `${models.length} modelos encontrados • ${enabledCount} habilitados`}
          </div>
        </div>

        {activeTab === "manage" && hasChanges && (
          <DialogFooter>
            <Button onClick={handleSavePreferences}>
              Salvar Preferências
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
