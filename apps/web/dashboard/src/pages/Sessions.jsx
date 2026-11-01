import { useCallback, useEffect, useState } from 'react'
import { Clock3, Laptop, LoaderCircle, MapPin, Monitor, RotateCw, ShieldCheck, Smartphone } from 'lucide-react'
import { api } from '../api/apiclient'
import { useAuth } from '../context/AuthContext'
import { EmptyState, PageHeader } from '../components/ui'

function browserName(userAgent = '') {
  const ua = userAgent.toLowerCase()
  if (ua.includes('edg/')) return 'Microsoft Edge'
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
  if (ua.includes('firefox/')) return 'Firefox'
  if (ua.includes('chrome/') && !ua.includes('chromium')) return 'Google Chrome'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'
  return 'Unknown browser'
}

function deviceIcon(session) {
  const value = `${session.device || ''} ${session.userAgent || ''}`.toLowerCase()
  if (/iphone|ipad|android|mobile/.test(value)) return Smartphone
  if (/mac|windows|linux/.test(value)) return Monitor
  return Laptop
}

function createdLabel(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function SessionCard({ session, current = false, busy, onRevoke }) {
  const Icon = deviceIcon(session)

  return (
    <article className={`session-card ${current ? 'is-current' : ''}`}>
      <span className="session-device-icon"><Icon size={20} /></span>
      <div className="session-card-main">
        <div className="session-card-title">
          <strong>{browserName(session.userAgent)}</strong>
          {session.device && <span>{session.device}</span>}
          {current && <span className="session-current-badge"><i /> This device</span>}
        </div>
        <div className="session-card-meta">
          <span><MapPin size={13} />{session.ip || 'IP unavailable'}</span>
          <span><Clock3 size={13} />Signed in {createdLabel(session.createdAt)}</span>
        </div>
      </div>
      <button
        className={`session-revoke ${current ? 'is-current-revoke' : ''}`}
        onClick={() => onRevoke(session)}
        disabled={busy}
      >
        {busy && <LoaderCircle size={14} className="spin" />}
        {current ? 'Sign out' : 'Revoke'}
      </button>
    </article>
  )
}

export default function Sessions() {
  const { logout } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyToken, setBusyToken] = useState(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/auth/sessions')
      setSessions(Array.isArray(data?.sessions) ? data.sessions : [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your active sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function revokeSession(session) {
    setBusyToken(session.tokenId)
    setError('')
    try {
      await api.delete(`/auth/sessions/${encodeURIComponent(session.tokenId)}`)
      if (session.current) {
        await logout()
        return
      }
      setSessions((current) => current.filter((item) => item.tokenId !== session.tokenId))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not revoke this session. Please try again.')
    } finally {
      setBusyToken(null)
    }
  }

  async function revokeAllSessions() {
    setRevokingAll(true)
    setError('')
    try {
      await api.delete('/auth/sessions')
      await logout()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign out all devices. Please try again.')
      setRevokingAll(false)
    }
  }

  const currentSession = sessions.find((session) => session.current)
  const otherSessions = sessions.filter((session) => !session.current)

  return (
    <section className="sessions-page">
      <PageHeader
        eyebrow="ACCOUNT SECURITY"
        title="Active sessions"
        description="Review devices signed in to your account and revoke access you no longer recognize."
      >
        <button className="btn" onClick={loadSessions} disabled={loading}>
          <RotateCw size={15} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </PageHeader>

      <div className="sessions-security-note">
        <span><ShieldCheck size={18} /></span>
        <p>Revoking a session immediately prevents that device from refreshing its sign-in.</p>
      </div>

      {error && <div className="sessions-error" role="alert">{error}</div>}

      {loading ? (
        <div className="sessions-loading" role="status">
          <LoaderCircle size={21} className="spin" />
          Loading active sessions…
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No active sessions found"
          description="Refresh the list or sign in again to see your active devices."
        />
      ) : (
        <div className="sessions-list">
          {currentSession && (
            <section className="sessions-group">
              <h2>Current session</h2>
              <SessionCard
                session={currentSession}
                current
                busy={busyToken === currentSession.tokenId}
                onRevoke={revokeSession}
              />
            </section>
          )}

          <section className="sessions-group">
            <div className="sessions-group-heading">
              <h2>Other devices</h2>
              <span>{otherSessions.length}</span>
            </div>
            {otherSessions.length ? (
              <div className="sessions-other-list">
                {otherSessions.map((session) => (
                  <SessionCard
                    key={session.tokenId}
                    session={session}
                    busy={busyToken === session.tokenId}
                    onRevoke={revokeSession}
                  />
                ))}
              </div>
            ) : (
              <p className="sessions-empty-other">No other devices are signed in.</p>
            )}
          </section>

          {otherSessions.length > 0 && (
            <div className="sessions-revoke-all">
              <div>
                <strong>Sign out everywhere</strong>
                <p>Revoke every session, including this device.</p>
              </div>
              <button className="session-revoke-all-button" onClick={revokeAllSessions} disabled={revokingAll}>
                {revokingAll && <LoaderCircle size={14} className="spin" />}
                {revokingAll ? 'Signing out…' : 'Sign out everywhere'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
