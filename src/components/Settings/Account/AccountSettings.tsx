
import { User, Mail, Lock } from "lucide-react"
import { SettingsCard } from "../Common/SettingsCard"
import { ProfileInfo } from "./ProfileInfo"
import { EmailForm } from "./EmailForm"
import { PasswordForm } from "./PasswordForm"

export function AccountSettings() {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Informações da Conta"
        description="Informações básicas da sua conta"
        icon={User}
      >
        <ProfileInfo />
      </SettingsCard>

      <SettingsCard
        title="Alterar Email"
        description="Altere o email da sua conta. Você receberá um link de confirmação."
        icon={Mail}
      >
        <EmailForm />
      </SettingsCard>

      <SettingsCard
        title="Alterar Senha"
        description="Altere a senha da sua conta. Não é necessário informar a senha atual."
        icon={Lock}
      >
        <PasswordForm />
      </SettingsCard>
    </div>
  )
}
