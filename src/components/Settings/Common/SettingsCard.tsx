
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "./StatusBadge"

interface SettingsCardProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status?: string
  children: React.ReactNode
}

export function SettingsCard({ title, description, icon: Icon, status, children }: SettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        <div className="flex items-center justify-between">
          <CardDescription>{description}</CardDescription>
          {status && <StatusBadge status={status} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}
