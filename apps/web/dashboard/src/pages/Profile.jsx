import { useRef, useState } from 'react'
import { Camera, Check, KeyRound, LoaderCircle, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '../api/apiclient'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui'

export default function Profile() {
  const { user, fetchUser } = useAuth()
  const fileInput = useRef(null)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const localAccount = user?.provider === 'local'
  const initials = user?.fullName
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ME'

  async function updateName(event) {
    event.preventDefault()
    setBusy('name')
    setError('')

    try {
      await api.put('/auth/user/fullname', { fullname: fullName.trim() })
      await fetchUser({ force: true })
      toast.success('Name updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your name.')
    } finally {
      setBusy('')
    }
  }

  async function updatePicture(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setBusy('picture')
    setError('')

    try {
      const data = new FormData()
      data.append('profilePic', file)
      await api.put('/auth/user/profile-pic', data)
      await fetchUser({ force: true })
      toast.success('Profile picture updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your profile picture.')
    } finally {
      setBusy('')
      event.target.value = ''
    }
  }

  async function updatePassword(event) {
    event.preventDefault()
    setError('')

    if (password.newPassword !== password.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setBusy('password')
    try {
      await api.put('/auth/user/password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      })
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated. Other sessions were signed out.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your password.')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="profile-page">
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Profile"
        description="Update your personal details and sign-in credentials."
      />

      {error && <div className="sessions-error" role="alert">{error}</div>}

      <article className="profile-card profile-overview">
        <div className="profile-avatar-wrap">
          {user?.profilePic ? (
            <img className="profile-avatar" src={user.profilePic} alt={`${user.fullName} profile`} />
          ) : (
            <span className="profile-avatar profile-avatar-fallback">{initials}</span>
          )}
          {localAccount && (
            <>
              <button
                type="button"
                className="profile-avatar-edit"
                aria-label="Change profile picture"
                disabled={Boolean(busy)}
                onClick={() => fileInput.current?.click()}
              >
                {busy === 'picture'
                  ? <LoaderCircle size={15} className="spin" />
                  : <Camera size={15} />}
              </button>
              <input
                ref={fileInput}
                className="profile-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={updatePicture}
              />
            </>
          )}
        </div>
        <div className="profile-overview-copy">
          <strong>{user?.fullName || 'Your account'}</strong>
          <span>{user?.email}</span>
          <span className="profile-provider">
            {user?.provider === 'github' ? 'GitHub account' : 'Email and password account'}
          </span>
        </div>
      </article>

      {localAccount ? (
        <>
          <article className="profile-card">
            <div className="profile-card-heading">
              <span><UserRound size={18} /></span>
              <div>
                <h2>Personal details</h2>
                <p>Your name appears across your workspace.</p>
              </div>
            </div>
            <form className="profile-form" onSubmit={updateName}>
              <label className="field">
                Full name
                <input
                  autoComplete="name"
                  minLength={3}
                  maxLength={80}
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label className="field">
                Email address
                <input type="email" value={user?.email || ''} readOnly />
                <small>Email address changes are not available here.</small>
              </label>
              <button className="btn primary" disabled={Boolean(busy) || fullName.trim() === user?.fullName}>
                {busy === 'name' ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}
                Save name
              </button>
            </form>
          </article>

          <article className="profile-card">
            <div className="profile-card-heading">
              <span><KeyRound size={18} /></span>
              <div>
                <h2>Change password</h2>
                <p>Use a strong password you do not use elsewhere.</p>
              </div>
            </div>
            <form className="profile-form" onSubmit={updatePassword}>
              <label className="field">
                Current password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password.currentPassword}
                  onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })}
                />
              </label>
              <label className="field">
                New password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password.newPassword}
                  onChange={(event) => setPassword({ ...password, newPassword: event.target.value })}
                />
                <small>At least 8 characters, with uppercase, lowercase, a number, and a special character (@$!%*?&amp;).</small>
              </label>
              <label className="field">
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password.confirmPassword}
                  onChange={(event) => setPassword({ ...password, confirmPassword: event.target.value })}
                />
              </label>
              <button className="btn primary" disabled={Boolean(busy)}>
                {busy === 'password' ? <LoaderCircle size={15} className="spin" /> : <KeyRound size={15} />}
                Update password
              </button>
            </form>
          </article>
        </>
      ) : (
        <div className="sessions-security-note">
          <UserRound size={20} />
          <p>Your name and profile picture come from GitHub. Password changes are managed by GitHub.</p>
        </div>
      )}
    </section>
  )
}
