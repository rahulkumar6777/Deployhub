import axios from 'axios'
import { BaseUrl } from './ApiUrl'

export const api = axios.create({
  baseURL: BaseUrl,
  withCredentials: true,
  timeout: 20000,
})

let isRefreshing = false
let refreshSubscribers = []
let lastRateLimitNoticeAt = 0

const RATE_LIMIT_NOTICE_COOLDOWN_MS = 3000
const RATE_LIMIT_EVENT = 'deployhub:rate-limit'
const SERVICE_DOWN_EVENT = 'deployhub:service-down'

const notifyServerError = (error) => {
  const status = error.response?.status

  if (status !== 500 && status !== 503) return

  window.dispatchEvent(
    new CustomEvent(SERVICE_DOWN_EVENT, {
      detail: {
        status,
        message: error.response?.data?.message || 'Something went wrong. Please try again.',
        traceId: error.response?.data?.traceId || error.response?.headers?.['x-trace-id'] || null,
      },
    }),
  )
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      notifyRateLimit(error)
    }

    notifyServerError(error)

    return Promise.reject(error)
  },
)

function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

const skipRefreshUrls = [
  '/auth/refresh/token',
  '/auth/login',
  '/auth/logout',
  '/auth/register/init',
  '/auth/register/verify',
  '/auth/resendotp',
]

const shouldSkipRefresh = (url = '') => skipRefreshUrls.some((skipUrl) => url.includes(skipUrl))

const getRateLimitMessage = (error) => {
  const retryAfter = error.response?.headers?.['retry-after']
  const serverMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.errors?.[0]?.msg

  if (serverMessage) return serverMessage
  if (retryAfter) return `Too many requests. Try again in ${retryAfter}s.`

  return 'Too many requests. Please wait a moment and try again.'
}

const notifyRateLimit = (error) => {
  if (error.config?.skipRateLimitNotice || error.config?.skipRateLimitToast) {
    return
  }

  const now = Date.now()
  if (now - lastRateLimitNoticeAt < RATE_LIMIT_NOTICE_COOLDOWN_MS) return

  lastRateLimitNoticeAt = now
  window.dispatchEvent(
    new CustomEvent(RATE_LIMIT_EVENT, {
      detail: {
        message: getRateLimitMessage(error),
        retryAfter: error.response?.headers?.['retry-after'] || null,
      },
    }),
  )
}

export const attachInterceptors = (getToken, refreshToken, logout) => {
  const requestInterceptor = api.interceptors.request.use(
    (config) => {
      const token = getToken()

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error) => Promise.reject(error),
  )

  const responseInterceptor = api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (!error.response || !originalRequest) {
        return Promise.reject(error)
      }

      if (originalRequest.skipAuthRefresh) {
        return Promise.reject(error)
      }

      if (shouldSkipRefresh(originalRequest.url)) {
        return Promise.reject(error)
      }

      if (error.response.status !== 401 || originalRequest._retry) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              reject(error)
              return
            }

            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const newToken = await refreshToken()
        if (!newToken) throw new Error('Refresh failed')

        onRefreshed(newToken)
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        onRefreshed(null)
        logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    },
  )

  return () => {
    api.interceptors.request.eject(requestInterceptor)
    api.interceptors.response.eject(responseInterceptor)
  }
}

export { SERVICE_DOWN_EVENT }
