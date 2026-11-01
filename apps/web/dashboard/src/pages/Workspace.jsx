import { timeAgo } from '../utils'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  Code2,
  GitBranch,
  Globe,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import {
  EmptyState,
  LoadState,
  Modal,
  PageHeader,
  ProjectCard,
  RuntimeIcon,
  StatusBadge,
} from '../components/ui'

const statusOf = (b) => b.buildStatus || b.buildStaus || 'queued'
function duration(build) {
  if (!build.startedAt || !build.finishedAt) return null
  return Math.max(0, Math.round((new Date(build.finishedAt) - new Date(build.startedAt)) / 1000))
}
export function DeploymentChart({ builds }) {
  const [days, setDays] = useState(7)
  const rows = Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - days + i + 1)
    date.setHours(0, 0, 0, 0)
    const matching = builds.filter((b) => {
      const time = new Date(b.createdAt).getTime()
      return time >= date.getTime() && time < date.getTime() + 86400000
    })
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Successful: matching.filter((b) => statusOf(b) === 'success').length,
      Other: matching.filter((b) => statusOf(b) !== 'success').length,
    }
  })
  const total = rows.reduce((sum, r) => sum + r.Successful + r.Other, 0)
  return (
    <section className="panel deployment-chart">
      <div className="panel-heading">
        <div>
          <h2>Deployment activity</h2>
          <p>A little progress, every day.</p>
        </div>
        <select
          className="select compact"
          aria-label="Deployment activity period"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      <div className="chart-summary">
        <strong>{total}</strong>
        <span>deployments</span>
        <div className="chart-legend">
          <span>
            <i />
            Successful
          </span>
          <span>
            <i />
            Other
          </span>
        </div>
      </div>
      <div
        className="chart-container"
        role="img"
        aria-label={`${total} deployments over the last ${days} days`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 12, right: 10, left: -27, bottom: 0 }}>
            <defs>
              <linearGradient id="deployment-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--theme-accent)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--theme-accent)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--theme-line)" strokeDasharray="3 4" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              minTickGap={36}
              tick={{ fill: 'var(--theme-muted)', fontSize: 10 }}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--theme-muted)', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: '1px solid var(--theme-line)',
                fontSize: 12,
              }}
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="Other"
              stroke="var(--theme-muted)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="transparent"
            />
            <Area
              isAnimationActive={false}
              type="monotone"
              dataKey="Successful"
              stroke="var(--theme-accent)"
              strokeWidth={2.5}
              fill="url(#deployment-fill)"
              activeDot={{ r: 5, stroke: 'var(--theme-surface)', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export function Dashboard() {
  const { user } = useAuth(),
    { projects, builds, loading, error, reload, buildsLoading, buildsError, reloadBuilds } =
      useWorkspace()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('deployhub.dismiss-welcome') === 'true'
    } catch {
      return false
    }
  })
  const successful = builds.filter((b) => statusOf(b) === 'success').length
  const durations = builds.map(duration).filter((v) => v !== null)
  const stats = [
    {
      label: 'Total projects',
      value: projects.length,
      note: `${projects.filter((p) => p.status === 'running').length} projects are ready`,
      icon: Box,
    },
    {
      label: 'Deployments',
      value: builds.length,
      note: 'Across all your projects',
      icon: GitBranch,
    },
    {
      label: 'Success rate',
      value: builds.length ? `${Math.round((successful / builds.length) * 100)}%` : '—',
      note: 'Of loaded deployments',
      icon: CheckCheck,
    },
    {
      label: 'Avg. build time',
      value: durations.length
        ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)}s`
        : '—',
      note: 'Completed builds',
      icon: Clock3,
    },
  ]
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE, AT A GLANCE"
        title={`Let’s build something great, ${user?.fullName?.split(' ')[0] || 'there'}.`}
        description="Your projects, deployments, and a little room for your next idea."
      >
        <Link className="btn primary" to="/projects/new">
          <Plus size={16} />
          New project
        </Link>
      </PageHeader>
      <LoadState loading={loading} error={error} retry={reload}>
        {!dismissed && (
          <section className="welcome-banner">
            <div className="welcome-copy">
              <span className="banner-eyebrow">
                <span /> LESS CONFIGURING. MORE CREATING.
              </span>
              <h2>
                Your next idea deserves
                <br />
                to be out in the world.
              </h2>
              <p>Connect your code. We’ll take care of the rest.</p>
              <Link to="/projects/new">
                Deploy something new
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="pipeline-art" aria-hidden="true">
              <div className="art-grid" />
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="pipeline-node code-node">
                <Code2 size={24} />
                <span>git push</span>
              </div>
              <div className="pipeline-connector first" />
              <div className="pipeline-node hub-node">
                <svg viewBox="0 0 40 40">
                  <path d="m8 29 12-20 12 20h-9l-3-7-4 7z" fill="currentColor" />
                  <circle cx="32" cy="9" r="3" fill="currentColor" />
                </svg>
                <span>Build. Deploy. Done.</span>
              </div>
              <div className="pipeline-connector second" />
              <div className="pipeline-node live-node">
                <Globe size={23} />
                <span>
                  You’re live
                  <Check size={12} />
                </span>
              </div>
              <div className="art-caption">
                <span />
                IDEA → PRODUCTION
              </div>
              <Sparkles className="art-sparkle" size={19} />
            </div>
            <button
              className="banner-close"
              aria-label="Dismiss welcome banner"
              onClick={() => {
                setDismissed(true)
                try {
                  sessionStorage.setItem('deployhub.dismiss-welcome', 'true')
                } catch {
                  /* optional preference */
                }
              }}
            >
              <X size={16} />
            </button>
          </section>
        )}
        <LoadState loading={buildsLoading} error={buildsError} retry={reloadBuilds}>
          <div className="stats-grid">
            {stats.map(({ label, value, note, icon: Icon }, i) => (
              <section className="stat-card" key={label}>
                <div className="stat-label">
                  {label}
                  <Icon size={16} />
                </div>
                <div className="stat-value">{value}</div>
                <div className="stat-note">
                  {i === 0 && <span className="green-dot" />}
                  {note}
                </div>
              </section>
            ))}
          </div>
        </LoadState>
        <div className="section-heading">
          <div>
            <h2>
              Your projects <span className="count-chip">{projects.length}</span>
            </h2>
            <p>Big ideas. Small side projects. All in one place.</p>
          </div>
          <Link className="text-link" to="/projects">
            View all projects
            <ArrowRight size={14} />
          </Link>
        </div>
        {projects.length ? (
          <div className="projects-grid">
            {projects.slice(0, 3).map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Link className="btn primary" to="/projects/new">
                <Plus size={16} />
                Create project
              </Link>
            }
          />
        )}
        <div className="overview-bottom">
          <LoadState loading={buildsLoading} error={buildsError} retry={reloadBuilds}>
            <DeploymentChart builds={builds} />
          </LoadState>
          <section className="panel recent-activity">
            <div className="panel-heading">
              <div>
                <h2>Recent activity</h2>
                <p>The latest behind the scenes.</p>
              </div>
              <Link className="icon-btn" aria-label="View all deployments" to="/deployments">
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="timeline">
              {builds.slice(0, 4).map((b) => (
                <Link to="/deployments" key={b._id}>
                  <span className={`timeline-icon ${statusOf(b) === 'failed' ? 'failed' : ''}`}>
                    {statusOf(b) === 'success' ? (
                      <Check size={14} />
                    ) : statusOf(b) === 'failed' ? (
                      <X size={14} />
                    ) : (
                      <GitBranch size={14} />
                    )}
                  </span>
                  <div>
                    <strong>
                      {statusOf(b) === 'success'
                        ? 'Deployment successful'
                        : statusOf(b) === 'failed'
                          ? 'Build needs your attention'
                          : 'Deployment in progress'}
                    </strong>
                    <p>
                      {b.projectName}
                      <span>·</span>
                      {b.branch || b.commitSha?.slice(0, 7) || 'Deployment'}
                    </p>
                    <small>{timeAgo(b.createdAt)}</small>
                  </div>
                </Link>
              ))}
              {!builds.length && <p className="muted">Your first deployment starts the story.</p>}
            </div>
            <Link to="/deployments" className="activity-footer">
              View deployment history
              <ArrowRight size={14} />
            </Link>
          </section>
        </div>
        <div className="bottom-note">
          <span>
            <Terminal size={15} />
            From your first commit to your millionth request.
          </span>
          <span>
            Keep building. We’ll keep it running.
            <Sparkles size={14} />
          </span>
        </div>
      </LoadState>
    </>
  )
}

export function Projects() {
  const { projects, loading, error, reload } = useWorkspace()
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState('all'),
    [runtime, setRuntime] = useState('all'),
    [view, setView] = useState('grid'),
    [sort, setSort] = useState('recent')
  const filtered = projects
    .filter(
      (p) =>
        `${p.name} ${p.domain} ${p.repoUrl}`.toLowerCase().includes(query.toLowerCase()) &&
        (status === 'all' || p.status === status) &&
        (runtime === 'all' || p.type === runtime),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : new Date(b.updatedAt) - new Date(a.updatedAt),
    )
  return (
    <>
      <PageHeader
        eyebrow="A HOME FOR YOUR IDEAS"
        title="Your projects"
        description="Everything you’re building, beautifully in sync."
      >
        <Link className="btn primary" to="/projects/new">
          <Plus size={16} />
          New project
        </Link>
      </PageHeader>
      <div className="project-filters">
        <div className="filter-tabs" aria-label="Filter projects by status">
          {[
            ['all', 'All projects'],
            ['running', 'Ready'],
            ['building', 'Building'],
            ['failed', 'Failed'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={status === value ? 'active' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
              <span>{projects.filter((p) => value === 'all' || p.status === value).length}</span>
            </button>
          ))}
        </div>
        <div className="filter-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="Search projects"
              placeholder="Search your projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Clear search" className="icon-btn" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="select"
            aria-label="Filter by runtime"
            value={runtime}
            onChange={(e) => setRuntime(e.target.value)}
          >
            <option value="all">All runtimes</option>
            <option value="static">Static site</option>
            <option value="node">Node.js</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="java">Java</option>
          </select>
          <select
            className="select"
            aria-label="Sort projects"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Recently updated</option>
            <option value="name">Name A–Z</option>
          </select>
          <div className="view-toggle">
            <button
              aria-label="Grid view"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              aria-label="List view"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>
      <LoadState loading={loading} error={error} retry={reload}>
        {filtered.length ? (
          <div className={view === 'grid' ? 'projects-grid full-projects' : 'projects-list'}>
            {filtered.map((project) => (
              <ProjectCard key={project._id} project={project} list={view === 'list'} />
            ))}
            {view === 'grid' && (
              <Link className="new-project-card" to="/projects/new">
                <span>
                  <Plus size={23} />
                </span>
                <h3>Make room for your next idea.</h3>
                <p>Create a new project</p>
              </Link>
            )}
          </div>
        ) : (
          <EmptyState
            title="No projects found"
            description="Try another search or filter, or bring a new idea to life."
            action={
              <button
                className="btn"
                onClick={() => {
                  setStatus('all')
                  setRuntime('all')
                  setQuery('')
                }}
              >
                Reset filters
              </button>
            }
          />
        )}
      </LoadState>
      <p className="results-caption">
        Showing {filtered.length} of {projects.length} projects
      </p>
    </>
  )
}

export function WorkspaceAnalytics() {
  const { projects, loading, error, reload, builds, buildsLoading, buildsError, reloadBuilds } =
    useWorkspace()
  return (
    <>
      <PageHeader
        eyebrow="A CLEARER PICTURE"
        title="Workspace analytics"
        description="Follow your delivery cadence. Explore a project for traffic and request analytics."
      />
      <LoadState loading={buildsLoading} error={buildsError} retry={reloadBuilds}>
        <DeploymentChart builds={builds} />
      </LoadState>
      <LoadState loading={loading} error={error} retry={reload}>
        <div className="section-heading">
          <div>
            <h2>Explore project analytics</h2>
            <p>Traffic, visitors, error rates, and endpoints.</p>
          </div>
        </div>
        <div className="projects-grid">
          {projects.map((p) => (
            <Link className="panel analytics-project" key={p._id} to={`/project/${p._id}/metrics`}>
              <RuntimeIcon type={p.type} />
              <div>
                <h3>{p.name}</h3>
                <p>View request analytics</p>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </div>
        {!projects.length && (
          <EmptyState
            title="Analytics start with a project"
            description="Deploy a project to start collecting insights."
          />
        )}
      </LoadState>
    </>
  )
}

export function WorkspaceBilling() {
  const { projects, loading, error, reload } = useWorkspace()
  return (
    <>
      <PageHeader
        eyebrow="SIMPLE, TRANSPARENT"
        title="Usage & billing"
        description="Each project has its own plan. See exactly what powers your work."
      />
      <div className="billing-banner">
        <span className="empty-icon">
          <Zap size={26} />
        </span>
        <div>
          <h2>A plan for every stage.</h2>
          <p>
            From a free static site to a production service. Manage subscriptions and billing in
            each project.
          </p>
        </div>
      </div>
      <LoadState loading={loading} error={error} retry={reload}>
        <div className="projects-grid">
          {projects.map((p) => (
            <Link key={p._id} to={`/project/${p._id}/billing`} className="panel billing-project">
              <div className="project-card-top">
                <RuntimeIcon type={p.type} />
                <span className="plan-chip">{p.plan || 'Plan unavailable'}</span>
              </div>
              <h3>{p.name}</h3>
              <p>
                View plan, resources & payment history
                <ArrowRight size={15} />
              </p>
            </Link>
          ))}
        </div>
        {!projects.length && (
          <EmptyState
            title="No active subscriptions"
            description="Your project plans will appear here."
          />
        )}
      </LoadState>
    </>
  )
}
