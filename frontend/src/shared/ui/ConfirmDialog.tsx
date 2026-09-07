type ConfirmDialogProps = {
  cancelLabel: string
  confirmLabel: string
  description: string
  error?: string | null
  isOpen: boolean
  isSubmitting?: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ cancelLabel, confirmLabel, description, error, isOpen, isSubmitting = false, title, onCancel, onConfirm }: ConfirmDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 leading-7 text-slate-600">{description}</p>
        {error ? <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-md border border-stone-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300" disabled={isSubmitting} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
