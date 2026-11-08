import { createContext, useContext, useEffect } from 'react'

/** Avisa al layout que hay datos sin guardar, para confirmar al cerrar sesión (CU-52). */
export interface UnsavedChanges {
  setDirty: (dirty: boolean) => void
}

export const UnsavedChangesContext = createContext<UnsavedChanges | null>(null)

/** Cada formulario lo llama con su estado (`isDirty`); al desmontarse queda en "limpio". */
export function useUnsavedChanges(dirty: boolean): void {
  const context = useContext(UnsavedChangesContext)
  if (context === null) throw new Error('useUnsavedChanges() must be used inside <AppLayout>')

  useEffect(() => {
    context.setDirty(dirty)
    return () => context.setDirty(false)
  }, [dirty, context])
}
