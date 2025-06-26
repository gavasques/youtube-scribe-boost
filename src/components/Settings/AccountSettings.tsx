
import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { User, Mail, Lock } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { showSuccessToast, showErrorToast } from "@/components/ui/enhanced-toast"
import { z } from "zod"

const emailSchema = z.string().email("Email inválido")
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres")

export function AccountSettings() {
  const { user } = useAuth()
  const [emailForm, setEmailForm] = useState({
    newEmail: "",
    loading: false
  })
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    loading: false
  })

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!emailForm.newEmail.trim()) {
      showErrorToast({ title: "Email obrigatório" })
      return
    }

    const emailValidation = emailSchema.safeParse(emailForm.newEmail)
    if (!emailValidation.success) {
      showErrorToast({ title: "Email inválido", description: emailValidation.error.errors[0].message })
      return
    }

    setEmailForm(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        email: emailForm.newEmail
      })

      if (error) throw error

      showSuccessToast({ 
        title: "Email atualizado!", 
        description: "Verifique seu email para confirmar a alteração" 
      })
      setEmailForm({ newEmail: "", loading: false })
    } catch (error: any) {
      console.error('Erro ao atualizar email:', error)
      showErrorToast({ 
        title: "Erro ao atualizar email", 
        description: error.message || "Tente novamente mais tarde" 
      })
      setEmailForm(prev => ({ ...prev, loading: false }))
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!passwordForm.newPassword.trim() || !passwordForm.confirmPassword.trim()) {
      showErrorToast({ title: "Preencha todos os campos" })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showErrorToast({ title: "Senhas não coincidem" })
      return
    }

    const passwordValidation = passwordSchema.safeParse(passwordForm.newPassword)
    if (!passwordValidation.success) {
      showErrorToast({ title: "Senha inválida", description: passwordValidation.error.errors[0].message })
      return
    }

    setPasswordForm(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      showSuccessToast({ 
        title: "Senha atualizada!", 
        description: "Sua senha foi alterada com sucesso" 
      })
      setPasswordForm({ newPassword: "", confirmPassword: "", loading: false })
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error)
      showErrorToast({ 
        title: "Erro ao atualizar senha", 
        description: error.message || "Tente novamente mais tarde" 
      })
      setPasswordForm(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações da Conta
          </CardTitle>
          <CardDescription>
            Informações básicas da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email atual</Label>
            <Input 
              type="email" 
              value={user?.email || ""} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>ID do usuário</Label>
            <Input 
              value={user?.id || ""} 
              disabled 
              className="bg-muted font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Alterar Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Alterar Email
          </CardTitle>
          <CardDescription>
            Altere o email da sua conta. Você receberá um link de confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Novo Email</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={emailForm.newEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                disabled={emailForm.loading}
              />
            </div>
            <LoadingButton 
              type="submit" 
              loading={emailForm.loading}
              loadingText="Atualizando..."
              className="w-full"
            >
              Alterar Email
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Altere a senha da sua conta. Não é necessário informar a senha atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite sua nova senha"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                disabled={passwordForm.loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={passwordForm.loading}
              />
            </div>
            <LoadingButton 
              type="submit" 
              loading={passwordForm.loading}
              loadingText="Atualizando..."
              className="w-full"
            >
              Alterar Senha
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
