
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Download } from 'lucide-react'

interface SyncTypeSelectorProps {
  syncType: 'complete' | 'incremental'
  onSyncTypeChange: (type: 'complete' | 'incremental') => void
}

export function SyncTypeSelector({ syncType, onSyncTypeChange }: SyncTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Tipo de Sincronização</Label>
      <div className="grid gap-3">
        
        {/* Opção 1: Sincronização Incremental (Padrão/Recomendada) */}
        <Card 
          className={`cursor-pointer border-2 transition-colors ${
            syncType === 'incremental' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSyncTypeChange('incremental')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              Sincronização Rápida
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">Recomendado</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Sincroniza até 50 vídeos mais recentes. Ideal para atualizações regulares.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Opção 2: Sincronização Completa */}
        <Card 
          className={`cursor-pointer border-2 transition-colors ${
            syncType === 'complete' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSyncTypeChange('complete')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Download className="w-4 h-4 text-purple-500" />
              Varredura Profunda
              <Badge variant="outline" className="text-purple-600 border-purple-600">Completo</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Sincroniza TODOS os vídeos do canal. Ideal para primeira configuração.
            </CardDescription>
          </CardHeader>
        </Card>

      </div>
    </div>
  )
}
