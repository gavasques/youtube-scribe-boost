
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Settings, Zap } from 'lucide-react'

interface ProcessingConfig {
  summary: boolean
  chapters: boolean
  description: boolean
  tags: boolean
  category: boolean
  model: string
  temperature: number
  maxTokens: number
}

interface AIProcessingSettingsProps {
  config: ProcessingConfig
  onChange: (config: ProcessingConfig) => void
  onProcess: () => void
  canProcess: boolean
  processing: boolean
}

export function AIProcessingSettings({
  config,
  onChange,
  onProcess,
  canProcess,
  processing
}: AIProcessingSettingsProps) {
  
  const handleConfigChange = (key: keyof ProcessingConfig, value: any) => {
    onChange({
      ...config,
      [key]: value
    })
  }

  const availableModels = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e Econômico)' },
    { value: 'gpt-4o', label: 'GPT-4o (Mais Poderoso)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Tipos de Conteúdo
          </CardTitle>
          <CardDescription>
            Selecione o que deseja gerar com IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resumo</p>
                <p className="text-sm text-muted-foreground">Resumo executivo do vídeo</p>
              </div>
              <Switch
                checked={config.summary}
                onCheckedChange={(checked) => handleConfigChange('summary', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Capítulos</p>
                <p className="text-sm text-muted-foreground">Divisão com timestamps</p>
              </div>
              <Switch
                checked={config.chapters}
                onCheckedChange={(checked) => handleConfigChange('chapters', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Descrição</p>
                <p className="text-sm text-muted-foreground">Descrição otimizada</p>
              </div>
              <Switch
                checked={config.description}
                onCheckedChange={(checked) => handleConfigChange('description', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tags</p>
                <p className="text-sm text-muted-foreground">Tags relevantes</p>
              </div>
              <Switch
                checked={config.tags}
                onCheckedChange={(checked) => handleConfigChange('tags', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Categoria</p>
                <p className="text-sm text-muted-foreground">Sugestão de categoria</p>
              </div>
              <Switch
                checked={config.category}
                onCheckedChange={(checked) => handleConfigChange('category', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações do Modelo
          </CardTitle>
          <CardDescription>
            Configure os parâmetros da IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modelo OpenAI</Label>
            <Select
              value={config.model}
              onValueChange={(value) => handleConfigChange('model', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Temperature</Label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">0 = Mais conservador, 2 = Mais criativo</p>
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Limite de tokens por resposta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={onProcess}
          disabled={!canProcess || processing}
          className="gap-2"
          size="lg"
        >
          <Zap className="w-4 h-4" />
          {processing ? 'Processando...' : 'Processar com IA'}
        </Button>
      </div>
    </div>
  )
}
