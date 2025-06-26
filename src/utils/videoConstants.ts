
import { Badge } from "@/components/ui/badge"

export const VIDEO_STATUS_LABELS = {
  CONFIGURED: "Configurado",
  NEEDS_ATTENTION: "Requer Atenção", 
  NOT_CONFIGURED: "Não Configurado"
} as const

export const UPDATE_STATUS_LABELS = {
  ACTIVE_FOR_UPDATE: "Ativo",
  DO_NOT_UPDATE: "Não Atualizar",
  IGNORED: "Ignorado"
} as const

export const VIDEO_TYPE_LABELS = {
  SHORT: "Short",
  REGULAR: "Regular",
  LIVE: "Live"
} as const

export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "CONFIGURED":
      return "default"
    case "NEEDS_ATTENTION":
      return "destructive"
    default:
      return "secondary"
  }
}

export const getStatusBadgeClassName = (status: string) => {
  switch (status) {
    case "CONFIGURED":
      return "bg-green-100 text-green-800"
    default:
      return ""
  }
}
