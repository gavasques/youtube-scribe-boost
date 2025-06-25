
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Monitor, Moon, Sun } from "lucide-react"

type Theme = "light" | "dark" | "system"

export function ThemeSettings() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "system")
  const [animations, setAnimations] = useLocalStorage("animations", true)
  const [reducedMotion, setReducedMotion] = useLocalStorage("reducedMotion", false)

  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      // System theme
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      document.documentElement.classList.toggle("dark", systemDark)
    }
  }

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor }
  ]

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
          <Select value={theme} onValueChange={(value: Theme) => applyTheme(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
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
              setTheme("system")
              setAnimations(true)
              setReducedMotion(false)
              applyTheme("system")
            }}
          >
            Restaurar Padrões
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
