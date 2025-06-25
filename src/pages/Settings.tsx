
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Youtube, 
  Zap, 
  Link, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Save, 
  Eye, 
  EyeOff,
  Clock,
  Globe,
  Palette,
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const { toast } = useToast()
  
  // Estados das configurações
  const [youtubeConnected, setYoutubeConnected] = useState(true)
  const [openaiApiKey, setOpenaiApiKey] = useState("sk-********************************")
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiModel, setAiModel] = useState("gpt-4o")
  const [temperature, setTemperature] = useState("0.7")
  const [maxTokens, setMaxTokens] = useState("2000")
  
  const [bitlyEnabled, setBitlyEnabled] = useState(false)
  const [bitlyToken, setBitlyToken] = useState("")
  const [bitlyDomain, setBitlyDomain] = useState("")
  const [autoShortenUrls, setAutoShortenUrls] = useState(true)
  const [minUrlLength, setMinUrlLength] = useState("50")
  
  const [syncRegularVideos, setSyncRegularVideos] = useState(true)
  const [syncShorts, setSyncShorts] = useState(true)
  const [syncVideoStatus, setSyncVideoStatus] = useState(true)
  const [syncMetadata, setSyncMetadata] = useState(true)
  const [syncTags, setSyncTags] = useState(true)
  const [maxVideosPerSync, setMaxVideosPerSync] = useState("100")
  const [syncFrequency, setSyncFrequency] = useState("60")
  const [autoProcessTranscriptions, setAutoProcessTranscriptions] = useState(true)
  const [autoApplyBlocks, setAutoApplyBlocks] = useState(false)
  const [requireApproval, setRequireApproval] = useState(true)
  
  const [language, setLanguage] = useState("pt-BR")
  const [timezone, setTimezone] = useState("America/Sao_Paulo")
  const [theme, setTheme] = useState("light")
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas!",
      description: "Todas as configurações foram atualizadas com sucesso.",
    })
  }

  const handleConnectYoutube = () => {
    // Simulação da conexão
    setYoutubeConnected(!youtubeConnected)
    toast({
      title: youtubeConnected ? "YouTube desconectado" : "YouTube conectado",
      description: youtubeConnected ? "A conexão foi removida." : "Canal conectado com sucesso!",
    })
  }

  const getConnectionStatus = (connected: boolean) => {
    if (connected) {
      return <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
        <CheckCircle className="w-3 h-3" />
        Conectado
      </Badge>
    }
    return <Badge variant="destructive" className="gap-1">
      <XCircle className="w-3 h-3" />
      Desconectado
    </Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure integrações e preferências do sistema
        </p>
      </div>

      <Tabs defaultValue="youtube-ai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="youtube-ai">YouTube & IA</TabsTrigger>
          <TabsTrigger value="bitly">Bitly</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="youtube-ai" className="space-y-6">
          {/* YouTube Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                Conectar ao YouTube
              </CardTitle>
              <CardDescription>
                Configure a conexão com sua conta do YouTube
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status da Conexão</p>
                  <p className="text-sm text-muted-foreground">
                    {youtubeConnected ? "Conectado como: Meu Canal Tech" : "Não conectado"}
                  </p>
                </div>
                {getConnectionStatus(youtubeConnected)}
              </div>
              
              {youtubeConnected && (
                <div className="space-y-2">
                  <Label htmlFor="youtube-channel">Canal Conectado</Label>
                  <Input 
                    id="youtube-channel"
                    value="Meu Canal Tech"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Última sincronização: hoje às 14:30
                  </p>
                </div>
              )}

              {youtubeConnected && (
                <div className="space-y-2">
                  <Label>Permissões Concedidas</Label>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Ler informações do canal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Gerenciar vídeos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Atualizar descrições</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleConnectYoutube}
                  className={youtubeConnected ? "bg-red-600 hover:bg-red-700" : "bg-red-600 hover:bg-red-700"}
                >
                  <Youtube className="w-4 h-4 mr-2" />
                  {youtubeConnected ? "Desconectar" : "Conectar com YouTube"}
                </Button>
                {youtubeConnected && (
                  <Button variant="outline" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar Agora
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Configurações de IA
              </CardTitle>
              <CardDescription>
                Configure sua chave da API OpenAI e parâmetros de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status da API</p>
                  <p className="text-sm text-muted-foreground">
                    Última verificação: hoje às 14:30
                  </p>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800 gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Ativa
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                <div className="flex gap-2">
                  <Input 
                    id="openai-key"
                    type={showApiKey ? "text" : "password"}
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-model">Modelo de IA</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                    <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                    <SelectItem value="gpt-4.1-mini">GPT-4.1 Mini</SelectItem>
                    <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
                    <SelectItem value="o1">O1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature Padrão</Label>
                  <Input 
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens Padrão</Label>
                  <Input 
                    id="max-tokens"
                    type="number"
                    min="100"
                    max="4000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bitly" className="space-y-6">
          {/* Bitly Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-orange-500" />
                Integração Bitly
              </CardTitle>
              <CardDescription>
                Configure o encurtamento automático de URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Ativar Bitly</p>
                  <p className="text-sm text-muted-foreground">
                    Encurtar URLs automaticamente nas descrições
                  </p>
                </div>
                <Switch 
                  checked={bitlyEnabled} 
                  onCheckedChange={setBitlyEnabled}
                />
              </div>

              {bitlyEnabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label htmlFor="bitly-token">Access Token</Label>
                    <Input 
                      id="bitly-token"
                      type="password"
                      value={bitlyToken}
                      onChange={(e) => setBitlyToken(e.target.value)}
                      placeholder="Insira seu token do Bitly"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bitly-domain">Domínio Customizado (Opcional)</Label>
                    <Input 
                      id="bitly-domain"
                      value={bitlyDomain}
                      onChange={(e) => setBitlyDomain(e.target.value)}
                      placeholder="bit.ly"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-encurtar URLs</p>
                        <p className="text-sm text-muted-foreground">
                          Encurtar URLs automaticamente durante sincronização
                        </p>
                      </div>
                      <Switch 
                        checked={autoShortenUrls} 
                        onCheckedChange={setAutoShortenUrls}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="min-url-length">Tamanho Mínimo para Encurtar (caracteres)</Label>
                      <Input 
                        id="min-url-length"
                        type="number"
                        min="20"
                        max="200"
                        value={minUrlLength}
                        onChange={(e) => setMinUrlLength(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Estatísticas do Mês</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Links criados</p>
                        <p className="font-medium">247</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total de cliques</p>
                        <p className="font-medium">3,892</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          {/* Sync Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-500" />
                Configurações de Sincronização
              </CardTitle>
              <CardDescription>
                Configure como e quando sincronizar com o YouTube
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Tipos de Vídeo</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Incluir vídeos normais</p>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar vídeos regulares do canal
                    </p>
                  </div>
                  <Switch 
                    checked={syncRegularVideos} 
                    onCheckedChange={setSyncRegularVideos}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Incluir YouTube Shorts</p>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar vídeos curtos (Shorts)
                    </p>
                  </div>
                  <Switch 
                    checked={syncShorts} 
                    onCheckedChange={setSyncShorts}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Dados a Sincronizar</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status dos vídeos</p>
                    <p className="text-sm text-muted-foreground">
                      Público, privado, não listado
                    </p>
                  </div>
                  <Switch 
                    checked={syncVideoStatus} 
                    onCheckedChange={setSyncVideoStatus}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Metadados</p>
                    <p className="text-sm text-muted-foreground">
                      Título, descrição, miniatura
                    </p>
                  </div>
                  <Switch 
                    checked={syncMetadata} 
                    onCheckedChange={setSyncMetadata}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tags</p>
                    <p className="text-sm text-muted-foreground">
                      Tags e palavras-chave
                    </p>
                  </div>
                  <Switch 
                    checked={syncTags} 
                    onCheckedChange={setSyncTags}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Configurações de Sincronização</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-videos">Máximo de vídeos por sincronização</Label>
                    <Input 
                      id="max-videos"
                      type="number"
                      min="10"
                      max="500"
                      value={maxVideosPerSync}
                      onChange={(e) => setMaxVideosPerSync(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Frequência (minutos)</Label>
                    <Input 
                      id="sync-frequency"
                      type="number"
                      min="15"
                      max="1440"
                      value={syncFrequency}
                      onChange={(e) => setSyncFrequency(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Processamento Automático</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Processar transcrições automaticamente</p>
                    <p className="text-sm text-muted-foreground">
                      Aplicar IA em novas transcrições
                    </p>
                  </div>
                  <Switch 
                    checked={autoProcessTranscriptions} 
                    onCheckedChange={setAutoProcessTranscriptions}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Aplicar blocos automaticamente</p>
                    <p className="text-sm text-muted-foreground">
                      Inserir blocos nas descrições automaticamente
                    </p>
                  </div>
                  <Switch 
                    checked={autoApplyBlocks} 
                    onCheckedChange={setAutoApplyBlocks}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Requerer aprovação para mudanças</p>
                    <p className="text-sm text-muted-foreground">
                      Sempre pedir confirmação antes de atualizar
                    </p>
                  </div>
                  <Switch 
                    checked={requireApproval} 
                    onCheckedChange={setRequireApproval}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          {/* General Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-gray-500" />
                Preferências Gerais
              </CardTitle>
              <CardDescription>
                Configure idioma, tema e notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma da Interface</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por email</p>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre sincronizações e erros
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="gap-2">
          <Save className="w-4 h-4" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  )
}
