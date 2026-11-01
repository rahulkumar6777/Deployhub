import { useEffect, useState } from 'react'
import { AlertTriangle, Check, CloudOff, Copy, X } from 'lucide-react'
import { SERVICE_DOWN_EVENT } from '../api/apiclient'

export default function ServerErrorNotice() {
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const showError = (event) => {
      setCopied(false)
      setError(event.detail)
    }

    window.addEventListener(SERVICE_DOWN_EVENT, showError)
    return () => window.removeEventListener(SERVICE_DOWN_EVENT, showError)
  }, [])

  if (!error) return null

  const isUnavailable = error.status === 503
  const Icon = isUnavailable ? CloudOff : AlertTriangle

  async function copyTraceId() {
    if (!error.traceId) return

    try {
      await navigator.clipboard.writeText(error.traceId)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <aside
      className={`server-error-notice ${isUnavailable ? 'is-unavailable' : 'is-internal'}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="server-error-icon">
        <Icon size={19} />
      </span>
      <div className="server-error-content">
        <div className="server-error-heading">
          <strong>{isUnavailable ? 'Service unavailable' : 'Server error'}</strong>
          <span className="server-error-code">{error.status}</span>
        </div>
        <p>{error.message}</p>
        {error.traceId && (
          <button className="server-error-trace" onClick={copyTraceId} title="Copy trace ID">
            <span>Trace ID: {error.traceId}</span>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        )}
      </div>
      <button
        className="server-error-dismiss"
        aria-label="Dismiss server error"
        onClick={() => setError(null)}
      >
        <X size={17} />
      </button>
    </aside>
  )
}
