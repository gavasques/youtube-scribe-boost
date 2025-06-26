
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCategories } from "@/hooks/useCategories"

export function CategoryTestForm() {
  const [testName, setTestName] = useState("Categoria Teste")
  const [isCreating, setIsCreating] = useState(false)
  const { createCategory } = useCategories()

  const handleTestCreate = async () => {
    setIsCreating(true)
    console.log('🧪 Iniciando teste de criação de categoria')
    
    try {
      const result = await createCategory({
        name: testName,
        description: "Categoria criada para teste",
        is_active: true
      })
      
      console.log('🧪 Resultado do teste:', result)
      
      if (result.data) {
        console.log('✅ Teste bem-sucedido!')
      } else {
        console.log('❌ Teste falhou:', result.error)
      }
    } catch (error) {
      console.error('💥 Erro no teste:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm">Teste de Criação de Categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="Nome da categoria de teste"
        />
        <Button 
          onClick={handleTestCreate}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? "Criando..." : "Testar Criação"}
        </Button>
      </CardContent>
    </Card>
  )
}
