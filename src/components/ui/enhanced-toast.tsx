
import { toast } from "sonner"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastAction {
  label: string
  onClick: () => void
}

interface EnhancedToastOptions {
  title: string
  description?: string
  duration?: number
  action?: ToastAction
  persistent?: boolean
}

export const showSuccessToast = (options: EnhancedToastOptions) => {
  toast.success(options.title, {
    description: options.description,
    duration: options.persistent ? Infinity : (options.duration || 4000),
    icon: <CheckCircle className="w-4 h-4" />,
    action: options.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

export const showErrorToast = (options: EnhancedToastOptions) => {
  toast.error(options.title, {
    description: options.description,
    duration: options.persistent ? Infinity : (options.duration || 6000),
    icon: <XCircle className="w-4 h-4" />,
    action: options.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

export const showWarningToast = (options: EnhancedToastOptions) => {
  toast.warning(options.title, {
    description: options.description,
    duration: options.persistent ? Infinity : (options.duration || 5000),
    icon: <AlertCircle className="w-4 h-4" />,
    action: options.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

export const showInfoToast = (options: EnhancedToastOptions) => {
  toast.info(options.title, {
    description: options.description,
    duration: options.persistent ? Infinity : (options.duration || 4000),
    icon: <Info className="w-4 h-4" />,
    action: options.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
  })
}

export const dismissToast = (id?: string | number) => {
  if (id) {
    toast.dismiss(id)
  } else {
    toast.dismiss()
  }
}

// Loading toast with dismissible option
export const showLoadingToast = (title: string, description?: string) => {
  return toast.loading(title, {
    description,
    action: {
      label: "Cancelar",
      onClick: () => toast.dismiss(),
    },
  })
}
