
import { CheckCircle, AlertCircle } from "lucide-react"
import { API_STATUS, API_STATUS_LABELS } from "./settingsConstants"

export const formatApiStatus = (status: string): string => {
  return API_STATUS_LABELS[status as keyof typeof API_STATUS_LABELS] || status
}

export const getStatusBadgeConfig = (status: string) => {
  const configs = {
    [API_STATUS.CONNECTED]: {
      variant: "default" as const,
      icon: CheckCircle,
      text: API_STATUS_LABELS.connected,
      className: "bg-green-100 text-green-800"
    },
    [API_STATUS.DISCONNECTED]: {
      variant: "secondary" as const,
      icon: AlertCircle,
      text: API_STATUS_LABELS.disconnected,
      className: ""
    },
    [API_STATUS.ERROR]: {
      variant: "destructive" as const,
      icon: AlertCircle,
      text: API_STATUS_LABELS.error,
      className: ""
    }
  }
  
  return configs[status as keyof typeof configs] || configs[API_STATUS.DISCONNECTED]
}

export const formatSubscriberCount = (count: number): string => {
  if (count === 0) return ''
  return count.toLocaleString()
}

export const formatLastSync = (dateString: string): string => {
  return new Date(dateString).toLocaleString('pt-BR')
}

export const formatApiKeyDisplay = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return ''
  return `${apiKey.substring(0, 8)}...`
}
