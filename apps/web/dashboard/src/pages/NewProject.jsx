import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CircleAlert, CreditCard, LoaderCircle, Rocket, Search, Sparkles } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/apiclient'
import Github from '../components/Github'
import { PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    types: ['static'],
    description: 'Try a static site deployment.',
    features: ['DeployHub subdomain', 'SSL certificate', 'Email alerts'],
  },
  starter: {
    name: 'Starter',
    price: 1499,
    types: ['static', 'node', 'go', 'python'],
    description: 'For apps ready for a custom domain.',
    features: ['Custom domains', 'GitHub CI/CD', '256 MB RAM', '0.5 vCPU'],
  },
  pro: {
    name: 'Pro',
    price: 2499,
    types: ['static', 'node', 'go', 'python', 'java'],
    description: 'More resources and deeper monitoring.',
    features: ['AI diagnostics', 'Uptime monitoring', '512 MB RAM', '1 vCPU'],
  },
}

const TYPES = [
  ['static', 'Static site'],
  ['node', 'Node.js'],
  ['go', 'Go'],
  ['python', 'Python'],
  ['java', 'Java'],
]
const VERSIONS = {
  static: ['22', '24'],
  node: ['22', '24'],
  go: ['1.21', '1.22', '1.23'],
  python: ['3.10', '3.11', '3.12'],
  java: ['17', '21'],
}
const DEFAULT_VERSIONS = { static: '24', node: '24', go: '1.22', python: '3.11', java: '21' }
const TERMS = [1, 3, 6, 12]

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

function parseEnvironment(text) {
  if (!text.trim()) return undefined
  const result = {}
  for (const line of text.split('\n')) {
    const value = line.trim()
    if (!value || value.startsWith('#')) continue
    const separator = value.indexOf('=')
    if (separator < 1) throw new Error(`Invalid environment entry: ${value}`)
    result[value.slice(0, separator).trim()] = value.slice(separator + 1).trim()
  }
  return Object.keys(result).length ? result : undefined
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  const existing = document.querySelector('script[data-razorpay-checkout]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = resolve
    script.onerror = () => reject(new Error('Could not load the payment checkout.'))
    document.body.appendChild(script)
  })
}

