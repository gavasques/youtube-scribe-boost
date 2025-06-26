
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { useAccountForm } from "@/hooks/useAccountForm"

export function EmailForm() {
  const { emailForm, setEmailForm, handleEmailChange } = useAccountForm()

  return (
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
  )
}
