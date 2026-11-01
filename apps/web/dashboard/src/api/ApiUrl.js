const defaultBaseUrl = import.meta.env.PROD
  ? 'https://api.deployhub.cloud/api/v1'
  : 'http://localhost:4999/api/v1'
export const BaseUrl = (import.meta.env.VITE_AUTH_API_URL || defaultBaseUrl).replace(/\/$/, '')