export default function NewProject() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addProject } = useWorkspace()
  const initialType = TYPES.some(([id]) => id === searchParams.get('type')) ? searchParams.get('type') : 'static'
  const [projectType, setProjectType] = useState(initialType)
  const [plan, setPlan] = useState(initialType === 'static' ? 'free' : 'starter')
  const [months, setMonths] = useState(1)
  const [form, setForm] = useState({
    projectName: '',
    version: DEFAULT_VERSIONS[initialType],
    repoUrl: '',
    branch: 'main',
    rootDirectory: '.',
    subdomain: '',
    buildCommand: 'npm run build',
    publishDir: 'dist',
    startCommand: 'npm start',
    port: '3000',
    envText: '',
  })
  const [subdomainEdited, setSubdomainEdited] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [repositories, setRepositories] = useState([])
  const [repositoriesLoading, setRepositoriesLoading] = useState(false)
  const [repositoriesError, setRepositoriesError] = useState('')
  const [repositoryQuery, setRepositoryQuery] = useState('')
  const [manualRepository, setManualRepository] = useState(false)
  const [razorpayReady, setRazorpayReady] = useState(Boolean(window.Razorpay))
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
  const isGithubUser = user?.provider?.toLowerCase() === 'github'
  const isStatic = projectType === 'static'
  const paid = plan !== 'free'
  const supportedPlans = useMemo(
    () => Object.entries(PLANS).filter(([, item]) => item.types.includes(projectType)),
    [projectType],
  )
  const filteredRepositories = useMemo(() => {
    const query = repositoryQuery.trim().toLowerCase()
    if (!query) return repositories
    return repositories.filter((repository) =>
      `${repository.full_name} ${repository.description || ''}`.toLowerCase().includes(query),
    )
  }, [repositories, repositoryQuery])

  const fetchRepositories = useCallback(async () => {
    if (!isGithubUser) return
    setRepositoriesLoading(true)
    setRepositoriesError('')
    try {
      const { data } = await api.get('/auth/user/repos')
      setRepositories(Array.isArray(data?.repositories) ? data.repositories : [])
    } catch (err) {
      setRepositoriesError(err.response?.data?.message || 'Could not load your GitHub repositories.')
    } finally {
      setRepositoriesLoading(false)
    }
  }, [isGithubUser])

  useEffect(() => {
    if (isGithubUser) fetchRepositories()
  }, [fetchRepositories, isGithubUser])

  useEffect(() => {
    if (paid && razorpayKey) {
      loadRazorpay().then(() => setRazorpayReady(true)).catch(() => setRazorpayReady(false))
    }
  }, [paid, razorpayKey])

  function selectRepository(url) {
    const repository = repositories.find((item) => item.html_url === url)
    setForm((current) => ({
      ...current,
      repoUrl: repository?.html_url || '',
      branch: repository?.default_branch || current.branch || 'main',
      ...(repository && !current.projectName ? { projectName: repository.name, subdomain: slugify(repository.name) } : {}),
    }))
    setSubdomainEdited(false)
    setError('')
  }

  function changeType(nextType) {
    setProjectType(nextType)
    setForm((current) => ({ ...current, version: DEFAULT_VERSIONS[nextType] }))
    if (!PLANS[plan].types.includes(nextType)) setPlan(nextType === 'static' ? 'free' : 'starter')
    setError('')
  }

  function changeField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    if (name === 'projectName' && !subdomainEdited) {
      setForm((current) => ({ ...current, [name]: value, subdomain: slugify(value) }))
    }
    setError('')
  }

  function makePayload() {
    const env = parseEnvironment(form.envText)
    const payload = {
      plan,
      ...(paid ? { months } : {}),
      projectName: form.projectName.trim(),
      projectType,
      version: form.version,
      isMicroservice: false,
      repoUrl: form.repoUrl.trim(),
      branch: form.branch.trim(),
      rootDirectory: form.rootDirectory.trim() || '.',
      subdomain: form.subdomain.trim(),
      ...(env ? { env } : {}),
      ...(isStatic
        ? { buildCommand: form.buildCommand.trim(), publishDir: form.publishDir.trim() }
        : { startCommand: form.startCommand.trim(), port: Number(form.port) }),
    }

    if (!payload.projectName) throw new Error('Enter a project name.')
    if (!/^[a-zA-Z0-9-_ ]+$/.test(payload.projectName) || payload.projectName.toLowerCase() === 'default') {
      throw new Error('Project name may use letters, numbers, spaces, hyphens, or underscores.')
    }
    try {
      const repo = new URL(payload.repoUrl)
      if (!['https:', 'http:'].includes(repo.protocol)) throw new Error()
    } catch {
      throw new Error('Enter a valid repository URL.')
    }
    if (!payload.branch) throw new Error('Enter the repository branch.')
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(payload.subdomain)) {
      throw new Error('Subdomain must use lowercase letters, numbers, and single hyphens.')
    }
    if (isStatic && (!payload.buildCommand || !payload.publishDir)) {
      throw new Error('Build command and publish directory are required for a static project.')
    }
    if (!isStatic && !payload.startCommand) throw new Error('Enter a start command.')
    if (!isStatic && (!Number.isInteger(payload.port) || payload.port < 1 || payload.port > 65535)) {
      throw new Error('Port must be between 1 and 65535.')
    }
    return payload
  }

  async function createProject(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const payload = makePayload()
      let data

      if (!paid) {
        ;({ data } = await api.post('/project', { ...payload, plan: 'free' }))
      } else {
        if (!razorpayKey) throw new Error('Payment is not configured. Set VITE_RAZORPAY_KEY_ID to continue.')
        if (!razorpayReady || !window.Razorpay) throw new Error('Payment checkout is still loading. Please try again.')

        const { data: order } = await api.post('/project/payment/init', payload)
        const payment = await new Promise((resolve, reject) => {
          const checkout = new window.Razorpay({
            key: razorpayKey,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'DeployHub',
            description: `${PLANS[plan].name} plan · ${months} month${months === 1 ? '' : 's'}`,
            order_id: order.orderId || order.id,
            prefill: { name: user?.fullName || '', email: user?.email || '' },
            handler: resolve,
            modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
          })
          checkout.on('payment.failed', (response) =>
            reject(new Error(response.error?.description || 'Payment could not be completed.')),
          )
          checkout.open()
        })

        ;({ data } = await api.post('/project/payment/verify', {
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_signature: payment.razorpay_signature,
        }))
      }

      const project = data.project || null
      addProject(project)
      setCreated({ ...data, projectName: project?.name || payload.projectName })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Project creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setCreated(null)
    setForm((current) => ({ ...current, projectName: '', repoUrl: '', branch: 'main', subdomain: '' }))
    setSubdomainEdited(false)
  }

  if (created) {
    return (
      <div className="project-created-card">
        <span className="project-created-icon"><Check size={27} /></span>
        <div className="eyebrow">{paid ? 'PAYMENT CONFIRMED' : 'PROJECT QUEUED'}</div>
        <h1>{created.projectName} is on its way.</h1>
        <p>{created.message || 'Your project was created successfully and its first build has been queued.'}</p>
        {created.subdomain && <div className="created-subdomain">{created.subdomain}</div>}
        <div className="created-actions">
          <button className="btn primary" onClick={resetForm}><Rocket size={16} />Create another</button>
          <button className="btn" onClick={() => navigate('/projects')}>Back to projects</button>
        </div>
      </div>
    )
  }

  return (
    <div className="new-project-page">
      <PageHeader
        eyebrow="PROJECT SETUP"
        title="Deploy a project"
        description="Choose a plan and connect the repository you want to deploy."
      >
        <Link className="btn" to="/projects"><ArrowLeft size={15} />Projects</Link>
      </PageHeader>

      <form className="project-setup-form" onSubmit={createProject}>
        <section className="project-form-section">
          <div className="project-form-section-heading">
            <span>01</span><div><h2>Choose a plan</h2><p>Plans determine your deployment features and supported runtimes.</p></div>
          </div>
          <div className="project-plan-grid">
            {supportedPlans.map(([id, item]) => (
              <button
                type="button"
                key={id}
                className={`project-plan-card ${plan === id ? 'is-selected' : ''}`}
                aria-pressed={plan === id}
                onClick={() => { setPlan(id); setError('') }}
              >
                <span className="project-plan-select">{plan === id && <Check size={13} />}</span>
                <strong>{item.name}</strong>
                <span className="project-plan-price">{item.price ? `₹${item.price.toLocaleString('en-IN')}` : 'Free'}<small>{item.price ? ' / month' : ''}</small></span>
                <span className="project-plan-description">{item.description}</span>
                <span className="project-plan-features">{item.features.join(' · ')}</span>
              </button>
            ))}
          </div>
          {paid && (
            <label className="project-field project-term-field">
              <span>Subscription term</span>
              <select value={months} onChange={(event) => setMonths(Number(event.target.value))}>
                {TERMS.map((term) => <option key={term} value={term}>{term} month{term === 1 ? '' : 's'}</option>)}
              </select>
              <small>Total: ₹{(PLANS[plan].price * months).toLocaleString('en-IN')}</small>
            </label>
          )}
        </section>

        <section className="project-form-section">
          <div className="project-form-section-heading">
            <span>02</span><div><h2>Project details</h2><p>Tell us what to build and where its source code lives.</p></div>
          </div>
          <div className="project-fields-grid">
            <label className="project-field">
              <span>Project name</span>
              <input value={form.projectName} onChange={(event) => changeField('projectName', event.target.value)} placeholder="My new app" maxLength={100} required />
            </label>
            <label className="project-field">
              <span>Runtime</span>
              <select value={projectType} onChange={(event) => changeType(event.target.value)}>
                {TYPES.map(([id, label]) => <option key={id} value={id} disabled={!PLANS[plan].types.includes(id)}>{label}</option>)}
              </select>
            </label>
            <label className="project-field">
              <span>Runtime version</span>
              <select value={form.version} onChange={(event) => changeField('version', event.target.value)}>
                {VERSIONS[projectType].map((version) => <option key={version} value={version}>{version}</option>)}
              </select>
            </label>
            {isGithubUser && !manualRepository ? (
              <div className="project-field github-repository-field">
                <span><Github size={14} /> GitHub repository</span>
                {repositories.length > 8 && (
                  <div className="github-repository-search">
                    <Search size={14} />
                    <input
                      aria-label="Search repositories"
                      value={repositoryQuery}
                      onChange={(event) => setRepositoryQuery(event.target.value)}
                      placeholder="Search your repositories"
                    />
                  </div>
                )}
                <select
                  value={form.repoUrl}
                  onChange={(event) => selectRepository(event.target.value)}
                  disabled={repositoriesLoading || !repositories.length}
                  required
                >
                  <option value="">
                    {repositoriesLoading ? 'Loading your repositories…' : 'Choose a repository'}
                  </option>
                  {filteredRepositories.map((repository) => (
                    <option key={repository.id} value={repository.html_url}>
                      {repository.full_name}{repository.private ? ' · Private' : ''}
                    </option>
                  ))}
                </select>
                {repositoriesLoading && <small className="github-repository-hint"><LoaderCircle size={13} className="spin" />Fetching repositories from GitHub…</small>}
                {!repositoriesLoading && repositoriesError && (
                  <small className="github-repository-error">{repositoriesError}</small>
                )}
                {!repositoriesLoading && !repositoriesError && repositories.length === 0 && (
                  <small className="github-repository-hint">No repositories were found for this GitHub account.</small>
                )}
                {(repositoriesError || repositories.length === 0) && !repositoriesLoading && (
                  <button type="button" className="github-repository-action" onClick={() => setManualRepository(true)}>
                    Enter a repository URL manually
                  </button>
                )}
              </div>
            ) : (
              <label className="project-field">
                <span>{isGithubUser ? 'Repository URL' : 'Git repository URL'}</span>
                <input value={form.repoUrl} onChange={(event) => changeField('repoUrl', event.target.value)} placeholder="https://github.com/you/repository" type="url" required />
                {isGithubUser && repositories.length > 0 && (
                  <button type="button" className="github-repository-action" onClick={() => setManualRepository(false)}>
                    Choose from my GitHub repositories
                  </button>
                )}
              </label>
            )}
            <label className="project-field">
              <span>Branch</span>
              <input value={form.branch} onChange={(event) => changeField('branch', event.target.value)} placeholder="main" required />
            </label>
            <label className="project-field">
              <span>Root directory</span>
              <input value={form.rootDirectory} onChange={(event) => changeField('rootDirectory', event.target.value)} placeholder="." />
            </label>
            <label className="project-field">
              <span>DeployHub subdomain</span>
              <div className="project-subdomain-input">
                <input value={form.subdomain} onChange={(event) => { setSubdomainEdited(true); changeField('subdomain', slugify(event.target.value)) }} placeholder="my-app" required />
                <span>.deployhub.cloud</span>
              </div>
            </label>
          </div>
        </section>

        <section className="project-form-section">
          <div className="project-form-section-heading">
            <span>03</span><div><h2>Build configuration</h2><p>Set the commands and environment values for this runtime.</p></div>
          </div>
          <div className="project-fields-grid">
            {isStatic ? (
              <>
                <label className="project-field"><span>Build command</span><input value={form.buildCommand} onChange={(event) => changeField('buildCommand', event.target.value)} placeholder="npm run build" required /></label>
                <label className="project-field"><span>Publish directory</span><input value={form.publishDir} onChange={(event) => changeField('publishDir', event.target.value)} placeholder="dist" required /></label>
              </>
            ) : (
              <>
                <label className="project-field"><span>Start command</span><input value={form.startCommand} onChange={(event) => changeField('startCommand', event.target.value)} placeholder="npm start" required /></label>
                <label className="project-field"><span>Application port</span><input value={form.port} onChange={(event) => changeField('port', event.target.value)} type="number" min="1" max="65535" required /></label>
              </>
            )}
            <label className="project-field project-env-field">
              <span>Environment variables <small>Optional · one KEY=value per line</small></span>
              <textarea value={form.envText} onChange={(event) => changeField('envText', event.target.value)} placeholder={'NODE_ENV=production\nAPI_URL=https://api.example.com'} rows={4} spellCheck="false" />
            </label>
          </div>
        </section>

        {error && <div className="project-form-error" role="alert"><CircleAlert size={17} />{error}</div>}

        {paid && (
          <div className="project-payment-note"><CreditCard size={17} /><span>Secure checkout opens after you continue. Your project is created only after payment verification.</span></div>
        )}

        <div className="project-form-footer">
          <p><Sparkles size={15} />{paid ? `₹${(PLANS[plan].price * months).toLocaleString('en-IN')} · ${months} month${months === 1 ? '' : 's'}` : 'Free plan · no payment required'}</p>
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? <LoaderCircle size={16} className="spin" /> : paid ? <CreditCard size={16} /> : <Rocket size={16} />}
            {submitting ? 'Setting up…' : paid ? 'Continue to payment' : 'Create free project'}
            {!submitting && <ArrowRight size={15} />}
          </button>
        </div>
      </form>
    </div>
  )
}
