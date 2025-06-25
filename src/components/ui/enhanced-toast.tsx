
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ToastType = "success" | "error" | "warning" | "info"

interface EnhancedToastOptions {
  title: string
  description?: string
  type?: ToastType
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
  onClose?: () => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle, 
  warning: AlertCircle,
  info: Info
}

const toastStyles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800", 
  info: "border-blue-200 bg-blue-50 text-blue-800"
}

export function useEnhancedToast() {
  const { toast } = useToast()

  const showToast = ({
    title,
    description,
    type = "info",
    action,
    persistent = false,
    onClose
  }: EnhancedToastOptions) => {
    const Icon = toastIcons[type]

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
        </div>
      ),
      description,
      className: toastStyles[type],
      duration: persistent ? Infinity : undefined,
      action: action ? (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : undefined,
    })
  }

  return { showToast }
}
