
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SecurityStatusProps {
  className?: string
}

export function SecurityStatus({ className }: SecurityStatusProps) {
  // This would normally fetch real security status from your backend
  const securityChecks = [
    { name: "Autenticação", status: "pass", icon: ShieldCheck },
    { name: "Validação de Entrada", status: "pass", icon: ShieldCheck },
    { name: "Rate Limiting", status: "active", icon: Shield },
    { name: "Criptografia", status: "pass", icon: ShieldCheck },
    { name: "Auditoria", status: "warning", icon: ShieldAlert },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass": return "bg-green-100 text-green-800"
      case "active": return "bg-blue-100 text-blue-800"
      case "warning": return "bg-yellow-100 text-yellow-800"
      case "fail": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string, IconComponent: any) => {
    const iconProps = { className: "w-4 h-4" }
    switch (status) {
      case "pass": return <ShieldCheck {...iconProps} className="w-4 h-4 text-green-600" />
      case "active": return <Shield {...iconProps} className="w-4 h-4 text-blue-600" />
      case "warning": return <ShieldAlert {...iconProps} className="w-4 h-4 text-yellow-600" />
      case "fail": return <ShieldX {...iconProps} className="w-4 h-4 text-red-600" />
      default: return <IconComponent {...iconProps} />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Status de Segurança
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {securityChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status, check.icon)}
                <span className="text-sm font-medium">{check.name}</span>
              </div>
              <Badge variant="outline" className={getStatusColor(check.status)}>
                {check.status === "pass" && "OK"}
                {check.status === "active" && "Ativo"}
                {check.status === "warning" && "Atenção"}
                {check.status === "fail" && "Falha"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
