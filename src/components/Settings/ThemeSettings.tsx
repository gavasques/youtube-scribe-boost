
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Sun } from "lucide-react"

export function ThemeSettings() {
  const [animations, setAnimations] = useLocalStorage("animations", true)
  const [reducedMotion, setReducedMotion] = useLocalStorage("reducedMotion", false)

  // Força o tema claro sempre
  React.useEffect(() => {
    document.documentElement.classList.remove("dark")
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Personalize a aparência da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Tema</Label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Sun className="w-4 h-4" />
            <span className="text-sm font-medium">Tema Claro</span>
            <span className="text-xs text-muted-foreground ml-auto">(Fixo)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            O tema está fixado no modo claro para melhor experiência
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Animações</Label>
            <p className="text-sm text-muted-foreground">
              Habilitar animações e transições suaves
            </p>
          </div>
          <Switch
            checked={animations}
            onCheckedChange={setAnimations}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Movimento Reduzido</Label>
            <p className="text-sm text-muted-foreground">
              Reduzir animações para melhor acessibilidade
            </p>
          </div>
          <Switch
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
          />
        </div>

        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              setAnimations(true)
              setReducedMotion(false)
              document.documentElement.classList.remove("dark")
            }}
          >
            Restaurar Padrões
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
