
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, Youtube, Zap, Link, Shield, Save } from "lucide-react"

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure integrações e preferências do sistema
        </p>
      </div>

      {/* YouTube Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Integração YouTube
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
                Conectado como: Meu Canal Tech
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Conectado
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="youtube-channel">ID do Canal</Label>
            <Input 
              id="youtube-channel"
              value="UCxxxxxxxxxxxxxx"
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline">Reconectar</Button>
            <Button variant="destructive">Desconectar</Button>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Integração OpenAI
          </CardTitle>
          <CardDescription>
            Configure sua chave da API OpenAI para processamento IA
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
            <Badge variant="default" className="bg-green-100 text-green-800">
              Ativa
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="openai-key">Chave da API</Label>
            <Input 
              id="openai-key"
              type="password"
              value="sk-********************************"
              placeholder="sk-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-model">Modelo Padrão</Label>
            <select className="w-full p-2 border rounded-md">
              <option value="gpt-4o">GPT-4o (Recomendado)</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
            </select>
          </div>

          <Button className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

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
              <p className="font-medium">Status da Conexão</p>
              <p className="text-sm text-muted-foreground">
                Não configurado
              </p>
            </div>
            <Badge variant="secondary">
              Desconectado
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bitly-token">Token de Acesso</Label>
            <Input 
              id="bitly-token"
              type="password"
              placeholder="Insira seu token do Bitly"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-domain">Domínio Customizado (Opcional)</Label>
            <Input 
              id="custom-domain"
              placeholder="bit.ly"
            />
          </div>

          <Button variant="outline">Conectar Bitly</Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Gerencie backup e configurações de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Backup Automático</p>
              <p className="text-sm text-muted-foreground">
                Última execução: hoje às 02:00
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Ativo
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Criptografia de Tokens</p>
              <p className="text-sm text-muted-foreground">
                Tokens são criptografados em repouso
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Ativa
            </Badge>
          </div>

          <Button variant="outline">Fazer Backup Manual</Button>
        </CardContent>
      </Card>
    </div>
  )
}
