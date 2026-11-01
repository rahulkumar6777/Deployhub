import { useState } from 'react'
import { Check, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { themes } from '../theme'
import { Modal } from './ui'

export default function ThemePicker() {
  const { theme, selectTheme } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="theme-trigger"
        aria-label={`Choose theme, current theme: ${theme.name}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Palette size={17} />
        <span>Theme</span>
        <i style={{ background: theme.colors.accent }} />
      </button>
      {open && (
        <Modal
          title="Workspace appearance"
          description="Choose Light or Dark for your workspace."
          onClose={() => setOpen(false)}
        >
          <div className="theme-picker-intro">
            <span>
              {theme.dark ? <Moon size={15} /> : <Sun size={15} />}Currently using{' '}
              <strong>{theme.name}</strong>
            </span>
            <span>Applied instantly · Saved automatically</span>
          </div>
          <div className="theme-options" role="group" aria-label="Choose a theme">
            {themes.map((item) => (
              <button
                type="button"
                key={item.id}
                data-theme-option={item.id}
                className="theme-option"
                aria-pressed={theme.id === item.id}
                aria-label={`${item.name} theme`}
                onClick={() => selectTheme(item.id)}
              >
                <div
                  className="theme-preview"
                  aria-hidden="true"
                  style={{ background: item.colors.bg, borderColor: item.colors.line }}
                >
                  <div
                    className="theme-preview-sidebar"
                    style={{ background: item.colors.sidebar }}
                  >
                    <i style={{ background: item.colors.accent }} />
                    <span style={{ background: item.colors['sidebar-muted'] }} />
                    <span style={{ background: item.colors['sidebar-muted'] }} />
                  </div>
                  <div className="theme-preview-content">
                    <i style={{ background: item.colors.muted }} />
                    <div>
                      <span
                        style={{
                          background: item.colors.surface,
                          borderColor: item.colors.line,
                        }}
                      />
                      <span
                        style={{
                          background: item.colors.surface,
                          borderColor: item.colors.line,
                        }}
                      />
                    </div>
                    <b style={{ background: item.colors.tint }}>
                      <i style={{ background: item.colors.accent }} />
                    </b>
                  </div>
                  {theme.id === item.id && (
                    <span className="theme-selected-mark">
                      <Check size={13} />
                    </span>
                  )}
                </div>
                <span className="theme-option-name">
                  {item.name}
                  {item.dark ? <Moon size={12} /> : <Sun size={12} />}
                </span>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
          <div className="theme-picker-footer">
            <p>
              One choice, everywhere.
              <br />
              Your pages, charts, dialogs, and sign-in screens all follow your theme.
            </p>
            <button className="btn primary" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
