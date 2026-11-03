import { useEffect, useState } from 'react'
import { KeyRound, LoaderCircle, Mail, ShieldCheck, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/apiclient'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui'

export default function Security() {
  const { user } = useAuth()
  const [status, setStatus] = useState(null)
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const { data } = await api.get('/auth/2fa')
    setStatus({ enabled: data.enabled, method: data.method })
  }

  useEffect(() => {
    if (user?.provider !== 'local') return

    api.get('/auth/2fa')
      .then(({ data }) => setStatus({ enabled: data.enabled, method: data.method }))
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load security settings.')
      })
  }, [user?.provider])

  async function startTotp() {
    setBusy(true)
    setError('')

    try {
      const { data } = await api.post('/auth/2fa/totp/setup', {})
      setSetup(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start authenticator setup.')
    } finally {
      setBusy(false)
    }
  }

  async function startEmail() {
    setBusy(true)
    setError('')

    try {
      await api.post('/auth/2fa/email/send', {})
      setEmailSent(true)
      toast.success('Verification code sent')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send verification code.')
    } finally {
      setBusy(false)
    }
  }

  async function enable(method) {
    setBusy(true)
    setError('')

    try {
      const endpoint = method === 'totp'
        ? '/auth/2fa/totp/enable'
        : '/auth/2fa/email/enable'

      await api.post(endpoint, { code })
      setSetup(null)
      setCode('')
      setEmailSent(false)
      await refresh()
      toast.success('Two-factor authentication enabled')
    } catch (err) {
      setError(err.response?.data?.message || 'That code could not be verified.')
    } finally {
      setBusy(false)
    }
  }

  async function switchMethod(method) {
    setBusy(true)
    setError('')

    try {
      await api.put('/auth/2fa/method', { method })
      await refresh()
      toast.success('Sign-in method updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the method.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setError('')

    try {
      await api.delete('/auth/2fa')
      setSetup(null)
      await refresh()
      toast.success('Two-factor authentication disabled')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not disable two-factor authentication.')
    } finally {
      setBusy(false)
    }
  }

  if (user?.provider !== 'local') {
    return (
      <section className="security-page">
        <PageHeader
          eyebrow="ACCOUNT SECURITY"
          title="Two-factor authentication"
          description="Two-factor sign-in is available for email and password accounts."
        />
        <div className="sessions-security-note">
          <ShieldCheck size={20} />
          <p>This GitHub account uses GitHub’s sign-in security settings.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="security-page">
      <PageHeader
        eyebrow="ACCOUNT SECURITY"
        title="Two-factor authentication"
        description="Add a second check every time you sign in with your email and password."
      />

      {error && <div className="sessions-error" role="alert">{error}</div>}

      {status ? (
        <>
          <article className="security-card">
            <span className="security-card-icon">
              <ShieldCheck size={21} />
            </span>
            <div className="security-card-body">
              <strong>
                {status.enabled
                  ? 'Two-factor authentication is on'
                  : 'Protect your account at sign-in'}
              </strong>
              <p>
                {status.enabled
                  ? `Your sign-in code currently comes from ${status.method === 'email' ? 'email' : 'your authenticator app'}.`
                  : 'Choose email codes or an authenticator app. You will need a code on every password sign-in.'}
              </p>
            </div>
            {status.enabled && <span className="security-enabled">Enabled</span>}
          </article>

          {!status.enabled && (
            <div className="security-options">
              <article className="security-option">
                <Mail size={20} />
                <div>
                  <strong>Email code</strong>
                  <p>Receive a one-time code at {user?.email}.</p>
                  {emailSent ? (
                    <>
                      <label className="field">
                        Verification code
                        <input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={code}
                          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                        />
                      </label>
                      <button
                        className="btn primary"
                        disabled={busy || code.length !== 6}
                        onClick={() => enable('email')}
                      >
                        {busy ? 'Verifying…' : 'Verify and enable'}
                      </button>
                    </>
                  ) : (
                    <button className="btn" disabled={busy} onClick={startEmail}>
                      {busy && <LoaderCircle size={15} className="spin" />}
                      Send email code
                    </button>
                  )}
                </div>
              </article>

              <article className="security-option">
                <Smartphone size={20} />
                <div>
                  <strong>Authenticator app</strong>
                  <p>
                    Use an authenticator app such as Google Authenticator, Microsoft
                    Authenticator, or 1Password.
                  </p>
                  {setup ? (
                    <>
                      <p>In your authenticator app, add this account manually using the key:</p>
                      <code className="security-secret">{setup.secret}</code>
                      <label className="field">
                        Authenticator code
                        <input
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={code}
                          onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                        />
                      </label>
                      <button
                        className="btn primary"
                        disabled={busy || code.length !== 6}
                        onClick={() => enable('totp')}
                      >
                        {busy ? 'Verifying…' : 'Verify and enable'}
                      </button>
                    </>
                  ) : (
                    <button className="btn" disabled={busy} onClick={startTotp}>
                      {busy && <LoaderCircle size={15} className="spin" />}
                      <KeyRound size={15} />
                      Set up authenticator app
                    </button>
                  )}
                </div>
              </article>
            </div>
          )}

          {status.enabled && (
            <div className="security-actions">
              <label className="field">
                Code method for future sign-ins
                <select
                  value={status.method}
                  disabled={busy}
                  onChange={(event) => switchMethod(event.target.value)}
                >
                  <option value="email">Email code</option>
                  <option value="totp">Authenticator app</option>
                </select>
              </label>
              <button className="btn" disabled={busy} onClick={disable}>
                Turn off two-factor authentication
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="sessions-loading" role="status">
          <LoaderCircle size={17} className="spin" />
          Loading security settings…
        </div>
      )}
    </section>
  )
}
