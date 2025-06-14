// Adapted from shadcn/ui (https://ui.shadcn.com/docs/components/toast)
import { useState, createContext, useContext } from "react"

interface Toast {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToasterToast = Toast & {
  id: string
  open: boolean
}

interface ToastContextType {
  toast: (props: Toast) => void
  dismiss: (toastId: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  const toast = (props: Toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, open: true, ...props },
    ])

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id)
    }, 5000)

    return id
  }

  const dismiss = (toastId: string) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === toastId ? { ...toast, open: false } : toast
      )
    )

    // Remove toast from state after animation (300ms)
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId))
    }, 300)
  }

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      
      {/* Render toasts */}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col p-4 gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              ${toast.open ? "animate-in slide-in-from-right" : "animate-out slide-out-to-right"}
              bg-card shadow-lg rounded-lg border p-4 ${toast.variant === "destructive" ? "border-red-400 bg-red-50" : "border-gray-200"}
              duration-300 ease-in-out
              flex flex-col gap-1 max-w-md
            `}
          >
            {toast.title && (
              <div className={`font-semibold ${toast.variant === "destructive" ? "text-red-700" : "text-foreground"}`}>
                {toast.title}
              </div>
            )}
            {toast.description && (
              <div className={`text-sm ${toast.variant === "destructive" ? "text-red-600" : "text-muted-foreground"}`}>
                {toast.description}
              </div>
            )}
            {toast.action && (
              <div className="mt-2">
                {toast.action}
              </div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  
  return context
} 