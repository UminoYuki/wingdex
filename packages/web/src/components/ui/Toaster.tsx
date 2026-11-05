import { Toaster as SonnerToaster, toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from 'lucide-react'

const baseOptions = {
  style: {
    background: 'rgba(22,32,27,0.94)',
    border: '1px solid rgba(255,255,255,0.10)',
    color: '#E8EFE9',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 24px 60px rgba(0,0,0,.55)',
    borderRadius: '10px',
    fontSize: '13px',
  },
} as const

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      offset={52}
      gap={10}
      closeButton
      toastOptions={{ ...baseOptions, duration: 3600 }}
    />
  )
}

export interface ToastAction {
  label: string
  onClick: () => void
}

export const notify = {
  success: (message: string, description?: string, options?: { action?: ToastAction }) =>
    toast.success(message, { description, icon: <CheckCircle2 className="h-4 w-4 text-success" />, ...options }),
  error: (message: string, description?: string) =>
    toast.error(message, { description, icon: <XCircle className="h-4 w-4 text-danger" />, duration: 5200 }),
  info: (message: string, description?: string) =>
    toast(message, { description, icon: <Info className="h-4 w-4 text-plume" /> }),
  warn: (message: string, description?: string) =>
    toast(message, { description, icon: <AlertTriangle className="h-4 w-4 text-amber-gold" /> }),
}

export interface AchievementToastPayload {
  name: string
  tier: string
  description: string
  icon?: React.ReactNode
}

/** 成就解锁 toast：徽章扫光 + 上浮 */
export function achievementToast(payload: AchievementToastPayload) {
  toast.custom(
    () => (
      <div className="relative flex w-[330px] items-center gap-3 overflow-hidden rounded-lg border border-amber-gold/35 bg-ink-800/95 p-3 shadow-elev-3 backdrop-blur-xl animate-fade-up">
        <span className="pointer-events-none absolute inset-y-0 left-0 w-16 animate-badge-sweep bg-gradient-to-r from-transparent via-amber-gold/25 to-transparent" />
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8A6412] via-amber-gold to-[#FFE3A3] text-ink-900">
          {payload.icon ?? <Sparkles className="h-5 w-5" />}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-1.5 text-micro uppercase tracking-wider text-amber-gold">
            <Sparkles className="h-3 w-3" /> 成就解锁 · {payload.tier}
          </span>
          <span className="truncate text-body font-medium text-fog-100">{payload.name}</span>
          <span className="clamp-1 text-micro text-fog-300">{payload.description}</span>
        </div>
      </div>
    ),
    { duration: 5200 },
  )
}
