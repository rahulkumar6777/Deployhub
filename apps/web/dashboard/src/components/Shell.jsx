import ThemePicker from './ThemePicker'
import { timeAgo } from '../utils'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BookOpen,
  Box,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  Command,
  CreditCard,
  ExternalLink,
  GitBranch,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { LoadState, Logo, Modal, RuntimeIcon, StatusBadge } from './ui'

const nav = [
  { to: '/', name: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/projects', name: 'Projects', icon: Box },
  { to: '/analytics', name: 'Analytics', icon: Activity },
]
export default function Shell() {
  const { user, logout } = useAuth()
  const { projects, builds, buildsLoading, buildsError, reloadBuilds } = useWorkspace()
  const [mobile, setMobile] = useState(false),
    [dialog, setDialog] = useState(null),
    [query, setQuery] = useState('')
  const location = useLocation(),
    navigate = useNavigate()
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setDialog('search')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  const currentName = location.pathname.startsWith('/project/')
    ? 'Project workspace'
    : nav.find((n) => n.to === location.pathname)?.name ||
      (location.pathname.includes('/new')
        ? 'New project'
        : location.pathname.includes('security')
          ? 'Sign-in security'
          : location.pathname.includes('sessions')
          ? 'Sessions'
          : location.pathname === '/profile'
            ? 'Account settings'
            : 'Workspace')
  const results = [
    ...nav.map((n) => ({ name: n.name, to: n.to, icon: n.icon })),
    ...projects.map((p) => ({ name: p.name, to: `/project/${p._id}`, icon: Box })),
  ].filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
  function openPage(to) {
    setDialog(null)
    setQuery('')
    navigate(to)
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
        <Link to="/" className="brand-link" aria-label="DeployHub overview">
          <Logo />
        </Link>
        <button className="workspace-switch" onClick={() => setDialog('workspace')}>
          <span className="workspace-avatar">{user?.fullName?.[0] || 'A'}</span>
          <span>
            <strong>{user?.fullName?.split(' ')[0] || 'My'}’s workspace</strong>
            <small>Personal workspace</small>
          </span>
          <ChevronDown size={15} />
        </button>
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {nav.map(({ icon: Icon, ...item }) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobile(false)}>
              <Icon size={18} />
              <span>{item.name}</span>
              {item.name === 'Projects' && <span className="nav-count">{projects.length}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="nav-section-label second-label">MANAGE</div>
        <nav className="main-nav" aria-label="Workspace management">
          <NavLink to="/billing" onClick={() => setMobile(false)}>
            <CreditCard size={18} />
            Usage & billing
          </NavLink>
          <NavLink to="/settings/sessions" onClick={() => setMobile(false)}>
            <ShieldCheck size={18} />
            Sessions
          </NavLink>
          <NavLink to="/settings/security" onClick={() => setMobile(false)}>
            <ShieldCheck size={18} />
            Sign-in security
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="ship-card">
            <span className="ship-icon">
              <Zap size={18} />
            </span>
            <h3>Built for your next big thing.</h3>
            <p>From first commit to production. We’ve got the infrastructure.</p>
            <Link to="/projects/new" onClick={() => setMobile(false)}>
              Let’s ship it
              <ArrowRight size={15} />
            </Link>
            <div className="ship-orbit" />
          </div>
          <button className="sidebar-help" onClick={() => setDialog('help')}>
            <BookOpen size={17} />
            Quick start guide
            <ArrowRight size={14} />
          </button>
          <button className="sidebar-help" onClick={() => setDialog('activity')}>
            <CircleHelp size={17} />
            Workspace activity
          </button>
          <button className="user-menu" onClick={() => setDialog('account')}>
            <span className="user-avatar">
              {user?.fullName
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2) || 'ME'}
            </span>
            <span>
              <strong>{user?.fullName || 'Your account'}</strong>
              <small>{user?.email}</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="breadcrumb-workspace">Workspace</span>
            <ChevronRight size={13} />
            <strong>{currentName}</strong>
          </div>
          <div className="topbar-actions">
            <ThemePicker />
            <button className="global-search" onClick={() => setDialog('search')}>
              <Search size={15} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="icon-btn notification-button"
              aria-label="View recent activity"
              onClick={() => setDialog('activity')}
            >
              <Bell size={18} />
            </button>
            <button
              className="top-avatar"
              aria-label="Your account"
              onClick={() => setDialog('account')}
            >
              {user?.fullName?.[0] || 'A'}
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" key={location.pathname}>
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>
            <Logo compact />
            Made for the way you build.
          </span>
          <span>
            DeployHub workspace
            <span className="footer-dot" />
            {new Date().getFullYear()}
          </span>
        </footer>
      </div>
      {dialog === 'search' && (
        <Modal title="Find your next destination" onClose={() => setDialog(null)}>
          <div className="search-field command-input">
            <Search size={18} />
            <input
              autoFocus
              aria-label="Search pages and projects"
              placeholder="Search projects, pages, settings…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="command-results">
            {results.length ? (
              results.map(({ name, to, icon: Icon }) => (
                <button key={to} onClick={() => openPage(to)}>
                  <Icon size={18} />
                  <span>{name}</span>
                  <ArrowRight size={16} />
                </button>
              ))
            ) : (
              <p className="muted">No results for “{query}”. Try a project name.</p>
            )}
          </div>
          <div className="command-footer">
            <Command size={13} />K to open <span>Esc to close</span>
          </div>
        </Modal>
      )}
      {dialog === 'activity' && (
        <Modal
          title="Workspace activity"
          description="The latest from your deployment pipeline."
          onClose={() => setDialog(null)}
        >
          <LoadState loading={buildsLoading} error={buildsError} retry={reloadBuilds}>
            <div className="activity-list">
              {builds.slice(0, 6).map((b) => (
                <button key={b._id} onClick={() => openPage(`/deployments`)}>
                  <span className="activity-icon">
                    <GitBranch size={17} />
                  </span>
                  <span>
                    <strong>{b.projectName}</strong>
                    <small>
                      {b.commitMessage || 'Deployment'} · {timeAgo(b.createdAt)}
                    </small>
                  </span>
                  <StatusBadge status={b.buildStatus || b.buildStaus} />
                </button>
              ))}
              {!builds.length && (
                <p className="muted">Your deployment activity will appear here.</p>
              )}
            </div>
          </LoadState>
        </Modal>
      )}
      {dialog === 'account' && (
        <Modal title="Your account" description={user?.email} onClose={() => setDialog(null)}>
          <div className="command-results">
            <button
              onClick={() => {
                setDialog(null)
                logout()
              }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </Modal>
      )}
      {dialog === 'workspace' && (
        <Modal
          title="Your workspace"
          description="Your projects, together in one place."
          onClose={() => setDialog(null)}
        >
          <div className="workspace-option">
            <span className="workspace-avatar">{user?.fullName?.[0]}</span>
            <span>
              <strong>{user?.fullName}’s workspace</strong>
              <small>{projects.length} projects · Personal workspace</small>
            </span>
            <ShieldCheck size={20} />
          </div>
          <p className="muted">
            Project access and billing are managed through your personal account.
          </p>
        </Modal>
      )}
      {dialog === 'help' && (
        <Modal
          title="From idea to live, in a few steps."
          description="Your quick start to DeployHub."
          onClose={() => setDialog(null)}
        >
          <div className="quick-steps">
            {[
              [
                Code2,
                'Connect your code',
                'Use a public Git repository or sign in with GitHub to import a private repository.',
              ],
              [
                Settings2,
                'Make it yours',
                'Choose a runtime, configure your build, and add environment variables.',
              ],
              [
                Globe,
                'Meet the world',
                'Deploy your project, connect a domain, and follow your live logs.',
              ],
            ].map(([Icon, title, text], i) => (
              <div key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>
                    <Icon size={16} />
                    {title}
                  </h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/projects/new"
            className="btn primary full-width"
            onClick={() => setDialog(null)}
          >
            <Plus size={16} />
            Create your project
          </Link>
        </Modal>
      )}
    </div>
  )
}

