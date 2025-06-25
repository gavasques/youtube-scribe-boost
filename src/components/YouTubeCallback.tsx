
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useYouTubeAuth } from '@/hooks/useYouTubeAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function YouTubeCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleCallback } = useYouTubeAuth()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (code && state) {
      handleCallback(code, state, error || undefined).then(() => {
        // Redirecionar para configurações após callback
        navigate('/settings')
      })
    } else if (error) {
      console.error('OAuth error:', error)
      navigate('/settings')
    } else {
      // Parâmetros inválidos, redirecionar
      navigate('/settings')
    }
  }, [searchParams, handleCallback, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Conectando ao YouTube</h2>
          <p className="text-muted-foreground">
            Processando autenticação...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
