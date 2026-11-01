import Github from '../components/Github'
import ThemePicker from '../components/ThemePicker'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { BaseUrl } from '../api/ApiUrl'
import { api } from '../api/apiclient'
import { redirectPathFromState, storeAuthRedirect } from '../routes/authRedirect'
import { Logo } from '../components/ui'

export default function Auth({ signup = false }) {
  const { login } = useAuth(),
    location = useLocation(),
    navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' }),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [verify, setVerify] = useState(false),
    [otp, setOtp] = useState('')
  const redirect = redirectPathFromState(location.state)
  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (signup && verify) {
        await api.post('/auth/register/verify', { email: form.email, otp })
        toast.success('Email verified. You can now sign in.')
        navigate('/login', { state: location.state })
      } else if (signup) {
        await api.post('/auth/register/init', form)
        setVerify(true)
      } else await login(form.email, form.password, redirect)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Please try again.')
    } finally {
      setBusy(false)
    }
  }
  async function resend() {
    setBusy(true)
    try {
      await api.post('/auth/resendotp', { email: form.email })
      toast.success('A new code is on its way')
    } catch (e) {
      setError(e.response?.data?.message || 'Could not resend the code')
    } finally {
      setBusy(false)
    }
  }
  function github() {
    storeAuthRedirect(redirect)
    window.location.assign(`${BaseUrl}/auth/github`)
  }
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link to="/">
          <Logo />
        </Link>
        <div className="auth-story-content">
          <span className="banner-eyebrow">
            <span /> BUILT FOR BUILDERS
          </span>
          <h1>
            Less between
            <br />
            your idea
            <br />
            and the world<span>.</span>
          </h1>
          <p>
            A thoughtful home for your code.
            <br />
            From the first commit to whatever comes next.
          </p>
          <div className="auth-code">
            <div>
              <i />
              <i />
              <i />
              <span>Your deployment workflow</span>
            </div>
            <p>
              <span>1</span> Connect your Git repository
            </p>
            <p className="code-success">
              <span>2</span> Configure your build
            </p>
            <p className="code-success">
              <span>3</span> Deploy and follow your logs
            </p>
            <p>
              <span>↗</span> Manage it all in one workspace.
            </p>
          </div>
        </div>
        <div className="auth-story-footer">
          <Sparkles size={16} />
          Your next idea looks good from here.
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-top">
          <ThemePicker />
          {signup ? 'Already building with us?' : 'New around here?'}
          <Link to={signup ? '/login' : '/signup'} state={location.state}>
            {signup ? 'Sign in' : 'Create an account'}
            <ArrowRight size={13} />
          </Link>
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {verify
              ? 'ONE LAST THING'
              : signup
                ? 'GREAT THINGS START HERE'
                : 'YOUR WORKSPACE IS WAITING'}
          </span>
          <h2>
            {verify
              ? 'Check your inbox.'
              : signup
                ? 'Let’s bring your ideas to life.'
                : 'Welcome back, builder.'}
          </h2>
          <p>
            {verify
              ? `We sent a verification code to ${form.email}.`
              : signup
                ? 'Make something you’re excited to share.'
                : 'Pick up where you left off. Your next great thing is waiting.'}
          </p>
          {!verify && (
            <>
              <button className="btn github-button" disabled={busy} onClick={github}>
                <Github size={18} />
                Continue with GitHub
              </button>
              <div className="auth-divider">
                <span>or continue with email</span>
              </div>
            </>
          )}
          <form onSubmit={submit}>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {verify ? (
              <label className="field">
                Verification code
                <input
                  autoFocus
                  aria-label="Verification code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </label>
            ) : (
              <>
                {signup && (
                  <label className="field">
                    Full name
                    <input
                      name="fullName"
                      autoComplete="name"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Your full name"
                    />
                  </label>
                )}
                <label className="field">
                  Email address
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="field">
                  Password
                  <div className="password-input">
                    <input
                      name="password"
                      type={visible ? 'text' : 'password'}
                      autoComplete={signup ? 'new-password' : 'current-password'}
                      required
                      minLength={signup ? 8 : 1}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={signup ? 'At least 8 characters' : 'Enter your password'}
                      aria-describedby={signup ? 'password-requirements' : undefined}
                    />
                    <button
                      type="button"
                      aria-label={visible ? 'Hide password' : 'Show password'}
                      onClick={() => setVisible((v) => !v)}
                    >
                      {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {signup && (
                    <small id="password-requirements">
                      Use uppercase and lowercase letters, a number, and a special character
                      (@$!%*?&).
                    </small>
                  )}
                </label>
              </>
            )}
            <button className="btn primary full-width auth-submit" disabled={busy}>
              {busy
                ? 'Just a moment…'
                : verify
                  ? 'Verify email'
                  : signup
                    ? 'Create your account'
                    : 'Let’s get building'}
              <ArrowRight size={16} />
            </button>
            {verify && (
              <button type="button" className="btn full-width" disabled={busy} onClick={resend}>
                Resend verification code
              </button>
            )}
          </form>
          <div className="auth-footnote">
            <Check size={14} />
            Your code. Your ideas. Your space to build.
          </div>
        </div>
        <footer>
          © {new Date().getFullYear()} DeployHub<span>Made for the way you build.</span>
        </footer>
      </main>
    </div>
  )
}
