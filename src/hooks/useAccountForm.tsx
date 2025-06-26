
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { showSuccessToast, showErrorToast } from '@/components/ui/enhanced-toast'
import { validateForm, emailSchema, passwordSchema } from '@/utils/settingsValidation'

interface EmailFormState {
  newEmail: string
  loading: boolean
}

interface PasswordFormState {
  newPassword: string
  confirmPassword: string
  loading: boolean
}

export function useAccountForm() {
  const [emailForm, setEmailForm] = useState<EmailFormState>({
    newEmail: "",
    loading: false
  })
  
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    newPassword: "",
    confirmPassword: "",
    loading: false
  })

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateForm(emailSchema, emailForm.newEmail)
    if (!validation.success) {
      showErrorToast({ 
        title: "Email inválido", 
        description: Object.values(validation.errors).flat()[0] 
      })
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
      showErrorToast({ 
        title: "Erro ao atualizar email", 
        description: error.message || "Tente novamente mais tarde" 
      })
    } finally {
      setEmailForm(prev => ({ ...prev, loading: false }))
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showErrorToast({ title: "Senhas não coincidem" })
      return
    }

    const validation = validateForm(passwordSchema, passwordForm.newPassword)
    if (!validation.success) {
      showErrorToast({ 
        title: "Senha inválida", 
        description: Object.values(validation.errors).flat()[0] 
      })
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
      showErrorToast({ 
        title: "Erro ao atualizar senha", 
        description: error.message || "Tente novamente mais tarde" 
      })
    } finally {
      setPasswordForm(prev => ({ ...prev, loading: false }))
    }
  }

  return {
    emailForm,
    passwordForm,
    setEmailForm,
    setPasswordForm,
    handleEmailChange,
    handlePasswordChange
  }
}
