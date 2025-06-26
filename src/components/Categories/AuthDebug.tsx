
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthDebug() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        const { data: { session } } = await supabase.auth.getSession()
        
        setAuthState({
          user: user ? { id: user.id, email: user.email } : null,
          session: session ? { expires_at: session.expires_at } : null,
          error
        })
      } catch (err) {
        setAuthState({ error: err })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) return <div>Verificando autenticação...</div>

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm">Debug de Autenticação</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
