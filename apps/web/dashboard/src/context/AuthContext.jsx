/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api, attachInterceptors } from '../api/apiclient'
import { consumeStoredAuthRedirect } from '../routes/authRedirect'

const AuthContext = createContext()

const getTokenFromResponse = (data) => data?.AccessToken || data?.accessToken || null

const normalizeUser = (userData) => {
  if (!userData) return null

  return {
    ...userData,
    fullName: userData.fullName || userData.fullname || '',
  }
}

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const accessTokenRef = useRef(null)
  const userRef = useRef(null)
  const isLoggingOut = useRef(false)
  const navigate = useNavigate()

  const setToken = useCallback((token) => {
    accessTokenRef.current = token
    setAccessToken(token)
  }, [])

  const setCachedUser = useCallback((userData) => {
    const normalized = normalizeUser(userData)
    userRef.current = normalized
    setUser(normalized)
    return normalized
  }, [])

  const clearAuth = useCallback(() => {
    setToken(null)
    setCachedUser(null)
  }, [setCachedUser, setToken])

  const fetchUser = useCallback(async ({ skipAuthRefresh = false, force = false } = {}) => {
    if (userRef.current && !force) return userRef.current

    try {
      const res = await api.get('/auth/user/me', { skipAuthRefresh })
      const profile = res.data?.userData || res.data?.data || res.data?.user || null
      setCachedUser(profile)
      return profile
    } catch {
      setCachedUser(null)
      return null
    }
  }, [setCachedUser])

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await api.get('/auth/refresh/token')
      const token = getTokenFromResponse(res.data)

      if (!token) throw new Error('No token returned')

      setToken(token)
      // `/me` is cached for the lifetime of the auth context; token rotation
      // should not make every page reload the same profile.
      const profile = userRef.current || await fetchUser({ skipAuthRefresh: true })
      if (!profile) {
        clearAuth()
        return null
      }

      return token
    } catch {
      clearAuth()
      return null
    }
  }, [clearAuth, fetchUser, setToken])

  const logoutClean = useCallback(() => {
    if (isLoggingOut.current) return

    isLoggingOut.current = true
    clearAuth()
    navigate('/login', { replace: true })

    window.setTimeout(() => {
      isLoggingOut.current = false
    }, 1000)
  }, [clearAuth, navigate])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // The local auth state should be cleared even if the server session is already gone.
    }

    logoutClean()
  }, [logoutClean])

  useEffect(() => {
    const init = async () => {
      if (!accessTokenRef.current) {
        const token = await refreshAccessToken()
        const redirectTo = token ? consumeStoredAuthRedirect() : null

        if (redirectTo) {
          navigate(redirectTo, { replace: true })
        }
      }

      setIsAuthReady(true)
    }

    init()
  }, [navigate, refreshAccessToken])

  // Install before child page effects issue their first authenticated requests.
  useLayoutEffect(() => {
    const eject = attachInterceptors(() => accessTokenRef.current, refreshAccessToken, logoutClean)

    return eject
  }, [refreshAccessToken, logoutClean])

  const login = async (email, password, redirectTo = '/') => {
    const res = await api.post('/auth/login', { email, password })
    const token = getTokenFromResponse(res.data)

    if (!token) throw new Error('Login failed')

    setToken(token)
    const profile = await fetchUser({ force: true })
    if (!profile) {
      clearAuth()
      throw new Error('Could not load user profile')
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(accessToken && user),
        isAuthReady,
        user,
        fetchUser,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
