
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { useAccountForm } from "@/hooks/useAccountForm"

export function PasswordForm() {
  const { passwordForm, setPasswordForm, handlePasswordChange } = useAccountForm()

  return (
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
  )
}
