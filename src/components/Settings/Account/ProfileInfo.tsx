
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

export function ProfileInfo() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
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
    </div>
  )
}
