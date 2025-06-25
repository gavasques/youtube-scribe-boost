
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckSquare, Square, RotateCcw } from "lucide-react"

interface OpenAIModel {
  id: string
  object: string
  created: number
  owned_by: string
}

interface ModelSelectorProps {
  models: OpenAIModel[]
  categorizedModels: Record<string, OpenAIModel[]>
  isModelEnabled: (modelId: string) => boolean
  onToggleModel: (modelId: string) => void
  onEnableAll: (modelIds: string[]) => void
  onDisableAll: (modelIds: string[]) => void
  onResetToDefaults: () => void
  enabledCount: number
}

export function ModelSelector({
  models,
  categorizedModels,
  isModelEnabled,
  onToggleModel,
  onEnableAll,
  onDisableAll,
  onResetToDefaults,
  enabledCount
}: ModelSelectorProps) {
  const allModelIds = models.map(m => m.id)
  const allEnabled = enabledCount === models.length
  const noneEnabled = enabledCount === 0

  return (
    <div className="space-y-4">
      {/* Header com controles gerais */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Selecionar Modelos</span>
          <Badge variant="secondary">{enabledCount} de {models.length}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEnableAll(allModelIds)}
            disabled={allEnabled}
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            Todos
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisableAll(allModelIds)}
            disabled={noneEnabled}
          >
            <Square className="w-4 h-4 mr-1" />
            Nenhum
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onResetToDefaults}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Padrão
          </Button>
        </div>
      </div>

      <Separator />

      {/* Lista de modelos por categoria */}
      <div className="space-y-4 max-h-60 overflow-y-auto">
        {Object.entries(categorizedModels).map(([category, categoryModels]) => (
          <div key={category}>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              {category}
              <Badge variant="outline" className="text-xs">
                {categoryModels.filter(m => isModelEnabled(m.id)).length}/{categoryModels.length}
              </Badge>
            </h4>
            
            <div className="space-y-2 ml-2">
              {categoryModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center space-x-3 py-1"
                >
                  <Checkbox
                    id={`model-${model.id}`}
                    checked={isModelEnabled(model.id)}
                    onCheckedChange={() => onToggleModel(model.id)}
                  />
                  <label
                    htmlFor={`model-${model.id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <div className="font-medium">{model.id}</div>
                    <div className="text-xs text-muted-foreground">
                      {model.owned_by} • {new Date(model.created * 1000).toLocaleDateString()}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {enabledCount === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Pelo menos um modelo deve estar selecionado para usar o sistema.
          </p>
        </div>
      )}
    </div>
  )
}
