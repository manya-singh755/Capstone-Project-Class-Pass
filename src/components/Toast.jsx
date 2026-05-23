import { useState, useEffect, useCallback, createContext, useContext } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, icon = 'fa-check-circle') => {
    setToast({ message, icon })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="toast">
          <i className={`fas ${toast.icon}`}></i>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
