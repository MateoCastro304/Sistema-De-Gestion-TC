import { createContext, useContext } from 'react'

export type Toast = { id: number; kind: 'success' | 'error'; message: string }
export type ShowToast = (kind: Toast['kind'], message: string) => void

export const ToastContext = createContext<ShowToast | null>(null)

export function useToast(): ShowToast {
    const show = useContext(ToastContext)
    if (show === null) throw new Error('useToast() must be used inside <ToastProvider>')
    return show
}