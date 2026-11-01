export const AUTH_REDIRECT_STORAGE_KEY = 'deployhub.auth.redirectTo'

export const safeRedirectPath = (path) => {
  if (typeof path !== 'string') return '/'

  const nextPath = path.trim()
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return '/'
  if (
    nextPath === '/login' ||
    nextPath === '/signup' ||
    nextPath.startsWith('/login?') ||
    nextPath.startsWith('/signup?') ||
    nextPath.startsWith('/login#') ||
    nextPath.startsWith('/signup#')
  ) {
    return '/'
  }

  return nextPath
}

export const redirectPathFromLocation = (location) => {
  if (!location || typeof location !== 'object') return '/'

  const pathname = location.pathname || '/'
  const search = location.search || ''
  const hash = location.hash || ''

  return safeRedirectPath(`${pathname}${search}${hash}`)
}

export const redirectPathFromState = (state) => redirectPathFromLocation(state?.from)

export const storeAuthRedirect = (path) => {
  try {
    sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, safeRedirectPath(path))
  } catch {
    // Ignore storage failures and keep the normal auth flow working.
  }
}

export const consumeStoredAuthRedirect = () => {
  try {
    const path = sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY)
    if (!path) return null

    sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
    return safeRedirectPath(path)
  } catch {
    return null
  }
}
