import Github from './Github'
import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Box, Check, GitBranch, LoaderCircle, SearchX, X } from 'lucide-react'
import { timeAgo } from '../utils'

export function Logo({ compact = false }) {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="m8 29 12-20 12 20h-9l-3-7-4 7z" fill="currentColor" />
          <circle cx="32" cy="9" r="3" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <>
          deployhub<span className="brand-period">.</span>
        </>
      )}
    </span>
  )
}
export function StatusBadge({ status = 'unknown' }) {
  const normalized = String(status).toLowerCase()
  const success = ['running', 'success', 'ready', 'paid', 'active', 'not_required'].includes(
    normalized,
  )
  const progress = ['building', 'queued', 'pending', 'expiring'].includes(normalized)
  return (
    <span className={`status ${success ? 'positive' : progress ? 'pending' : 'negative'}`}>
      {progress ? (
        <LoaderCircle size={11} className={normalized === 'building' ? 'spin' : ''} />
      ) : (
        <span className="status-dot" />
      )}
      {{
        running: 'Ready',
        success: 'Ready',
        not_required: 'Free',
        building: 'Building',
        failed: 'Failed',
        queued: 'Queued',
      }[normalized] || normalized.replaceAll('_', ' ')}
    </span>
  )
}
export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  )
}
export function EmptyState({
  title = 'Nothing here yet',
  description = 'Your next great project starts here.',
  action,
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <SearchX size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
export function LoadState({ loading, error, retry, children }) {
  if (loading)
    return (
      <div className="loading-state" role="status">
        <LoaderCircle className="spin" size={24} />
        <span>Getting your workspace ready…</span>
      </div>
    )
  if (error)
    return (
      <div className="error-state" role="alert">
        <h3>We couldn’t load this view</h3>
        <p>{error}</p>
        <button className="btn" onClick={retry}>
          Try again
        </button>
      </div>
    )
  return children
}
export function Modal({ title, description, onClose, children, wide = false }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    return () => {
      dialog.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-heading">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}
export function RuntimeIcon({ type }) {
  return (
    <span className={`runtime-icon runtime-${type}`}>
      {type === 'static' ? (
        <svg viewBox="0 0 30 30" aria-hidden="true">
          <path d="M15 4 27 25H3Z" fill="currentColor" />
        </svg>
      ) : type === 'node' ? (
        <Box size={23} />
      ) : type === 'go' ? (
        'Go'
      ) : type === 'python' ? (
        'Py'
      ) : (
        'J'
      )}
    </span>
  )
}
export function ProjectCard({ project, list = false }) {
  return (
    <article className={`project-card ${list ? 'list-card' : ''}`}>
      <div className="project-card-top">
        <RuntimeIcon type={project.type} />
        <StatusBadge status={project.status} />
      </div>
      <Link className="project-title" to={`/project/${project._id}`}>
        {project.name}
        <ArrowRight size={16} />
      </Link>
      <p className="project-domain">
        {project.isMicroservice
          ? project.internalUrl || 'Internal service'
          : Array.isArray(project.domain)
            ? project.domain[0]
            : project.domain || 'Deployment pending'}
      </p>
      <div className="project-source">
        <Github size={13} />
        <span>{project.repoUrl?.split('/').slice(-2).join('/') || project.type}</span>
      </div>
      <div className="project-card-footer">
        <span>
          <GitBranch size={12} />
          {project.branch || 'Git source'}
        </span>
        <span>
          <span className="status-dot" aria-hidden="true" />
          {timeAgo(project.updatedAt)}
        </span>
      </div>
    </article>
  )
}
export function ChecklistItem({ children }) {
  return (
    <span className="checklist-item">
      <Check size={14} />
      {children}
    </span>
  )
}
