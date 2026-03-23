import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, type === 'error' ? 8000 : 3500)
    return () => clearTimeout(t)
  }, [onClose, type])

  return (
    <div className={`
      fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
      ${type === 'success'
        ? 'bg-green-950 border-green-800 text-green-300'
        : 'bg-red-950 border-red-800 text-red-300'
      }
    `}>
      {type === 'success'
        ? <CheckCircle size={16} />
        : <XCircle size={16} />
      }
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}
